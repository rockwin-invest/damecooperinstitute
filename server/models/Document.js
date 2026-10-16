// ============================================================
// Document model
// ------------------------------------------------------------
// Documents available to a specific student. Files live on
// the server's local disk under server/storage/documents/.
// For production, replace `storageKey` lookups with signed
// URLs from S3 / R2 / Backblaze — see server/storage.js.
// ============================================================

const { mongoose } = require("../db");

const documentSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    name: { type: String, required: true, trim: true },
    storageKey: {
      type: String,
      required: true,
      trim: true
    },
    type: { type: String, required: true, uppercase: true, trim: true, default: "PDF" },
    mimeType: { type: String, required: true, default: "application/pdf" },
    size: { type: String, trim: true },
    updatedAt: { type: Date, default: Date.now }
  },
  { timestamps: true, collection: "documents" }
);

documentSchema.methods.toPublicJSON = function () {
  const obj = this.toObject();
  delete obj.__v;
  obj.updatedAt = obj.updatedAt
    ? obj.updatedAt.toISOString().slice(0, 10)
    : null;
  return obj;
};

module.exports = mongoose.model("Document", documentSchema);