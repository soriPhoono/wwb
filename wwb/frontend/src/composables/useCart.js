import { ref, computed, watch } from "vue";
import { user } from "./useAuthState.js";

// Reactive products array fetched from backend
export const products = ref([]);

// Cookie utilities
function setCookie(name, value, days) {
  const date = new Date();
  date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
  const expires = "expires=" + date.toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)};${expires};path=/;SameSite=Lax`;
}

function getCookie(name) {
  const cookieName = name + "=";
  const decodedCookie = decodeURIComponent(document.cookie);
  const cookieArray = decodedCookie.split(";");

  for (let i = 0; i < cookieArray.length; i++) {
    let cookie = cookieArray[i].trim();
    if (cookie.indexOf(cookieName) === 0) {
      return cookie.substring(cookieName.length, cookie.length);
    }
  }
  return "";
}

// Global cart state singleton so multiple components share it
const cart = ref([]);
const isCartOpen = ref(false);

// Initialize cart from cookie once
const cartData = getCookie("shoppingCart");
if (cartData) {
  try {
    cart.value = JSON.parse(cartData);
  } catch (error) {
    console.error("Could not parse shopping cart cookie:", error);
    cart.value = [];
  }
}

// Internal flag to prevent sync loops during fetch/clear operations
let isHydrating = false;

// Watcher to save to cookie automatically whenever the cart changes
watch(
  cart,
  (newCart) => {
    setCookie("shoppingCart", JSON.stringify(newCart), 7);

    // If logged in and NOT currently hydrating from backend, sync to backend
    if (user.value && !isHydrating) {
      // Don't sync if user is staff
      const isStaff = user.value.roles?.some((role) =>
        ["admin", "content-creator"].includes(role),
      );
      if (isStaff) return;

      const { syncCart } = useCart();
      syncCart();
    }
  },
  { deep: true },
);

// Watch for user changes to handle login/logout transitions
watch(
  user,
  async (newUser, oldUser) => {
    if (newUser && !oldUser) {
      // Check if the new user is staff
      const isStaff = newUser.roles?.some((role) =>
        ["admin", "content-creator"].includes(role),
      );

      if (isStaff) {
        // Staff members shouldn't have a cart; clear any local guest cart
        const { clearCart } = useCart();
        clearCart();
      } else {
        // Regular customer login: fetch account cart
        const { fetchCart } = useCart();
        await fetchCart();
      }
    } else if (!newUser && oldUser) {
      // Logout: flush cart
      const { clearCart } = useCart();
      clearCart();
    }
  },
  { immediate: true }, // Handle initial app load rehydration
);

/**
 * Hydrates a list of { productId, quantity } into full cart items
 */
function hydrateCart(simpleCart) {
  return simpleCart
    .map((item) => {
      const product = products.value.find(
        (p) => (p.productId || p._id || p.id) === item.productId,
      );
      if (!product) return null;
      return {
        ...product,
        quantity: item.quantity,
      };
    })
    .filter(Boolean);
}

/**
 * Simplifies the cart for backend storage
 */
function simplifyCart(fullCart) {
  return fullCart.map((item) => ({
    productId: item.productId || item.id,
    quantity: item.quantity,
  }));
}

export const fetchProducts = async () => {
  try {
    const res = await fetch("/api/products");
    if (res.ok) {
      products.value = await res.json();
      // After products are loaded, validate the cart (especially important for guests)
      const { validateCart } = useCart();
      validateCart();
    }
  } catch (err) {
    console.error("Failed to fetch products:", err);
  }
};

export function useCart() {
  // Fetch products on initial composable usage if empty
  if (products.value.length === 0) {
    fetchProducts();
  }

  const fetchCart = async () => {
    try {
      const res = await fetch("/api/cart", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        // Overwrite local cart with backend data
        isHydrating = true;
        cart.value = hydrateCart(data.cart);
        // Reset flag after Vue has processed the change
        setTimeout(() => {
          isHydrating = false;
        }, 0);
      }
    } catch (err) {
      console.error("Failed to fetch cart:", err);
    }
  };

  const syncCart = async () => {
    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ cart: simplifyCart(cart.value) }),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Failed to sync cart.");
        // Optional: revert local cart if sync fails
        await fetchCart();
      } else {
        // Refresh product counts after successful sync
        await fetchProducts();
      }
    } catch (err) {
      console.error("Failed to sync cart:", err);
    }
  };

  const clearCart = () => {
    isHydrating = true;
    cart.value = [];
    setCookie("shoppingCart", "[]", -1); // Clear cookie
    setTimeout(() => {
      isHydrating = false;
    }, 0);
  };

  const getAvailableStock = (productId) => {
    const product = products.value.find(
      (p) => (p.productId || p._id || p.id) === productId,
    );
    if (!product) return 0;

    const myItem = cart.value.find(
      (item) => (item.productId || item._id || item.id) === productId,
    );
    const myQty = myItem ? myItem.quantity : 0;

    const othersClaimed = Math.max(0, (product.claimedCount || 0) - myQty);
    return Math.max(0, (product.stock || 0) - othersClaimed);
  };

  const addToCart = async (productId) => {
    const product = products.value.find(
      (item) => (item.productId || item._id || item.id) === productId,
    );
    if (!product) return;

    const available = getAvailableStock(productId);
    const existingItem = cart.value.find(
      (item) => (item.productId || item._id || item.id) === productId,
    );

    if (existingItem) {
      if (existingItem.quantity >= available) {
        alert(`Cannot add more. Only ${available} units available in total.`);
        return;
      }
      existingItem.quantity += 1;
    } else {
      if (available <= 0) {
        alert("This item is currently fully claimed by other users.");
        return;
      }
      cart.value.push({
        ...product,
        quantity: 1,
      });
    }
  };

  const removeFromCart = (productId) => {
    cart.value = cart.value.filter(
      (item) => (item.productId || item._id || item.id) !== productId,
    );
  };

  const updateQuantity = (productId, change) => {
    const item = cart.value.find(
      (product) =>
        (product.productId || product._id || product.id) === productId,
    );
    if (!item) return;

    if (change > 0) {
      const available = getAvailableStock(productId);
      if (item.quantity >= available) {
        alert(`Cannot add more. Only ${available} units available in total.`);
        return;
      }
    }

    item.quantity += change;

    if (item.quantity <= 0) {
      removeFromCart(productId);
    }
  };

  const toggleCart = () => {
    isCartOpen.value = !isCartOpen.value;
  };

  const cartTotal = computed(() => {
    return cart.value.reduce(
      (total, item) => total + item.price * item.quantity,
      0,
    );
  });

  const cartCount = computed(() => {
    return cart.value.reduce((count, item) => count + item.quantity, 0);
  });

  const canUseCart = computed(() => {
    if (!user.value) return true; // Guests can use local cart
    if (!user.value.roles) return true;
    const isStaff = user.value.roles.some((role) =>
      ["admin", "content-creator"].includes(role),
    );
    return !isStaff;
  });

  return {
    cart,
    isCartOpen,
    canUseCart,
    addToCart,
    removeFromCart,
    updateQuantity,
    toggleCart,
    cartTotal,
    cartCount,
    fetchCart,
    syncCart,
    clearCart,
    getAvailableStock,
    fetchProducts,
    validateCart: () => {
      if (products.value.length === 0) return;

      // Keep only items that exist in the products list
      const validCart = cart.value.filter((item) => {
        return products.value.some(
          (p) => (p.productId || p._id || p.id) === (item.productId || item.id),
        );
      });

      if (validCart.length !== cart.value.length) {
        console.log("Stripping non-existent products from guest cart.");
        cart.value = validCart;
        // The watcher on 'cart' will automatically update the cookie.
      }
    },
  };
}
