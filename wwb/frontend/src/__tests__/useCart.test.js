import { describe, it, expect, beforeEach, vi } from "vitest";
import { useCart, products } from "../composables/useCart.js";

// Mock document.cookie
Object.defineProperty(document, "cookie", {
  writable: true,
  value: "",
});

describe("useCart Composable", () => {
  beforeEach(() => {
    const { clearCart } = useCart();
    clearCart();
    products.value = [
      { productId: 1, name: "Product 1", price: 10, stock: 5 },
      { productId: 2, name: "Product 2", price: 20, stock: 10 },
    ];
    vi.clearAllMocks();
  });

  it("should add items to the cart", () => {
    const { cart, addToCart } = useCart();
    addToCart(1);
    expect(cart.value).toHaveLength(1);
    expect(cart.value[0].productId).toBe(1);
    expect(cart.value[0].quantity).toBe(1);
  });

  it("should increase quantity if item already in cart", () => {
    const { cart, addToCart } = useCart();
    addToCart(1);
    addToCart(1);
    expect(cart.value).toHaveLength(1);
    expect(cart.value[0].quantity).toBe(2);
  });

  it("should not add item if stock is exceeded", () => {
    // Mock alert
    const alertMock = vi.spyOn(window, "alert").mockImplementation(() => {});
    const { cart, addToCart } = useCart();

    // Add 5 items (max stock)
    for (let i = 0; i < 5; i++) addToCart(1);
    expect(cart.value[0].quantity).toBe(5);

    // Add 6th item
    addToCart(1);
    expect(cart.value[0].quantity).toBe(5);
    expect(alertMock).toHaveBeenCalled();
  });

  it("should remove items from the cart", () => {
    const { cart, addToCart, removeFromCart } = useCart();
    addToCart(1);
    removeFromCart(1);
    expect(cart.value).toHaveLength(0);
  });

  it("should validate and strip non-existent products", () => {
    const { cart, validateCart } = useCart();

    // Manually push a non-existent product
    cart.value.push({ productId: 99, name: "Ghost", price: 0, quantity: 1 });

    validateCart();
    expect(cart.value).toHaveLength(0);
  });
});
