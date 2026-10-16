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
      index: true
    },
    firstName: { type: String, required: true, trim: true },
    lastName:  { type: String, required: true, trim: true },
    email:     { type: String, required: true, lowercase: true, trim: true },
    loginId:   { type: String, required: true, uppercase: true, trim: true },
    role: {
      type: String,
      required: true,
      enum: ["student", "staff", "admin"]
    },
    programme: String,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    acceptedAt: { type: Date, default: null },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      index: true
    }
  },
  { timestamps: true, collection: "invitations" }
);

invitationSchema.methods.toPublicJSON = function () {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model("Invitation", invitationSchema);