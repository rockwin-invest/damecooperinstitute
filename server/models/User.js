// ============================================================
// User model
// ------------------------------------------------------------
// Single collection for students, staff, and admins.
// Role determines what the user can access.
// ============================================================

const { mongoose } = require("../db");

const userSchema = new mongoose.Schema(
  {
    loginId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      uppercase: true,
      trim: true
    },
    role: {
      type: String,
      required: true,
      enum: ["student", "staff", "admin"],
      index: true
    },
    firstName: { type: String, required: true, trim: true },
    lastName:  { type: String, required: true, trim: true },
    initials:  { type: String, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true
    },
    phone: { type: String, trim: true },

    passwordHash: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "active", "suspended"],
      default: "active",
      index: true
    },
    lastLoginAt: { type: Date, default: null },

    // Student-specific fields (optional)
    dateOfBirth:        Date,
    nationality:        String,
    programme:          String,
    programmeCode:      String,
    school:             String,
    level:              String,
    studyMode:          String,
    startDate:          Date,
    expectedGraduation: Date,
    advisor:            String,
    campus:             String,

    // Staff-specific fields (optional)
    department: String,
    title:      String
  },
  { timestamps: true, collection: "users" }
);

userSchema.pre("save", function () {
  if (!this.initials && this.firstName && this.lastName) {
    this.initials = (this.firstName[0] + this.lastName[0]).toUpperCase();
  }
});

userSchema.methods.toPublicJSON = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model("User", userSchema);