import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { createTestApp } from "./testApp.js";
import User from "../models/User.js";
import Product from "../models/Product.js";
import jwt from "jsonwebtoken";

// Mock the models
vi.mock("../models/User.js");
vi.mock("../models/Product.js");
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
        cart: [{ productId: 1, quantity: 2 }],
      });

      const res = await request(app)
        .get("/api/cart")
        .set("Cookie", ["token=fake-token"]);

      expect(res.status).toBe(200);
      expect(res.body.cart).toEqual([{ productId: 1, quantity: 2 }]);
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
});
