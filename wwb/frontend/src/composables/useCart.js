import { ref, computed, watch } from "vue";

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

// Watcher to save to cookie automatically whenever the cart changes
watch(
  cart,
  (newCart) => {
    setCookie("shoppingCart", JSON.stringify(newCart), 7);
  },
  { deep: true },
);

export function useCart() {
  const addToCart = (productId) => {
    const product = products.find((item) => item.id === productId);
    if (!product) return;

    const existingItem = cart.value.find((item) => item.id === productId);

    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      cart.value.push({
        id: product.id,
        name: product.name,
        price: product.price,
        quantity: 1,
      });
    }
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
  };
}
