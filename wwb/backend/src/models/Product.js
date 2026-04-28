import { Schema, model } from "mongoose";

const productSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    details: {
      type: String,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    image: {
      type: String, // URL or path to image
      default: null,
    },
    category: {
      type: String,
      trim: true,
      default: "Uncategorized",
    },
    stock: {
      type: Number,
      default: 0,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    // Optional: numeric ID if the frontend/cart system expects it
    productId: {
      type: String,
      unique: true,
      sparse: true,
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
  },
);

productSchema.index({ isActive: 1, createdAt: -1 });

// Pre-save hook to auto-increment productId if not provided
// Note: In a production environment, a separate counter collection is better.
// For this school project, we'll keep it simple or just rely on the user/admin to provide it.
// Or we can just use the MongoDB _id and update the cart later.
// Let's stick to the props proposed.

export default model("Product", productSchema);
