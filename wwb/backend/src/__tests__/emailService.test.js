import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockSend } = vi.hoisted(() => {
  return {
    mockSend: vi
      .fn()
      .mockResolvedValue({ data: { id: "test-email-id" }, error: null }),
  };
});

vi.hoisted(() => {
  process.env.RESEND_API_KEY = "re_test_key";
});

import { sendOrderConfirmation } from "../services/email.js";
import { Resend } from "resend";

vi.mock("resend", () => {
  return {
    Resend: vi.fn().mockImplementation(function () {
      return {
        emails: {
          send: mockSend,
        },
      };
    }),
  };
});

describe("Email Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should send an order confirmation email with correct details", async () => {
    const mockOrder = {
      _id: "order123",
      accessKey: "key456",
      totalAmount: 99.99,
      shippingDetails: {
        fullName: "John Doe",
        email: "john@example.com",
      },
      items: [{ name: "Premium Widget", quantity: 2, price: 49.995 }],
    };

    // We need to ensure RESEND_API_KEY is "set" for the service to initialize
    // In our implementation, we use readSecret which checks env or file
    process.env.RESEND_API_KEY = "re_test_key";
    process.env.FRONTEND_ORIGIN = "https://test.com";

    await sendOrderConfirmation(mockOrder);

    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        to: ["john@example.com"],
        subject: expect.stringContaining("Order Confirmed"),
        html: expect.stringContaining("order123"),
      }),
    );

    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        html: expect.stringContaining("order-details/order123"),
      }),
    );
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        html: expect.stringContaining("accessKey=key456"),
      }),
    );
  });

  it("should handle Resend errors gracefully", async () => {
    mockSend.mockResolvedValueOnce({
      data: null,
      error: { message: "API Error" },
    });

    const mockOrder = {
      _id: "order123",
      shippingDetails: { email: "test@test.com" },
      items: [],
      totalAmount: 0,
    };

    // Should not throw
    await expect(sendOrderConfirmation(mockOrder)).resolves.not.toThrow();
  });
});
