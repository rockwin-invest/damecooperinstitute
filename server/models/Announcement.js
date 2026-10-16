// ============================================================
// Announcement model
// ------------------------------------------------------------
// Global announcements visible to all authenticated users.
// Not scoped per-student — this is the institute noticeboard.
// ============================================================

const { mongoose } = require("../db");

const announcementSchema = new mongoose.Schema(
  {
    tag: {
      type: String,
      required: true,
      enum: ["Academic", "Fees", "Campus", "Event", "System", "Other"],
      index: true
    },
    title: { type: String, required: true, trim: true },
    body:  { type: String, required: true, trim: true },
    priority: {
      type: String,
      required: true,
      enum: ["high", "medium", "low"],
      default: "medium",
      index: true
    },
    publishedAt: { type: Date, default: Date.now, index: true },
    expiresAt:   { type: Date, default: null },
    authorId:    { type: mongoose.Schema.Types.ObjectId, ref: "User" }
  },
  { timestamps: true, collection: "announcements" }
);

announcementSchema.methods.toPublicJSON = function () {
  const obj = this.toObject();
  delete obj.__v;
  delete obj.authorId;
  obj.date = obj.publishedAt
    ? obj.publishedAt.toISOString().slice(0, 10)
    : null;
  return obj;
};

module.exports = mongoose.model("Announcement", announcementSchema);