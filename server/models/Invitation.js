// ============================================================
// Invitation model
// ------------------------------------------------------------
// One-time tokens issued by admins to create new accounts.
// ============================================================

const { mongoose } = require("../db");

const invitationSchema = new mongoose.Schema(
  {
    token: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    firstName: { type: String, required: true },
    lastName:  { type: String, required: true },
    email:     { type: String, required: true, lowercase: true },
    loginId:   { type: String, required: true, uppercase: true },
    role: {
      type: String,
      required: true,
      enum: ["student", "staff", "admin"],
    },
    programme: String,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    acceptedAt: { type: Date, default: null },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      index: true,
    },
  },
  { timestamps: true, collection: "invitations" }
);

module.exports = mongoose.model("Invitation", invitationSchema);