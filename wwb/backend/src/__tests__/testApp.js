import express, { json } from "express";
import cookieParser from "cookie-parser";
import cartRoutes from "../routes/cart.js";

export function createTestApp() {
  const app = express();
  app.use(json());
  app.use(cookieParser());

  // Minimal route setup for testing
  app.use("/api/cart", cartRoutes);

  return app;
}
