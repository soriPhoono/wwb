import { describe, it, expect, vi } from "vitest";

// Set environment variables before imports
vi.stubEnv("STRIPE_SECRET_KEY", "dummy_key");
vi.stubEnv("JWT_SECRET", "dummy_jwt");

import request from "supertest";
import app from "../server.js";
import mongoose from "mongoose";

// Mock MongoDB connection so tests don't require a real DB
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

describe("Server basic endpoints", () => {
  it("should return ok for the /api/health endpoint", async () => {
    const response = await request(app).get("/api/health");
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("status", "ok");
    expect(response.body).toHaveProperty("timestamp");
  });
});
