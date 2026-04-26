import { ref, computed, watch } from "vue";
import { user } from "./useAuthState.js";

// Pre-defined static products array (could be moved to a separate file or fetched from backend later)
export const products = [
  {
    id: 1,
    name: "Network Security Handbook",
    price: 29.99,
    category: "Books",
    description: "A sample product for the secure e-commerce catalog.",
  },
  {
    id: 2,
    name: "MFA Setup Guide",
    price: 19.99,
    category: "Guides",
    description: "A beginner-friendly guide to multifactor authentication.",
  },
  {
    id: 3,
    name: "Secure Checkout Toolkit",
    price: 39.99,
    category: "Software",
    description: "A demo toolkit representing checkout protection resources.",
  },
  {
    id: 4,
    name: "Privacy Protection Bundle",
    price: 24.99,
    category: "Bundles",
    description: "A bundle representing privacy and security support items.",
  },
];

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
      // Login or session rehydration: fetch account cart
      const { fetchCart } = useCart();
      await fetchCart();
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
      const product = products.find((p) => p.id === item.productId);
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
    productId: item.id,
    quantity: item.quantity,
  }));
}

export function useCart() {
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
      await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ cart: simplifyCart(cart.value) }),
      });
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

  const addToCart = async (productId) => {
    const product = products.find((item) => item.id === productId);
    if (!product) return;

    const existingItem = cart.value.find((item) => item.id === productId);

    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      cart.value.push({
        ...product,
        quantity: 1,
      });
    }
    // No explicit sync here; watcher handles it if we add logic there or call sync manually
  };

  const removeFromCart = (productId) => {
    cart.value = cart.value.filter((item) => item.id !== productId);
  };

  const updateQuantity = (productId, change) => {
    const item = cart.value.find((product) => product.id === productId);
    if (!item) return;

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

  return {
    cart,
    isCartOpen,
    addToCart,
    removeFromCart,
    updateQuantity,
    toggleCart,
    cartTotal,
    cartCount,
    fetchCart,
    syncCart,
    clearCart,
  };
}
