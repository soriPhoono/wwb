import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { createTestApp } from "./testApp.js";
import User from "../models/User.js";
import Product from "../models/Product.js";
import jwt from "jsonwebtoken";

// Mock the models
vi.mock("../models/User.js");
vi.mock("../models/Product.js", () => ({
  default: {
    find: vi.fn().mockReturnThis(),
    lean: vi.fn(),
  },
}));
vi.mock("../middleware/auth.js", async () => {
  const actual = await vi.importActual("../middleware/auth.js");
  return {
    ...actual,
    requireAuth: (req, res, next) => {
      req.userId = "test-user-id";
      req.userRoles = [];
      next();
    },
  };
});

const app = createTestApp();

describe("Cart API Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/cart", () => {
    it("should return the user cart", async () => {
      User.findById.mockResolvedValue({
        _id: "test-user-id",
        roles: [],
        cart: [{ productId: "1", quantity: 2 }],
      });

      const res = await request(app)
        .get("/api/cart")
        .set("Cookie", ["token=fake-token"]);

      expect(res.status).toBe(200);
      expect(res.body.cart).toEqual([{ productId: "1", quantity: 2 }]);
    });

    it("should return 403 for staff members", async () => {
      User.findById.mockResolvedValue({
        _id: "test-user-id",
        roles: ["admin"],
        cart: [],
      });

      const res = await request(app)
        .get("/api/cart")
        .set("Cookie", ["token=fake-token"]);

      expect(res.status).toBe(403);
      expect(res.body.error).toBe("Staff members cannot use the cart system.");
    });
  });

  describe("POST /api/cart", () => {
    it("should sync cart with string IDs", async () => {
      const mockUser = {
        _id: "test-user-id",
        roles: [],
        save: vi.fn().mockResolvedValue(true),
      };
      User.findById.mockResolvedValue(mockUser);
      Product.lean.mockResolvedValue([
        { _id: "abc", productId: "1", stock: 10, name: "Test" },
      ]);
      User.aggregate.mockResolvedValue([]); // No other users have claimed

      const res = await request(app)
        .post("/api/cart")
        .send({
          cart: [{ productId: "abc", quantity: 1 }],
        })
        .set("Cookie", ["token=fake-token"]);

      expect(res.status).toBe(200);
      expect(mockUser.cart).toEqual([{ productId: "abc", quantity: 1 }]);
      expect(mockUser.save).toHaveBeenCalled();
    });

    it("should filter out invalid ObjectIds to prevent CastError", async () => {
      const mockUser = {
        _id: "test-user-id",
        roles: [],
        save: vi.fn().mockResolvedValue(true),
      };
      User.findById.mockResolvedValue(mockUser);
      Product.lean.mockResolvedValue([
        {
          _id: "60d5ecb8b0e9c42c88f1e1a1",
          productId: "prod_1",
          stock: 10,
          name: "Test",
        },
      ]);
      User.aggregate.mockResolvedValue([]); // No other users have claimed

      await request(app)
        .post("/api/cart")
        .send({
          cart: [
            { productId: "prod_1", quantity: 1 },
            { productId: "invalid_id_123", quantity: 1 },
            { productId: "60d5ecb8b0e9c42c88f1e1a1", quantity: 1 },
          ],
        })
        .set("Cookie", ["token=fake-token"]);

      expect(Product.find).toHaveBeenCalledWith({
        $or: [
          {
            productId: {
              $in: ["prod_1", "invalid_id_123", "60d5ecb8b0e9c42c88f1e1a1"],
            },
          },
          { _id: { $in: ["60d5ecb8b0e9c42c88f1e1a1"] } },
        ],
      });
    });

    it("should handle numeric productId even if passed as string", async () => {
      const mockUser = {
        _id: "test-user-id",
        roles: [],
        save: vi.fn().mockResolvedValue(true),
      };
      User.findById.mockResolvedValue(mockUser);
      Product.lean.mockResolvedValue([
        { _id: "some-id", productId: 2, stock: 10, name: "Test" },
      ]);
      User.aggregate.mockResolvedValue([]);

      const res = await request(app)
        .post("/api/cart")
        .send({
          cart: [{ productId: "2", quantity: 1 }],
        })
        .set("Cookie", ["token=fake-token"]);

      expect(res.status).toBe(200);
      expect(mockUser.cart).toEqual([{ productId: "2", quantity: 1 }]);
    });
  });
});
