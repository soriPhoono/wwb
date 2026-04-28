import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";
import ProductCatalog from "../home/ProductCatalog.vue";

// Mock vue-router
vi.mock("vue-router", () => ({
  RouterLink: {
    template: "<a><slot /></a>",
  },
}));

// Mock the useCart composable
const mockAddToCart = vi.fn();
vi.mock("../../composables/useCart", () => {
  return {
    useCart: () => ({
      addToCart: mockAddToCart,
      canUseCart: true,
      getAvailableStock: vi.fn((id) => (id === 1 ? 5 : 0)),
    }),
    products: {
      value: [
        {
          id: 1,
          name: "Secure Item 1",
          price: 99.99,
          category: "Tech",
          description: "Test desc",
        },
        {
          id: 2,
          name: "Out of Stock Item",
          price: 49.99,
          category: "Accessory",
          description: "Test desc 2",
        },
      ],
    },
  };
});

describe("ProductCatalog.vue", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders correctly and displays products", () => {
    const wrapper = mount(ProductCatalog, {
      global: {
        stubs: ["RouterLink"],
      },
    });

    // Check if the title is rendered
    expect(wrapper.text()).toContain("Product Catalog");

    // Check if the mock products are rendered
    expect(wrapper.text()).toContain("Secure Item 1");
    expect(wrapper.text()).toContain("Out of Stock Item");

    // Check price rendering
    expect(wrapper.text()).toContain("$99.99");
  });

  it("displays correct stock availability status", () => {
    const wrapper = mount(ProductCatalog, {
      global: {
        stubs: ["RouterLink"],
      },
    });

    // Item 1 has 5 stock
    expect(wrapper.text()).toContain("5 In Stock");
    // Item 2 has 0 stock
    expect(wrapper.text()).toContain("0 In Stock");
  });

  it("calls addToCart when the button is clicked", async () => {
    const wrapper = mount(ProductCatalog, {
      global: {
        stubs: ["RouterLink"],
      },
    });

    const buttons = wrapper.findAll("button");
    expect(buttons.length).toBeGreaterThan(0);

    // Click the Add to Cart button for the first product
    await buttons[0].trigger("click");

    // Check if mockAddToCart was called with product id 1
    expect(mockAddToCart).toHaveBeenCalledTimes(1);
    expect(mockAddToCart).toHaveBeenCalledWith(1);
  });
});
