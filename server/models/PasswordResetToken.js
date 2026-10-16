// ============================================================
// PasswordResetToken model
// ------------------------------------------------------------
// One-time tokens issued when a user requests a password reset.
// Tokens expire after 1 hour and are single-use.
// ============================================================

const { mongoose } = require("../db");

const resetSchema = new mongoose.Schema(
  {
    token: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    usedAt: { type: Date, default: null },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      index: true
    },
    requestedByIp: String
  },
  { timestamps: true, collection: "password_reset_tokens" }
);

module.exports = mongoose.model("PasswordResetToken", resetSchema);