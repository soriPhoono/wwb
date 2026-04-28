import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";
import CartPanel from "../layout/CartPanel.vue";

// Mock vue-router
vi.mock("vue-router", () => ({
  RouterLink: {
    template: "<a><slot /></a>",
  },
}));

// Mock the useCart composable
const mockToggleCart = vi.fn();
const mockUpdateQuantity = vi.fn();
const mockRemoveFromCart = vi.fn();

vi.mock("../../composables/useCart", () => {
  return {
    useCart: () => ({
      cart: [
        { id: 1, name: "Item 1", price: 10, quantity: 2 },
        { id: 2, name: "Item 2", price: 20, quantity: 1 },
      ],
      isCartOpen: true,
      toggleCart: mockToggleCart,
      updateQuantity: mockUpdateQuantity,
      removeFromCart: mockRemoveFromCart,
      cartTotal: 40,
      canUseCart: true,
      getAvailableStock: vi.fn((id) => 5),
    }),
  };
});

describe("CartPanel.vue", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders cart panel when canUseCart is true", () => {
    const wrapper = mount(CartPanel, {
      global: {
        stubs: ["router-link"],
      },
    });

    // Contains header
    expect(wrapper.text()).toContain("Your Cart");
    // Contains item names
    expect(wrapper.text()).toContain("Item 1");
    expect(wrapper.text()).toContain("Item 2");
    // Contains total price
    expect(wrapper.text()).toContain("$40.00");
  });

  it("calls toggleCart when close button is clicked", async () => {
    const wrapper = mount(CartPanel, {
      global: {
        stubs: ["router-link"],
      },
    });

    // Find the close button (times symbol button)
    const closeButton = wrapper
      .findAll("button")
      .find((btn) => btn.text().includes("×"));
    expect(closeButton).toBeDefined();

    await closeButton.trigger("click");
    expect(mockToggleCart).toHaveBeenCalled();
  });

  it("calls updateQuantity when +/- buttons are clicked", async () => {
    const wrapper = mount(CartPanel, {
      global: {
        stubs: ["router-link"],
      },
    });

    const buttons = wrapper.findAll("button");
    // Find the "+" button for the first item
    const plusButton = buttons.find((b) => b.text() === "+");
    await plusButton.trigger("click");

    expect(mockUpdateQuantity).toHaveBeenCalledWith(1, 1); // product id 1, delta 1
  });

  it("calls removeFromCart when remove button is clicked", async () => {
    const wrapper = mount(CartPanel, {
      global: {
        stubs: ["router-link"],
      },
    });

    const buttons = wrapper.findAll("button");
    const removeButton = buttons.find((b) => b.text() === "Remove");
    await removeButton.trigger("click");

    expect(mockRemoveFromCart).toHaveBeenCalledWith(1); // product id 1
  });
});
