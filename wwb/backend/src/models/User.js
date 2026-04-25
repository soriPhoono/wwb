const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
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
  mfaEnabled: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
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

module.exports = mongoose.model('User', userSchema);
