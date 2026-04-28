import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";
import Header from "../layout/Header.vue";

// Mock vue-router
vi.mock("vue-router", () => ({
  RouterLink: {
    template: "<a><slot /></a>",
  },
}));

const mockToggleCart = vi.fn();

// Mock dependencies
vi.mock("../../composables/useCart", () => ({
  useCart: () => ({
    cartCount: 3,
    toggleCart: mockToggleCart,
    canUseCart: true,
  }),
}));

// Provide a way to override auth state in tests
let mockIsLoggedIn = false;
let mockUser = null;

vi.mock("../../composables/useAuth", () => ({
  useAuth: () => ({
    get isLoggedIn() {
      return mockIsLoggedIn;
    },
    get user() {
      return mockUser;
    },
  }),
}));

describe("Header.vue", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsLoggedIn = false;
    mockUser = null;
  });

  it("renders correctly with default navigation links", () => {
    const wrapper = mount(Header, {
      global: {
        stubs: {
          RouterLink: { template: "<a><slot /></a>" },
          UserMenu: true,
        },
      },
    });

    expect(wrapper.text()).toContain("SecureCart");
    expect(wrapper.text()).toContain("Home");
    expect(wrapper.text()).toContain("Shop");
    expect(wrapper.text()).toContain("Sign In");
    // Cart button should have correct count
    expect(wrapper.text()).toContain("Cart (3)");
  });

  it("displays user menu when logged in instead of sign in button", () => {
    mockIsLoggedIn = true;
    const wrapper = mount(Header, {
      global: {
        stubs: {
          RouterLink: { template: "<a><slot /></a>" },
          UserMenu: { template: '<div class="stub-user-menu">User Menu</div>' },
        },
      },
    });

    expect(wrapper.text()).not.toContain("Sign In");
    expect(wrapper.text()).toContain("User Menu");
  });

  it("displays admin link when user has admin role", () => {
    mockIsLoggedIn = true;
    mockUser = { roles: ["admin"] };

    const wrapper = mount(Header, {
      global: {
        stubs: {
          RouterLink: { template: "<a><slot /></a>" },
          UserMenu: true,
        },
      },
    });

    expect(wrapper.text()).toContain("Admin");
  });

  it("calls toggleCart when cart button is clicked", async () => {
    const wrapper = mount(Header, {
      global: {
        stubs: {
          RouterLink: true,
          UserMenu: true,
        },
      },
    });

    const cartButton = wrapper.find("#cart-button");
    expect(cartButton.exists()).toBe(true);

    await cartButton.trigger("click");
    expect(mockToggleCart).toHaveBeenCalled();
  });
});
