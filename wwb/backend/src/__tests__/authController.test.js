import { describe, it, expect, vi, beforeEach } from "vitest";

// Stub environments
vi.stubEnv("STRIPE_SECRET_KEY", "dummy_key");
vi.stubEnv("JWT_SECRET", "dummy_jwt");

import request from "supertest";
import app from "../server.js";
import User from "../models/User.js";
import { hash } from "bcryptjs";

// Mock Mongoose connect
vi.mock("mongoose", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    default: {
      ...actual.default,
      connect: vi.fn().mockResolvedValue(true),
    },
    connect: vi.fn().mockResolvedValue(true),
  };
});

// Mock Twilio to avoid sending real texts
vi.mock("../services/twilio.js", () => ({
  sendVerificationCode: vi.fn().mockResolvedValue(true),
  checkVerificationCode: vi.fn().mockResolvedValue(true),
  normalizePhoneNumber: vi.fn((phone) => phone),
}));

// Mock User Model methods
vi.mock("../models/User.js", async (importOriginal) => {
  return {
    default: {
      findOne: vi.fn(),
      create: vi.fn(),
      findById: vi.fn(),
      findByIdAndUpdate: vi.fn(),
      findByIdAndDelete: vi.fn(),
      countDocuments: vi.fn().mockResolvedValue(1),
    },
  };
});

describe("Auth Controller", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("POST /api/auth/register", () => {
    it("should return 400 if email or password is missing", async () => {
      const res = await request(app).post("/api/auth/register").send({
        email: "test@example.com",
      });
      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Email and password are required.");
    });

    it("should return 409 if user already exists", async () => {
      User.findOne.mockResolvedValue({ email: "test@example.com" });

      const res = await request(app).post("/api/auth/register").send({
        email: "test@example.com",
        password: "password123",
      });
      expect(res.status).toBe(409);
      expect(res.body.error).toBe("An account with that email already exists.");
    });

    it("should register successfully and return user object", async () => {
      User.findOne.mockResolvedValue(null);
      const mockUser = {
        _id: "fake_id",
        email: "new@example.com",
        roles: ["user"],
        toSafeObject: () => ({ id: "fake_id", email: "new@example.com" }),
      };
      User.create.mockResolvedValue(mockUser);

      const res = await request(app).post("/api/auth/register").send({
        email: "new@example.com",
        password: "password123",
      });

      expect(res.status).toBe(201);
      expect(res.body.user).toBeDefined();
      expect(res.body.user.email).toBe("new@example.com");
      expect(res.headers["set-cookie"]).toBeDefined(); // Token is set
    });
  });

  describe("POST /api/auth/login", () => {
    it("should return 401 for invalid credentials", async () => {
      User.findOne.mockResolvedValue(null);

      const res = await request(app).post("/api/auth/login").send({
        email: "test@example.com",
        password: "wrong",
      });
      expect(res.status).toBe(401);
      expect(res.body.error).toBe("Invalid email or password.");
    });

    it("should return 200 and a token cookie for valid credentials", async () => {
      const passwordHash = await hash("password123", 4);
      User.findOne.mockResolvedValue({
        _id: "fake_id",
        email: "test@example.com",
        passwordHash,
        roles: ["user"],
        toSafeObject: () => ({ id: "fake_id", email: "test@example.com" }),
      });

      const res = await request(app).post("/api/auth/login").send({
        email: "test@example.com",
        password: "password123",
      });

      expect(res.status).toBe(200);
      expect(res.body.user).toBeDefined();
      expect(res.body.user.email).toBe("test@example.com");
      expect(res.headers["set-cookie"]).toBeDefined();
    });
  });
});
