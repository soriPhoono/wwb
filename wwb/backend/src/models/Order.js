import { Schema, model } from "mongoose";

const orderSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    items: [
      {
        productId: {
          type: Number,
          required: true,
        },
        name: {
          type: String,
          required: true,
        },
        price: {
          type: Number,
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
        image: String,
      },
    ],
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ["pending", "completed", "cancelled"],
      default: "pending",
    },
    paymentMethod: {
      type: String,
      enum: ["stripe", "manual"],
      default: "stripe",
    },
    accessKey: {
      type: String,
      required: true,
      unique: true,
    },
    shippingDetails: {
      address: String,
      city: String,
      state: String,
      zipCode: String,
      phone: String,
    },
  },
  {
    timestamps: true,
  },
);

// Index for performance
orderSchema.index({ user: 1, createdAt: -1 });

export default model("Order", orderSchema);
