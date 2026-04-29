import { ref, computed, watch } from "vue";
import { user } from "./useAuth.js";

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

// Helper to compare product identifiers robustly
export const compareIds = (idA, idB) => {
  if (!idA || !idB) return false;
  const getStr = (obj) => {
    if (typeof obj === "string" || typeof obj === "number") return String(obj);
    return String(obj.productId || obj._id || obj.id || "");
  };
  const strA = getStr(idA);
  const strB = getStr(idB);
  return strA !== "" && strA === strB;
};

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
    // Save simplified version to cookie to keep it under 4KB limit
    setCookie("shoppingCart", JSON.stringify(simplifyCart(newCart)), 7);

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
 * @param {Array} simpleCart - The list of minimal item objects
 * @param {Boolean} stripMissing - If true, items not found in 'products' will be removed
 */
function hydrateCart(simpleCart, stripMissing = false) {
  return simpleCart
    .map((item) => {
      const product = products.value.find((p) => compareIds(p, item));
      if (product) {
        return {
          ...product,
          quantity: item.quantity,
        };
      }

      // If backend is unreachable or product missing, handle based on stripMissing
      // Guests visiting the site should have their carts purged of truly non-existent items
      return stripMissing ? null : item;
    })
    .filter(Boolean);
}

/**
 * Simplifies the cart for backend storage
 */
function simplifyCart(fullCart) {
  return fullCart.map((item) => ({
    productId: String(item.productId || item._id || item.id),
    quantity: item.quantity,
  }));
}

export const fetchProducts = async () => {
  try {
    const res = await fetch("/api/products");
    if (res.ok) {
      products.value = await res.json();
      // After products are loaded, perform a deep hydration/validation of the local cart.
      // This will automatically strip any items that are no longer in the database (isActive: false or deleted).
      isHydrating = true;
      cart.value = hydrateCart(simplifyCart(cart.value), true);
      setTimeout(() => {
        isHydrating = false;
      }, 0);
    }
  } catch (err) {
    console.error("Failed to fetch products:", err);
  }
};

export function useCart() {
  // Fetch products on initial composable usage if empty
  // Auto-fetch products if list is empty
  if (
    products.value.length === 0 &&
    typeof process !== "undefined" &&
    process.env?.NODE_ENV !== "test"
  ) {
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
      alert(
        "A connection error occurred. Your changes may not have been saved.",
      );
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

  const getAvailableStock = (productIdOrProduct) => {
    let product;
    let productId;

    if (
      typeof productIdOrProduct === "object" &&
      productIdOrProduct !== null &&
      !Array.isArray(productIdOrProduct)
    ) {
      product = productIdOrProduct;
      productId = product.productId || product._id || product.id;
    } else {
      productId = productIdOrProduct;
    }

    // Always prefer the object from the global 'products' list if it exists,
    // as it is more likely to be the most recently fetched/synced data.
    const globalProduct = products.value.find((p) => compareIds(p, productId));
    if (globalProduct) {
      product = globalProduct;
    }

    if (!product) return 0;

    const myItem = cart.value.find((item) => compareIds(item, productId));
    const myQty = myItem ? myItem.quantity : 0;

    const totalClaimedInDB = product.claimedCount || 0;
    const stock = product.stock || 0;

    // Logic: Remaining = Total Stock - Others' Claims - My Local Claims
    // For logged-in users, we assume totalClaimedInDB already includes myQty (synced).
    // For guests, totalClaimedInDB does NOT include myQty.
    let remaining;
    if (user.value) {
      // Logged in: myQty is already accounted for in totalClaimedInDB
      remaining = stock - totalClaimedInDB;
    } else {
      // Guest: myQty is NOT in totalClaimedInDB
      remaining = stock - totalClaimedInDB - myQty;
    }

    return Math.max(0, remaining);
  };

  const addToCart = async (productId) => {
    const product = products.value.find((p) => compareIds(p, productId));
    if (!product) return;

    const remaining = getAvailableStock(productId);
    const existingItem = cart.value.find((item) => compareIds(item, productId));

    if (existingItem) {
      if (remaining <= 0) {
        alert("Cannot add more. No units available.");
        return;
      }
      existingItem.quantity += 1;
    } else {
      if (remaining <= 0) {
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
    cart.value = cart.value.filter((item) => {
      const itemId = item.productId || item._id || item.id;
      return String(itemId) !== String(productId);
    });
  };

  const updateQuantity = (productId, change) => {
    const item = cart.value.find((product) => compareIds(product, productId));
    if (!item) return;

    if (change > 0) {
      const remaining = getAvailableStock(productId);
      if (remaining <= 0) {
        alert("Cannot add more. No units available.");
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
      (total, item) => total + (item.price || 0) * item.quantity,
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
    hydrateCart,
    simplifyCart,
  };
}
