const products = [
  {
    id: 1,
    name: "Network Security Handbook",
    price: 29.99,
    category: "Books",
    description: "A sample product for the secure e-commerce catalog."
  },
  {
    id: 2,
    name: "MFA Setup Guide",
    price: 19.99,
    category: "Guides",
    description: "A beginner-friendly guide to multifactor authentication."
  },
  {
    id: 3,
    name: "Secure Checkout Toolkit",
    price: 39.99,
    category: "Software",
    description: "A demo toolkit representing checkout protection resources."
  },
  {
    id: 4,
    name: "Privacy Protection Bundle",
    price: 24.99,
    category: "Bundles",
    description: "A bundle representing privacy and security support items."
  }
];

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

function saveCart(cart) {
  setCookie("shoppingCart", JSON.stringify(cart), 7);
}

function loadCart() {
  const cartData = getCookie("shoppingCart");
  if (!cartData) return [];

  try {
    return JSON.parse(cartData);
  } catch (error) {
    console.error("Could not parse shopping cart cookie:", error);
    return [];
  }
}

let cart = loadCart();

function addToCart(productId) {
  const product = products.find(item => item.id === productId);
  if (!product) return;

  const existingItem = cart.find(item => item.id === productId);

  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      price: product.price,
      quantity: 1
    });
  }

  saveCart(cart);
  renderCart();
}

function removeFromCart(productId) {
  cart = cart.filter(item => item.id !== productId);
  saveCart(cart);
  renderCart();
}

function updateQuantity(productId, change) {
  const item = cart.find(product => product.id === productId);
  if (!item) return;

  item.quantity += change;

  if (item.quantity <= 0) {
    removeFromCart(productId);
    return;
  }

  saveCart(cart);
  renderCart();
}

function getCartTotal() {
  return cart.reduce((total, item) => total + item.price * item.quantity, 0);
}

function getCartCount() {
  return cart.reduce((count, item) => count + item.quantity, 0);
}

function renderCart() {
  const cartItemsContainer = document.getElementById("cart-items");
  const cartTotalElement = document.getElementById("cart-total");
  const cartCountElement = document.getElementById("cart-count");

  if (!cartItemsContainer || !cartTotalElement || !cartCountElement) return;

  cartItemsContainer.innerHTML = "";

  if (cart.length === 0) {
    cartItemsContainer.innerHTML = "<p>Your cart is empty.</p>";
  } else {
    cart.forEach(item => {
      const cartItem = document.createElement("div");
      cartItem.className = "cart-item";
      cartItem.innerHTML = `
        <div>
          <h4>${item.name}</h4>
          <p>$${item.price.toFixed(2)} each</p>
          <div class="cart-controls">
            <button onclick="updateQuantity(${item.id}, -1)">-</button>
            <span>${item.quantity}</span>
            <button onclick="updateQuantity(${item.id}, 1)">+</button>
            <button onclick="removeFromCart(${item.id})">Remove</button>
          </div>
        </div>
      `;
      cartItemsContainer.appendChild(cartItem);
    });
  }

  cartTotalElement.textContent = `$${getCartTotal().toFixed(2)}`;
  cartCountElement.textContent = getCartCount();
}

function renderProducts() {
  const productContainer = document.getElementById("product-list");
  if (!productContainer) return;

  productContainer.innerHTML = "";

  products.forEach(product => {
    const productCard = document.createElement("article");
    productCard.className = "product-card";
    productCard.innerHTML = `
      <h3>${product.name}</h3>
      <p><strong>Category:</strong> ${product.category}</p>
      <p>${product.description}</p>
      <p class="price">$${product.price.toFixed(2)}</p>
      <button onclick="addToCart(${product.id})">Add to Cart</button>
    `;
    productContainer.appendChild(productCard);
  });
}

function toggleCart() {
  const cartPanel = document.getElementById("cart-panel");
  if (cartPanel) {
    cartPanel.classList.toggle("open");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  renderProducts();
  renderCart();

  const cartButton = document.getElementById("cart-button");
  if (cartButton) {
    cartButton.addEventListener("click", toggleCart);
  }
});
