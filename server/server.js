// ============================================================
// DAMECOOPER INSTITUTE — BACKEND API
// ------------------------------------------------------------
// Runs on Render. MongoDB Atlas for storage.
//
// Required environment variables:
//   NODE_ENV        — "production"
//   JWT_SECRET      — long random string (>=32 chars)
//   CORS_ORIGIN     — comma-separated allowed origins
//   FRONTEND_URL    — public URL of the static site
//   MONGODB_URI     — mongodb+srv://...
//
// Optional:
//   PORT            — injected by Render
//   RESEND_API_KEY  — enables real email sending
//   EMAIL_FROM      — sender name + address
// ============================================================

require("dotenv").config();

const express   = require("express");
const cors      = require("cors");
const helmet    = require("helmet");
const rateLimit = require("express-rate-limit");
const jwt       = require("jsonwebtoken");
const bcrypt    = require("bcryptjs");
const crypto    = require("crypto");

const { connectDb, mongoose } = require("./db");

const User                = require("./models/User");
const Invitation          = require("./models/Invitation");
const Grade               = require("./models/Grade");
const ClassSession        = require("./models/ClassSession");
const Invoice             = require("./models/Invoice");
const Document            = require("./models/Document");
const Announcement        = require("./models/Announcement");
const Attendance          = require("./models/Attendance");
const PasswordResetToken  = require("./models/PasswordResetToken");

const {
  sendLoginAlert,
  sendPasswordChanged,
  sendPasswordReset,
  sendInvitation
} = require("./email");
const storage = require("./storage");

// ------------------------------------------------------------
// CONFIG + HARD-FAIL JWT_SECRET IN PROD
// ------------------------------------------------------------
const PORT = process.env.PORT || 3000;
const JWT_EXPIRES_IN = "4h";
const FRONTEND_URL =
  process.env.FRONTEND_URL || "https://damecooperinstitute.com";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET.length < 32) {
  if (process.env.NODE_ENV === "production") {
    console.error(
      "[start] JWT_SECRET missing or shorter than 32 chars — refusing to start."
    );
    process.exit(1);
  }
  console.warn(
    "[start] JWT_SECRET missing or weak — using dev fallback. DO NOT deploy this way."
  );
}
const SIGNING_KEY = JWT_SECRET || "dev-only-change-me-please-32-chars-min";

// ------------------------------------------------------------
// APP + TRUST PROXY
// ------------------------------------------------------------
const app = express();
app.set("trust proxy", 1);

// ------------------------------------------------------------
// CORS
// ------------------------------------------------------------
const ALLOWED_ORIGINS = (
  process.env.CORS_ORIGIN ||
  "http://localhost:3000,http://127.0.0.1:3000,http://localhost:5500"
)
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (ALLOWED_ORIGINS.includes("*") || ALLOWED_ORIGINS.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS: " + origin));
    },
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Accept"],
    maxAge: 86400
  })
);

// ------------------------------------------------------------
// SECURITY HEADERS
// ------------------------------------------------------------
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" }
  })
);

// ------------------------------------------------------------
// BODY PARSING
// ------------------------------------------------------------
app.use(express.json({ limit: "100kb" }));

// ------------------------------------------------------------
// RATE LIMITERS
// ------------------------------------------------------------
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    message: "Too many login attempts. Please try again later.",
    code: "RATE_LIMITED"
  }
});

const forgotLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    message: "Too many password reset requests. Please try again later.",
    code: "RATE_LIMITED"
  }
});

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 120,
  standardHeaders: "draft-7",
  legacyHeaders: false
});

app.use("/api", apiLimiter);

// ------------------------------------------------------------
// AUTH MIDDLEWARE
// ------------------------------------------------------------
function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) {
    return res
      .status(401)
      .json({ message: "Authentication required.", code: "UNAUTHENTICATED" });
  }
  try {
    req.user = jwt.verify(token, SIGNING_KEY);
    next();
  } catch {
    res.status(401).json({
      message: "Your session has expired. Please sign in again.",
      code: "TOKEN_EXPIRED"
    });
  }
}

function requireRole(...allowedRoles) {
  return function (req, res, next) {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: "You do not have permission to access this resource.",
        code: "FORBIDDEN"
      });
    }
    next();
  };
}

// ------------------------------------------------------------
// HELPERS
// ------------------------------------------------------------
function weekOrder() {
  return ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
}

function todayName() {
  const names = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  return names[new Date().getDay()];
}

// ============================================================
// HEALTH CHECK
// ============================================================
app.get("/", (req, res) => {
  res.json({
    name: "DameCooper Institute API",
    status: "ok",
    time: new Date().toISOString()
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    service: "damecooperinstitute-api",
    db: mongoose.connection.readyState === 1 ? "connected" : "disconnected"
  });
});

// ============================================================
// AUTH ROUTES
// ------------------------------------------------------------
// One handler, mounted on both /signin and /login. The limiter
// runs once per request regardless of which alias is hit —
// previously the alias re-dispatched through app._router,
// which re-ran the limiter and halved the effective budget.
// ============================================================
async function signinHandler(req, res, next) {
  try {
    const body = req.body || {};
    const loginId = body.loginId || body.admissionNo;
    const password = body.password;

    if (!loginId || !password) {
      return res.status(400).json({
        message: "Login ID and password are required.",
        code: "VALIDATION_ERROR"
      });
    }

    const user = await User.findOne({ loginId: loginId.trim().toUpperCase() });

    // Constant-time response — always run bcrypt even if user not found
    const DUMMY_HASH =
      "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy";
    if (!user) {
      await bcrypt.compare(password, DUMMY_HASH);
      return res.status(401).json({
        message: "The login ID or password you entered is incorrect.",
        code: "INVALID_CREDENTIALS"
      });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return res.status(401).json({
        message: "The login ID or password you entered is incorrect.",
        code: "INVALID_CREDENTIALS"
      });
    }

    if (user.status === "suspended") {
      return res.status(403).json({
        message: "Your account is suspended. Please contact support.",
        code: "ACCOUNT_SUSPENDED"
      });
    }

    user.lastLoginAt = new Date();
    await user.save();

    const token = jwt.sign(
      { sub: user._id.toString(), loginId: user.loginId, role: user.role },
      SIGNING_KEY,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Fire-and-forget — never block the login response on email delivery
    sendLoginAlert({
      user,
      ip: req.ip,
      userAgent: req.get("user-agent"),
      when: new Date()
    }).catch((err) =>
      console.error("[email] login alert failed:", err.message)
    );

    res.json({ token, user: user.toPublicJSON() });
  } catch (err) {
    next(err);
  }
}

app.post("/api/auth/signin", loginLimiter, signinHandler);
app.post("/api/auth/login",  loginLimiter, signinHandler);

app.post("/api/auth/logout", requireAuth, (req, res) => {
  res.json({ ok: true });
});

// ============================================================
// CHANGE PASSWORD (authenticated)
// ============================================================
app.post("/api/auth/change-password", requireAuth, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body || {};

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        message: "Current and new passwords are required.",
        code: "VALIDATION_ERROR"
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        message: "New password must be at least 8 characters.",
        code: "VALIDATION_ERROR"
      });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({
        message: "New password must be different from the current one.",
        code: "VALIDATION_ERROR"
      });
    }

    const user = await User.findById(req.user.sub);
    if (!user) {
      return res.status(404).json({ message: "User not found.", code: "NOT_FOUND" });
    }

    const ok = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!ok) {
      return res.status(401).json({
        message: "Your current password is incorrect.",
        code: "INVALID_CREDENTIALS"
      });
    }

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    await user.save();

    // Fire-and-forget confirmation — password is already changed
    sendPasswordChanged({ user, ip: req.ip }).catch((err) =>
      console.error("[email] password-changed notify:", err.message)
    );

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// ============================================================
// PASSWORD RESET (unauthenticated)
// ------------------------------------------------------------
// Response is always generic, whether or not the email exists,
// to prevent account enumeration.
// ============================================================
app.post("/api/auth/forgot-password", forgotLimiter, async (req, res, next) => {
  try {
    const { email } = req.body || {};

    const genericResponse = {
      ok: true,
      message:
        "If that email matches a DameCooper account, a reset link is on its way."
    };

    if (!email || typeof email !== "string") {
      return res.status(400).json({
        message: "Email address is required.",
        code: "VALIDATION_ERROR"
      });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.json(genericResponse);
    }

    const token = crypto.randomBytes(32).toString("hex");
    await PasswordResetToken.create({
      token,
      userId: user._id,
      requestedByIp: req.ip
    });

    const resetUrl = FRONTEND_URL + "/reset-password.html?token=" + token;

    // Fire-and-forget — never block the response on email delivery
    sendPasswordReset({ user, resetUrl }).catch((err) =>
      console.error("[email] password reset send failed:", err.message)
    );

    res.json(genericResponse);
  } catch (err) {
    next(err);
  }
});

app.post("/api/auth/verify-reset-token", async (req, res, next) => {
  try {
    const { token } = req.body || {};
    if (!token) {
      return res.status(400).json({
        message: "Token is required.",
        code: "VALIDATION_ERROR"
      });
    }

    const reset = await PasswordResetToken.findOne({ token });
    if (!reset || reset.usedAt || (reset.expiresAt && reset.expiresAt < new Date())) {
      return res.status(410).json({
        message: "This reset link is invalid or has expired.",
        code: "RESET_INVALID"
      });
    }

    const user = await User.findById(reset.userId);
    if (!user) {
      return res.status(410).json({
        message: "This reset link is invalid.",
        code: "RESET_INVALID"
      });
    }

    res.json({
      ok: true,
      user: { firstName: user.firstName, email: user.email }
    });
  } catch (err) {
    next(err);
  }
});

app.post("/api/auth/reset-password", async (req, res, next) => {
  try {
    const { token, password } = req.body || {};

    if (!token || !password) {
      return res.status(400).json({
        message: "Token and password are required.",
        code: "VALIDATION_ERROR"
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message: "Password must be at least 8 characters.",
        code: "VALIDATION_ERROR"
      });
    }

    const reset = await PasswordResetToken.findOne({ token });

    if (!reset || reset.usedAt) {
      return res.status(410).json({
        message: "This reset link is invalid or has already been used.",
        code: "RESET_INVALID"
      });
    }

    if (reset.expiresAt && reset.expiresAt < new Date()) {
      return res.status(410).json({
        message: "This reset link has expired. Please request a new one.",
        code: "RESET_EXPIRED"
      });
    }

    const user = await User.findById(reset.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found.", code: "NOT_FOUND" });
    }

    user.passwordHash = await bcrypt.hash(password, 10);
    await user.save();

    reset.usedAt = new Date();
    await reset.save();

    res.json({ ok: true, loginId: user.loginId });
  } catch (err) {
    next(err);
  }
});

// ============================================================
// STUDENT ROUTES
// ============================================================
app.get(
  "/api/student/profile",
  requireAuth,
  requireRole("student"),
  async (req, res, next) => {
    try {
      const user = await User.findById(req.user.sub);
      if (!user) {
        return res.status(404).json({ message: "User not found.", code: "NOT_FOUND" });
      }
      res.json(user.toPublicJSON());
    } catch (err) {
      next(err);
    }
  }
);

app.get(
  "/api/student/grades",
  requireAuth,
  requireRole("student"),
  async (req, res, next) => {
    try {
      const grades = await Grade.find({ studentId: req.user.sub })
        .sort({ semester: -1, code: 1 });

      res.json({ grades: grades.map((g) => g.toPublicJSON()) });
    } catch (err) {
      next(err);
    }
  }
);

app.get(
  "/api/student/attendance",
  requireAuth,
  requireRole("student"),
  async (req, res, next) => {
    try {
      const records = await Attendance.find({ studentId: req.user.sub })
        .sort({ date: -1 })
        .limit(200);

      const total = records.length;
      const present = records.filter(
        (r) => r.status === "present" || r.status === "excused"
      ).length;
      const attendancePercent = total ? Math.round((present / total) * 100) : null;

      const byCourse = {};
      records.forEach((r) => {
        if (!byCourse[r.courseCode]) {
          byCourse[r.courseCode] = {
            courseCode: r.courseCode,
            courseTitle: r.courseTitle,
            total: 0,
            present: 0
          };
        }
        byCourse[r.courseCode].total += 1;
        if (r.status === "present" || r.status === "excused") {
          byCourse[r.courseCode].present += 1;
        }
      });

      const courses = Object.values(byCourse).map((c) => ({
        ...c,
        percent: c.total ? Math.round((c.present / c.total) * 100) : 0
      }));

      res.json({
        attendancePercent,
        total,
        present,
        courses,
        records: records.slice(0, 50).map((r) => r.toPublicJSON())
      });
    } catch (err) {
      next(err);
    }
  }
);

app.get(
  "/api/student/timetable",
  requireAuth,
  requireRole("student"),
  async (req, res, next) => {
    try {
      const sessions = await ClassSession.find({ studentId: req.user.sub })
        .sort({ dayOfWeek: 1, startTime: 1 });

      const days = {};
      weekOrder().forEach((d) => { days[d] = []; });

      sessions.forEach((s) => {
        const pub = s.toPublicJSON();
        if (days[s.dayOfWeek]) {
          days[s.dayOfWeek].push({
            time: pub.time,
            title: pub.title,
            room: pub.room,
            lecturer: pub.lecturer
          });
        }
      });

      Object.keys(days).forEach((d) => {
        if (!days[d].length) delete days[d];
      });

      res.json({ days });
    } catch (err) {
      next(err);
    }
  }
);

app.get(
  "/api/student/fees",
  requireAuth,
  requireRole("student"),
  async (req, res, next) => {
    try {
      const invoices = await Invoice.find({ studentId: req.user.sub })
        .sort({ dueDate: -1 });

      const items = invoices.map((i) => i.toPublicJSON());

      const currency = items[0] ? items[0].currency : "NZD";
      const total = items
        .filter((i) => i.status !== "waived")
        .reduce((sum, i) => sum + i.amount, 0);
      const paid = items
        .filter((i) => i.status === "paid")
        .reduce((sum, i) => sum + i.amount, 0);
      const outstanding = total - paid;

      res.json({ currency, total, paid, outstanding, items });
    } catch (err) {
      next(err);
    }
  }
);

app.get(
  "/api/student/announcements",
  requireAuth,
  requireRole("student", "staff", "admin"),
  async (req, res, next) => {
    try {
      const now = new Date();
      const announcements = await Announcement.find({
        $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }]
      }).sort({ publishedAt: -1 }).limit(50);

      res.json({ announcements: announcements.map((a) => a.toPublicJSON()) });
    } catch (err) {
      next(err);
    }
  }
);

app.get(
  "/api/student/documents",
  requireAuth,
  requireRole("student"),
  async (req, res, next) => {
    try {
      const docs = await Document.find({ studentId: req.user.sub })
        .sort({ updatedAt: -1 });

      res.json({ documents: docs.map((d) => d.toPublicJSON()) });
    } catch (err) {
      next(err);
    }
  }
);

app.get(
  "/api/student/documents/:id/download",
  requireAuth,
  requireRole("student"),
  async (req, res, next) => {
    try {
      const doc = await Document.findById(req.params.id);

      if (!doc) {
        return res.status(404).json({
          message: "Document not found.",
          code: "NOT_FOUND"
        });
      }

      if (doc.studentId.toString() !== req.user.sub) {
        return res.status(403).json({
          message: "You do not have access to this document.",
          code: "FORBIDDEN"
        });
      }

      if (!storage.fileExists(doc.studentId, doc.storageKey)) {
        return res.status(410).json({
          message: "This document is no longer available.",
          code: "FILE_MISSING"
        });
      }

      res.setHeader("Content-Type", doc.mimeType || "application/pdf");
      res.setHeader(
        "Content-Disposition",
        'attachment; filename="' +
          doc.name.replace(/"/g, "") +
          "." +
          (doc.type || "pdf").toLowerCase() +
          '"'
      );

      const stream = storage.streamDocument(doc.studentId, doc.storageKey);
      stream.on("error", (err) => {
        console.error("[download] Stream error:", err.message);
        if (!res.headersSent) {
          res.status(500).json({
            message: "Could not read the file.",
            code: "SERVER_ERROR"
          });
        }
      });
      stream.pipe(res);
    } catch (err) {
      next(err);
    }
  }
);

app.get(
  "/api/student/dashboard",
  requireAuth,
  requireRole("student"),
  async (req, res, next) => {
    try {
      const studentId = req.user.sub;

      const [user, grades, invoices, announcements, todaySessions, attendance] =
        await Promise.all([
          User.findById(studentId),
          Grade.find({ studentId }),
          Invoice.find({ studentId }),
          Announcement.find({
            $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }]
          }).sort({ publishedAt: -1 }).limit(3),
          ClassSession.find({ studentId, dayOfWeek: todayName() }).sort({ startTime: 1 }),
          Attendance.find({ studentId })
        ]);

      if (!user) {
        return res.status(404).json({ message: "User not found.", code: "NOT_FOUND" });
      }

      const gpa = grades.length
        ? (grades.reduce((sum, g) => sum + g.points, 0) / grades.length).toFixed(1)
        : "—";

      const thisYear = new Date().getFullYear();
      const creditsThisYear = grades
        .filter((g) => g.publishedAt && g.publishedAt.getFullYear() === thisYear)
        .reduce((sum, g) => sum + g.credits, 0);

      const outstandingFees = invoices
        .filter((i) => i.status !== "paid" && i.status !== "waived")
        .reduce((sum, i) => sum + i.amount, 0);

      const currency = invoices[0] ? invoices[0].currency : "NZD";

      let attendancePercent = null;
      if (attendance.length) {
        const present = attendance.filter(
          (a) => a.status === "present" || a.status === "excused"
        ).length;
        attendancePercent = Math.round((present / attendance.length) * 100);
      }

      res.json({
        student: user.toPublicJSON(),
        stats: {
          gpa,
          creditsThisYear,
          outstandingFees,
          currency,
          attendancePercent
        },
        announcements: announcements.map((a) => a.toPublicJSON()),
        todayClasses: todaySessions.map((s) => {
          const pub = s.toPublicJSON();
          return {
            time: pub.time,
            title: pub.title,
            room: pub.room,
            lecturer: pub.lecturer
          };
        })
      });
    } catch (err) {
      next(err);
    }
  }
);

// ============================================================
// STAFF ROUTES
// ============================================================
app.get(
  "/api/staff/profile",
  requireAuth,
  requireRole("staff", "admin"),
  async (req, res, next) => {
    try {
      const user = await User.findById(req.user.sub);
      if (!user) {
        return res.status(404).json({ message: "User not found.", code: "NOT_FOUND" });
      }
      res.json(user.toPublicJSON());
    } catch (err) {
      next(err);
    }
  }
);

app.get(
  "/api/staff/dashboard",
  requireAuth,
  requireRole("staff", "admin"),
  async (req, res, next) => {
    try {
      const user = await User.findById(req.user.sub);
      if (!user) {
        return res.status(404).json({ message: "User not found.", code: "NOT_FOUND" });
      }

      const sessions = await ClassSession.find({ staffId: req.user.sub })
        .sort({ dayOfWeek: 1, startTime: 1 });

      const courseSet = new Map();
      sessions.forEach((s) => {
        if (!courseSet.has(s.courseCode)) {
          courseSet.set(s.courseCode, {
            code: s.courseCode,
            title: s.courseTitle,
            semester: s.semester,
            sessions: 0
          });
        }
        courseSet.get(s.courseCode).sessions += 1;
      });
      const courses = Array.from(courseSet.values());

      const courseCodes = courses.map((c) => c.code);
      const studentIds = await ClassSession.distinct("studentId", {
        courseCode: { $in: courseCodes }
      });
      const totalStudents = studentIds.length;

      const todaySessions = sessions
        .filter((s) => s.dayOfWeek === todayName())
        .map((s) => s.toPublicJSON());

      const announcements = await Announcement.find({
        $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }]
      })
        .sort({ publishedAt: -1 })
        .limit(3);

      const awaitingGrading = 0;

      res.json({
        profile: user.toPublicJSON(),
        stats: {
          activeCourses: courses.length,
          totalStudents,
          awaitingGrading,
          classesToday: todaySessions.length
        },
        courses,
        todayClasses: todaySessions,
        announcements: announcements.map((a) => a.toPublicJSON())
      });
    } catch (err) {
      next(err);
    }
  }
);

app.get(
  "/api/staff/courses",
  requireAuth,
  requireRole("staff", "admin"),
  async (req, res, next) => {
    try {
      const sessions = await ClassSession.find({ staffId: req.user.sub });

      const courseSet = new Map();
      sessions.forEach((s) => {
        if (!courseSet.has(s.courseCode)) {
          courseSet.set(s.courseCode, {
            code: s.courseCode,
            title: s.courseTitle,
            semester: s.semester,
            sessions: 0,
            studentIds: new Set()
          });
        }
        courseSet.get(s.courseCode).sessions += 1;
        courseSet.get(s.courseCode).studentIds.add(s.studentId.toString());
      });

      const courses = await Promise.all(
        Array.from(courseSet.values()).map(async (c) => ({
          code: c.code,
          title: c.title,
          semester: c.semester,
          sessions: c.sessions,
          studentCount: c.studentIds.size
        }))
      );

      res.json({ courses });
    } catch (err) {
      next(err);
    }
  }
);

app.get(
  "/api/staff/courses/:courseCode/students",
  requireAuth,
  requireRole("staff", "admin"),
  async (req, res, next) => {
    try {
      const courseCode = req.params.courseCode.toUpperCase();

      const teaches = await ClassSession.findOne({
        staffId: req.user.sub,
        courseCode
      });
      if (!teaches) {
        return res.status(403).json({
          message: "You do not teach this course.",
          code: "FORBIDDEN"
        });
      }

      const studentIds = await ClassSession.distinct("studentId", { courseCode });
      const students = await User.find({ _id: { $in: studentIds } })
        .sort({ lastName: 1, firstName: 1 });

      res.json({
        courseCode,
        courseTitle: teaches.courseTitle,
        students: students.map((s) => {
          const pub = s.toPublicJSON();
          return {
            id: pub._id,
            loginId: pub.loginId,
            firstName: pub.firstName,
            lastName: pub.lastName,
            initials: pub.initials,
            email: pub.email
          };
        })
      });
    } catch (err) {
      next(err);
    }
  }
);

app.post(
  "/api/staff/attendance",
  requireAuth,
  requireRole("staff", "admin"),
  async (req, res, next) => {
    try {
      const { studentId, courseCode, courseTitle, date, status, notes } = req.body || {};

      if (!studentId || !courseCode || !courseTitle || !date || !status) {
        return res.status(400).json({
          message: "studentId, courseCode, courseTitle, date, and status are required.",
          code: "VALIDATION_ERROR"
        });
      }

      if (!["present", "absent", "late", "excused"].includes(status)) {
        return res.status(400).json({
          message: "status must be one of: present, absent, late, excused.",
          code: "VALIDATION_ERROR"
        });
      }

      const student = await User.findById(studentId);
      if (!student || student.role !== "student") {
        return res.status(404).json({
          message: "Student not found.",
          code: "NOT_FOUND"
        });
      }

      const d = new Date(date);
      d.setUTCHours(0, 0, 0, 0);

      const record = await Attendance.findOneAndUpdate(
        { studentId, courseCode: courseCode.toUpperCase(), date: d },
        {
          studentId,
          courseCode: courseCode.toUpperCase(),
          courseTitle,
          date: d,
          status,
          notes,
          markedBy: req.user.sub
        },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      );

      res.status(201).json(record.toPublicJSON());
    } catch (err) {
      next(err);
    }
  }
);

app.post(
  "/api/staff/attendance/bulk",
  requireAuth,
  requireRole("staff", "admin"),
  async (req, res, next) => {
    try {
      const { courseCode, courseTitle, date, records } = req.body || {};

      if (!courseCode || !courseTitle || !date || !Array.isArray(records)) {
        return res.status(400).json({
          message: "courseCode, courseTitle, date, and records[] are required.",
          code: "VALIDATION_ERROR"
        });
      }

      const d = new Date(date);
      d.setUTCHours(0, 0, 0, 0);

      const operations = records
        .filter((r) => r.studentId && r.status)
        .map((r) => ({
          updateOne: {
            filter: {
              studentId: r.studentId,
              courseCode: courseCode.toUpperCase(),
              date: d
            },
            update: {
              $set: {
                studentId: r.studentId,
                courseCode: courseCode.toUpperCase(),
                courseTitle,
                date: d,
                status: r.status,
                notes: r.notes || null,
                markedBy: req.user.sub
              }
            },
            upsert: true
          }
        }));

      const result = await Attendance.bulkWrite(operations);

      res.json({
        ok: true,
        matched: result.matchedCount,
        upserted: result.upsertedCount
      });
    } catch (err) {
      next(err);
    }
  }
);

// ============================================================
// ADMIN ROUTES — user management
// ============================================================
app.get(
  "/api/admin/users",
  requireAuth,
  requireRole("admin"),
  async (req, res, next) => {
    try {
      const users = await User.find().sort({ createdAt: -1 });
      const list = users.map((u) => {
        const pub = u.toPublicJSON();
        return {
          id: u._id.toString(),
          loginId: pub.loginId,
          role: pub.role,
          firstName: pub.firstName,
          lastName: pub.lastName,
          initials: pub.initials,
          email: pub.email,
          phone: pub.phone,
          status: u.status || "active",
          lastLogin: u.lastLoginAt
            ? u.lastLoginAt.toISOString().slice(0, 16).replace("T", " ")
            : "—"
        };
      });

      const invites = await Invitation.find({
        acceptedAt: null,
        expiresAt: { $gt: new Date() }
      }).sort({ createdAt: -1 });

      for (const inv of invites) {
        list.push({
          id: inv._id.toString(),
          loginId: inv.loginId,
          role: inv.role,
          firstName: inv.firstName,
          lastName: inv.lastName,
          initials: (inv.firstName[0] || "") + (inv.lastName[0] || ""),
          email: inv.email,
          status: "pending",
          lastLogin: "—"
        });
      }

      res.json({ users: list });
    } catch (err) {
      next(err);
    }
  }
);

app.get(
  "/api/admin/stats",
  requireAuth,
  requireRole("admin"),
  async (req, res, next) => {
    try {
      const [total, students, staff, admins, pendingInvites] = await Promise.all([
        User.countDocuments(),
        User.countDocuments({ role: "student", status: "active" }),
        User.countDocuments({ role: "staff", status: "active" }),
        User.countDocuments({ role: "admin", status: "active" }),
        Invitation.countDocuments({
          acceptedAt: null,
          expiresAt: { $gt: new Date() }
        })
      ]);

      res.json({ total, students, staff, admins, pendingInvites });
    } catch (err) {
      next(err);
    }
  }
);

app.post(
  "/api/admin/users",
  requireAuth,
  requireRole("admin"),
  async (req, res, next) => {
    try {
      const { firstName, lastName, email, loginId, role, programme, adminConfirm } =
        req.body || {};

      if (!firstName || !lastName || !email || !loginId || !role) {
        return res.status(400).json({
          message: "First name, last name, email, login ID, and role are required.",
          code: "VALIDATION_ERROR"
        });
      }

      if (!["student", "staff", "admin"].includes(role)) {
        return res.status(400).json({
          message: "Role must be one of: student, staff, admin.",
          code: "VALIDATION_ERROR"
        });
      }

      if (role === "admin" && !adminConfirm) {
        return res.status(400).json({
          message: "Creating an administrator requires a confirmation code.",
          code: "ADMIN_CONFIRM_REQUIRED"
        });
      }

      const normalizedLogin = loginId.trim().toUpperCase();
      const normalizedEmail = email.toLowerCase().trim();

      const existingUser = await User.findOne({
        $or: [{ loginId: normalizedLogin }, { email: normalizedEmail }]
      });
      if (existingUser) {
        return res.status(409).json({
          message: "That login ID or email address is already in use.",
          code: "DUPLICATE"
        });
      }

      const existingInvite = await Invitation.findOne({
        acceptedAt: null,
        $or: [{ loginId: normalizedLogin }, { email: normalizedEmail }]
      });
      if (existingInvite) {
        return res.status(409).json({
          message: "An invitation is already pending for that login ID or email.",
          code: "INVITE_PENDING"
        });
      }

      const token = crypto.randomBytes(32).toString("hex");
      const invite = await Invitation.create({
        token,
        firstName,
        lastName,
        email: normalizedEmail,
        loginId: normalizedLogin,
        role,
        programme: programme || null,
        createdBy: req.user.sub
      });

      const inviteUrl = FRONTEND_URL + "/accept-invite.html?token=" + token;

      console.log("[admin] Invitation created for " + normalizedEmail + " → " + inviteUrl);

      // Fire-and-forget — invite link is also returned in the response for fallback
      sendInvitation({ invite, inviteUrl }).catch((err) =>
        console.error("[email] invite send failed:", err.message)
      );

      res.status(201).json({
        user: {
          id: invite._id.toString(),
          loginId: invite.loginId,
          role: invite.role,
          firstName: invite.firstName,
          lastName: invite.lastName,
          email: invite.email,
          status: "pending"
        },
        inviteUrl
      });
    } catch (err) {
      next(err);
    }
  }
);

app.post(
  "/api/admin/users/:id/resend-invite",
  requireAuth,
  requireRole("admin"),
  async (req, res, next) => {
    try {
      const invite = await Invitation.findById(req.params.id);
      if (!invite || invite.acceptedAt) {
        return res.status(404).json({
          message: "Invitation not found or already accepted.",
          code: "NOT_FOUND"
        });
      }

      invite.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      await invite.save();

      const inviteUrl =
        FRONTEND_URL + "/accept-invite.html?token=" + invite.token;

      console.log("[admin] Invitation resent to " + invite.email + " → " + inviteUrl);

      // Fire-and-forget — same helper, same template, new expiry in place
      sendInvitation({ invite, inviteUrl }).catch((err) =>
        console.error("[email] resend invite failed:", err.message)
      );

      res.json({ ok: true, inviteUrl });
    } catch (err) {
      next(err);
    }
  }
);

app.patch(
  "/api/admin/users/:id/status",
  requireAuth,
  requireRole("admin"),
  async (req, res, next) => {
    try {
      const user = await User.findById(req.params.id);
      if (user) {
        user.status = user.status === "suspended" ? "active" : "suspended";
        await user.save();
        return res.json(user.toPublicJSON());
      }

      const invite = await Invitation.findById(req.params.id);
      if (invite) {
        invite.acceptedAt = invite.acceptedAt ? null : new Date();
        await invite.save();
        return res.json({ ok: true });
      }

      res.status(404).json({ message: "User not found.", code: "NOT_FOUND" });
    } catch (err) {
      next(err);
    }
  }
);

// ============================================================
// INVITATION ROUTES
// ============================================================
app.post("/api/invitations/verify", async (req, res, next) => {
  try {
    const { token } = req.body || {};
    if (!token) {
      return res.status(400).json({
        message: "Invitation token is required.",
        code: "VALIDATION_ERROR"
      });
    }

    const invite = await Invitation.findOne({ token });

    if (!invite || invite.acceptedAt) {
      return res.status(410).json({
        message: "This invitation link is invalid or has already been used.",
        code: "INVITE_INVALID"
      });
    }

    if (invite.expiresAt && invite.expiresAt < new Date()) {
      return res.status(410).json({
        message: "This invitation link has expired. Please ask for a new one.",
        code: "INVITE_EXPIRED"
      });
    }

    res.json({
      invite: {
        firstName: invite.firstName,
        lastName: invite.lastName,
        loginId: invite.loginId,
        email: invite.email,
        role: invite.role
      }
    });
  } catch (err) {
    next(err);
  }
});

app.post("/api/invitations/accept", async (req, res, next) => {
  try {
    const { token, password } = req.body || {};
    if (!token || !password) {
      return res.status(400).json({
        message: "Token and password are required.",
        code: "VALIDATION_ERROR"
      });
    }
    if (password.length < 8) {
      return res.status(400).json({
        message: "Password must be at least 8 characters.",
        code: "VALIDATION_ERROR"
      });
    }

    const invite = await Invitation.findOne({ token });

    if (!invite || invite.acceptedAt) {
      return res.status(410).json({
        message: "This invitation link is invalid or has already been used.",
        code: "INVITE_INVALID"
      });
    }

    if (invite.expiresAt && invite.expiresAt < new Date()) {
      return res.status(410).json({
        message: "This invitation link has expired. Please ask for a new one.",
        code: "INVITE_EXPIRED"
      });
    }

    const existing = await User.findOne({
      $or: [{ loginId: invite.loginId }, { email: invite.email }]
    });
    if (existing) {
      invite.acceptedAt = new Date();
      await invite.save();
      return res.status(409).json({
        message: "An account with that login ID or email already exists.",
        code: "DUPLICATE"
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({
      loginId: invite.loginId,
      role: invite.role,
      firstName: invite.firstName,
      lastName: invite.lastName,
      email: invite.email,
      programme: invite.programme || null,
      status: "active",
      passwordHash
    });

    invite.acceptedAt = new Date();
    await invite.save();

    res.json({ ok: true, loginId: user.loginId });
  } catch (err) {
    next(err);
  }
});

// ============================================================
// 404 + ERROR HANDLERS
// ============================================================
app.use((req, res) => {
  res.status(404).json({
    message: "Not found: " + req.method + " " + req.originalUrl,
    code: "NOT_FOUND"
  });
});

app.use((err, req, res, next) => {
  console.error("[error]", err.message);

  if (err.message && err.message.startsWith("Not allowed by CORS")) {
    return res.status(403).json({ message: err.message, code: "CORS_BLOCKED" });
  }

  if (err.name === "ValidationError") {
    return res.status(400).json({
      message: "Validation failed.",
      code: "VALIDATION_ERROR",
      details: Object.keys(err.errors || {})
    });
  }

  if (err.name === "CastError") {
    return res.status(400).json({
      message: "Invalid ID format.",
      code: "INVALID_ID"
    });
  }

  if (err.code === 11000) {
    return res.status(409).json({
      message: "A record with that value already exists.",
      code: "DUPLICATE"
    });
  }

  res.status(500).json({
    message: "An unexpected server error occurred.",
    code: "SERVER_ERROR"
  });
});

// ============================================================
// START
// ============================================================
async function start() {
  try {
    await connectDb();
    app.listen(PORT, () => {
      console.log(
        "DameCooper Institute API listening on port " + PORT +
        " (" + (process.env.NODE_ENV || "development") + ")"
      );
    });
  } catch (err) {
    console.error("[start] Failed to start:", err.message);
    process.exit(1);
  }
}

start();