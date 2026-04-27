import express, { json } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { connectDB } from "./db.js";
import authRoutes from "./routes/auth.js";
import cartRoutes from "./routes/cart.js";
import adminRoutes from "./routes/admin.js";
import productRoutes from "./routes/products.js";
import { initializeAdmin } from "./services/init.js";

const app = express();
const PORT = process.env.API_PORT || 3000;

// Connect to MongoDB
connectDB().then(() => {
  initializeAdmin();
});

// Middleware
app.use(
  cors({
    origin: process.env.FRONTEND_ORIGIN || "http://localhost:5173",
    credentials: true, // Required for HttpOnly cookies to be sent cross-origin in dev
  }),
);
app.use(json());
app.use(cookieParser());
app.use("/uploads", express.static("uploads"));

// API Routes
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api/auth", authRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/products", productRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
