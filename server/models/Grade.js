// ============================================================
// Grade model
// ------------------------------------------------------------
// One document per student, per course, per semester.
// A student who retakes a course gets a new document.
// ============================================================

const { mongoose } = require("../db");

const gradeSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    code: {
      type: String,
      required: true,
      uppercase: true,
      trim: true
    },
    title: { type: String, required: true, trim: true },
    credits: { type: Number, required: true, min: 0 },
    grade: {
      type: String,
      required: true,
      trim: true,
      uppercase: true
    },
    points: { type: Number, required: true, min: 0 },
    semester: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    publishedAt: { type: Date, default: Date.now }
  },
  { timestamps: true, collection: "grades" }
);

// One grade per student per course per semester
gradeSchema.index(
  { studentId: 1, code: 1, semester: 1 },
  { unique: true }
);

gradeSchema.methods.toPublicJSON = function () {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model("Grade", gradeSchema);