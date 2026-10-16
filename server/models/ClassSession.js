// ============================================================
// ClassSession model
// ------------------------------------------------------------
// One document per recurring weekly class session.
// A course that meets Monday, Wednesday, and Friday will have
// three ClassSession documents for that student.
// ============================================================

const { mongoose } = require("../db");

const classSessionSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    courseCode: { type: String, required: true, uppercase: true, trim: true },
    courseTitle: { type: String, required: true, trim: true },
    dayOfWeek: {
      type: String,
      required: true,
      enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
      index: true
    },
    startTime: { type: String, required: true, trim: true }, // "09:00"
    endTime:   { type: String, required: true, trim: true }, // "10:30"
    room:      { type: String, trim: true },
    lecturer:  { type: String, trim: true },
    semester:  { type: String, required: true, trim: true, index: true }
  },
  { timestamps: true, collection: "class_sessions" }
);

// A student can't have two sessions in the same room at the same time on the same day
classSessionSchema.index(
  { studentId: 1, dayOfWeek: 1, startTime: 1 },
  { unique: true }
);

classSessionSchema.methods.toPublicJSON = function () {
  const obj = this.toObject();
  delete obj.__v;
  // Format the display time slot for the frontend
  obj.time = obj.startTime + " – " + obj.endTime;
  obj.title = obj.courseTitle;
  return obj;
};

module.exports = mongoose.model("ClassSession", classSessionSchema);