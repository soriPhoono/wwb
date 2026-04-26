import { Schema, model } from "mongoose";

const userSchema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  passwordHash: {
    type: String,
    required: true,
  },
  // Stored at registration for SMS MFA — opt-in
  phone: {
    type: String,
    default: null,
  },
  pendingPhone: {
    type: String,
    default: null,
  },
  mfaEnabled: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  cart: [
    {
      productId: { type: Number, required: true },
      quantity: { type: Number, required: true, default: 1 },
    },
  ],
});

// Strip sensitive fields before sending to client
userSchema.methods.toSafeObject = function () {
  return {
    id: this._id,
    email: this.email,
    phone: this.phone,
    mfaEnabled: this.mfaEnabled,
    createdAt: this.createdAt,
  };
};

export default model("User", userSchema);
