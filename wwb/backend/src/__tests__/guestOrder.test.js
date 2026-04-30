import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import app from "../server.js";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import User from "../models/User.js";

vi.mock("../services/stripe.js", () => ({
  createPaymentIntent: vi.fn(() =>
    Promise.resolve({ client_secret: "test_secret" }),
  ),
  retrievePaymentIntent: vi.fn(() =>
    Promise.resolve({ status: "succeeded", id: "pi_test" }),
  ),
}));

vi.mock("../services/email.js", () => ({
  sendOrderConfirmation: vi.fn(() => Promise.resolve()),
}));

// Mock MongoDB models
vi.mock("../db.js", () => ({
  connectDB: vi.fn(() => Promise.resolve()),
}));

import { sendOrderConfirmation } from "../services/email.js";

describe("Guest Order API", () => {
  beforeEach(async () => {
    // We don't actually need to mock deleteMany if we are using an in-memory DB or if we mock the models entirely,
    // but here we expect the real models to work with a mocked connection (which they won't unless we use a test DB).
    // Given the previous tests, they probably use a real but local/test DB or mock the models.
    // Let's check how other tests do it.
  });

  it("should allow a guest to create a payment intent by providing items", async () => {
    // Mock Product.find
    vi.spyOn(Product, "find").mockResolvedValue([
      {
        productId: "prod_1",
        name: "Test Product",
        price: 100,
        isActive: true,
        stock: 10,
      },
    ]);

    const res = await request(app)
      .post("/api/orders/payment-intent")
      .send({
        items: [{ productId: "prod_1", quantity: 2 }],
        shippingDetails: { fullName: "Guest User", email: "guest@example.com" },
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("clientSecret");
  });

  it("should allow a guest to place an order", async () => {
    vi.spyOn(Product, "find").mockResolvedValue([
      {
        productId: "prod_1",
        name: "Test Product",
        price: 100,
        isActive: true,
        stock: 10,
      },
    ]);
    vi.spyOn(Product, "findOneAndUpdate").mockResolvedValue({});

    // Mock Order save
    vi.spyOn(Order.prototype, "save").mockImplementation(function () {
      this._id = "mock_order_id";
      return Promise.resolve(this);
    });

    const res = await request(app)
      .post("/api/orders")
      .send({
        paymentIntentId: "pi_test_bypass",
        shippingDetails: {
          fullName: "Guest User",
          email: "guest@example.com",
          address: "123 Guest St",
          city: "Guest City",
          state: "GS",
          zipCode: "00000",
          phone: "000-000-0000",
        },
        items: [{ productId: "prod_1", quantity: 1 }],
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("orderId");
    expect(res.body).toHaveProperty("accessKey");
    expect(sendOrderConfirmation).toHaveBeenCalled();

    // Verify purchaseCount increment
    expect(Product.findOneAndUpdate).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        $inc: expect.objectContaining({ purchaseCount: 1 }),
      }),
      expect.anything(),
    );
  });

  it("should filter out invalid ObjectIds to prevent CastError when querying products", async () => {
    const findSpy = vi.spyOn(Product, "find").mockResolvedValue([
      {
        productId: "prod_1",
        name: "Test Product",
        price: 100,
        isActive: true,
        stock: 10,
      },
    ]);

    await request(app)
      .post("/api/orders/payment-intent")
      .send({
        items: [
          { productId: "prod_1", quantity: 1 },
          { productId: "invalid_id_format_123", quantity: 1 },
          { productId: "60d5ecb8b0e9c42c88f1e1a1", quantity: 1 },
        ],
        shippingDetails: { fullName: "Guest User", email: "guest@example.com" },
      });

    // Expect the $or query to contain all IDs for productId, but ONLY the valid ObjectId for _id
    expect(findSpy).toHaveBeenCalledWith({
      $or: [
        {
          productId: {
            $in: [
              "prod_1",
              "invalid_id_format_123",
              "60d5ecb8b0e9c42c88f1e1a1",
            ],
          },
        },
        { _id: { $in: ["60d5ecb8b0e9c42c88f1e1a1"] } },
      ],
    });
  });

  it("should allow retrieving a guest order via access key", async () => {
    const mockOrder = {
      _id: "60d5ecb8b0e9c42c88f1e1a1",
      items: [
        { productId: "prod_1", name: "Test Product", price: 100, quantity: 1 },
      ],
      totalAmount: 100,
      shippingDetails: { fullName: "Guest User", email: "guest@example.com" },
      status: "completed",
      accessKey: "secret_key_123",
    };

    vi.spyOn(Order, "findById").mockResolvedValue(mockOrder);

    const res = await request(app).get(
      `/api/orders/guest/${mockOrder._id}?accessKey=secret_key_123`,
    );

    expect(res.status).toBe(200);
    expect(res.body._id).toBe(mockOrder._id);
    expect(res.body.accessKey).toBe("secret_key_123");
  });

  it("should deny access with incorrect access key", async () => {
    const mockOrder = {
      _id: "60d5ecb8b0e9c42c88f1e1a1",
      accessKey: "secret_key_123",
    };

    vi.spyOn(Order, "findById").mockResolvedValue(mockOrder);

    const res = await request(app).get(
      `/api/orders/guest/${mockOrder._id}?accessKey=wrong_key`,
    );

    expect(res.status).toBe(403);
  });
});
