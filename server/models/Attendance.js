// ============================================================
// Attendance model
// ------------------------------------------------------------
// One document per student, per class session, per day.
// `date` is stored at midnight UTC to make grouping trivial.
// ============================================================

const { mongoose } = require("../db");

const attendanceSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    courseCode:  { type: String, required: true, uppercase: true, trim: true },
    courseTitle: { type: String, required: true, trim: true },
    date: { type: Date, required: true, index: true },
    status: {
      type: String,
      required: true,
      enum: ["present", "absent", "late", "excused"],
      default: "present"
    },
    notes: { type: String, trim: true },
    markedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
  },
  { timestamps: true, collection: "attendance" }
);

attendanceSchema.index(
  { studentId: 1, courseCode: 1, date: 1 },
  { unique: true }
);

attendanceSchema.methods.toPublicJSON = function () {
  const obj = this.toObject();
  delete obj.__v;
  delete obj.markedBy;
  return obj;
};

module.exports = mongoose.model("Attendance", attendanceSchema);