// ============================================================
// DAMECOOPER INSTITUTE — BACKEND API
// ------------------------------------------------------------
// Runs on Render. MongoDB Atlas for storage.
//
// Required environment variables:
//   PORT          — injected by Render; do not set manually
//   NODE_ENV      — "production"
//   JWT_SECRET    — long random string (generate in Render)
//   CORS_ORIGIN   — comma-separated allowed origins
//   FRONTEND_URL  — public URL of the static site (for invite links)
//   MONGODB_URI   — mongodb+srv://user:pass@cluster/db?retryWrites=true&w=majority
// ============================================================

require("dotenv").config();

const express     = require("express");
const cors        = require("cors");
const helmet      = require("helmet");
const rateLimit   = require("express-rate-limit");
const jwt         = require("jsonwebtoken");
const bcrypt      = require("bcryptjs");
const crypto      = require("crypto");
const mongoose    = require("mongoose");

const app = express();

// ------------------------------------------------------------
// TRUST PROXY
// Render runs the app behind a reverse proxy. Without this,
// express-rate-limit crashes at startup.
// ------------------------------------------------------------
app.set("trust proxy", 1);

const PORT          = process.env.PORT || 3000;
const JWT_SECRET    = process.env.JWT_SECRET || "dev-only-change-me";
const JWT_EXPIRES_IN = "4h";
const MONGODB_URI   = process.env.MONGODB_URI;

// ------------------------------------------------------------
// CORS
// ------------------------------------------------------------
const ALLOWED_ORIGINS = (process.env.CORS_ORIGIN ||
  "http://localhost:3000,http://127.0.0.1:3000,http://localhost:5500")
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
    maxAge: 86400,
  })
);

// ------------------------------------------------------------
// SECURITY HEADERS
// ------------------------------------------------------------
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
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
    code: "RATE_LIMITED",
  },
});

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 120,
  standardHeaders: "draft-7",
  legacyHeaders: false,
});

app.use("/api", apiLimiter);

// ============================================================
// DATABASE MODELS
// ============================================================

// ------------------------------------------------------------
// User
// ------------------------------------------------------------
const userSchema = new mongoose.Schema(
  {
    loginId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      uppercase: true,
      trim: true,
    },
    role: {
      type: String,
      required: true,
      enum: ["student", "staff", "admin"],
      index: true,
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
      index: true,
    },
    phone: { type: String, trim: true },

    passwordHash: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "active", "suspended"],
      default: "active",
      index: true,
    },
    lastLoginAt: { type: Date, default: null },

    // Student fields (optional)
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

    // Staff fields (optional)
    department: String,
    title:      String,
  },
  { timestamps: true, collection: "users" }
);

userSchema.pre("save", function () {
  if (!this.initials && this.firstName && this.lastName) {
    this.initials = (this.firstName[0] + this.lastName[0]).toUpperCase();
  }
  // No next() — Mongoose 8 treats sync functions as complete
});

userSchema.methods.toPublicJSON = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  delete obj.__v;
  return obj;
};

const User = mongoose.model("User", userSchema);

// ------------------------------------------------------------
// Invitation
// ------------------------------------------------------------
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
    email:     { type: String, required: true, lowercase: true, trim: true },
    loginId:   { type: String, required: true, uppercase: true, trim: true },
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
      default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      index: true,
    },
  },
  { timestamps: true, collection: "invitations" }
);

const Invitation = mongoose.model("Invitation", invitationSchema);

// ============================================================
// AUTH MIDDLEWARE
// ============================================================

function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) {
    return res
      .status(401)
      .json({ message: "Authentication required.", code: "UNAUTHENTICATED" });
  }
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({
      message: "Your session has expired. Please sign in again.",
      code: "TOKEN_EXPIRED",
    });
  }
}

function requireRole(...allowedRoles) {
  return function (req, res, next) {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: "You do not have permission to access this resource.",
        code: "FORBIDDEN",
      });
    }
    next();
  };
}

// ============================================================
// HEALTH CHECK
// ============================================================

app.get("/", (req, res) => {
  res.json({
    name: "DameCooper Institute API",
    status: "ok",
    time: new Date().toISOString(),
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    service: "damecooperinstitute-api",
    db: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
  });
});

// ============================================================
// AUTH ROUTES
// ============================================================

app.post("/api/auth/signin", loginLimiter, async (req, res, next) => {
  try {
    const body = req.body || {};
    const loginId = body.loginId || body.admissionNo;
    const password = body.password;

    if (!loginId || !password) {
      return res.status(400).json({
        message: "Login ID and password are required.",
        code: "VALIDATION_ERROR",
      });
    }

    const user = await User.findOne({ loginId: loginId.trim().toUpperCase() });

// Real bcrypt hash of the string "invalid" — used only to normalize
// response timing when the user doesn't exist. Must be a VALID hash
// or bcryptjs throws instead of returning false.
const DUMMY_HASH = "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy";

if (!user) {
  await bcrypt.compare(password, DUMMY_HASH);
  return res.status(401).json({
    message: "The login ID or password you entered is incorrect.",
    code: "INVALID_CREDENTIALS",
  });
}

const ok = await bcrypt.compare(password, user.passwordHash);
if (!ok) {
  return res.status(401).json({
    message: "The login ID or password you entered is incorrect.",
    code: "INVALID_CREDENTIALS",
  });
}

    if (user.status === "suspended") {
      return res.status(403).json({
        message: "Your account is suspended. Please contact support.",
        code: "ACCOUNT_SUSPENDED",
      });
    }

    user.lastLoginAt = new Date();
    await user.save();

    const token = jwt.sign(
      { sub: user._id.toString(), loginId: user.loginId, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({ token, user: user.toPublicJSON() });
  } catch (err) {
    next(err);
  }
});

// Backwards-compatible alias
app.post("/api/auth/login", loginLimiter, (req, res, next) => {
  req.url = "/api/auth/signin";
  app._router.handle(req, res, next);
});

app.post("/api/auth/logout", requireAuth, (req, res) => {
  res.json({ ok: true });
});

// ============================================================
// STUDENT ROUTES
// ------------------------------------------------------------
// Grades, timetable, fees, announcements, and documents are
// still demo stubs. They live inline here until you build the
// real academic data model.
// ============================================================

const GRADES = [
  { code: "CS201",   title: "Data Structures & Algorithms", credits: 20, grade: "A",  points: 8 },
  { code: "CS210",   title: "Operating Systems",            credits: 20, grade: "B+", points: 7 },
  { code: "CS220",   title: "Database Systems",             credits: 20, grade: "A",  points: 8 },
  { code: "MATH201", title: "Linear Algebra",               credits: 15, grade: "A-", points: 7 },
  { code: "ENG205",  title: "Technical Communication",      credits: 15, grade: "B",  points: 6 },
];

const TIMETABLE = {
  Monday: [
    { time: "09:00 – 10:30", title: "Data Structures & Algorithms", room: "B-201", lecturer: "Dr. K. Ngata" },
    { time: "11:00 – 12:30", title: "Operating Systems",            room: "B-105", lecturer: "Prof. L. Chen" },
  ],
  Tuesday: [
    { time: "10:00 – 11:30", title: "Database Systems",             room: "B-204", lecturer: "Dr. A. Patel" },
  ],
  Wednesday: [
    { time: "09:00 – 10:30", title: "Data Structures & Algorithms", room: "B-201", lecturer: "Dr. K. Ngata" },
  ],
  Thursday: [
    { time: "09:00 – 10:30", title: "Database Systems",             room: "B-204", lecturer: "Dr. A. Patel" },
  ],
  Friday: [
    { time: "14:00 – 17:00", title: "Project Workshop",             room: "Lab 1", lecturer: "Dr. K. Ngata" },
  ],
};

const FEES = {
  currency: "NZD",
  total: 12800,
  paid: 9600,
  outstanding: 3200,
  items: [
    { id: "INV-2026-001", description: "Semester 1 tuition",             amount: 6400, dueDate: "2026-02-20", status: "paid" },
    { id: "INV-2026-002", description: "Student services levy",          amount: 700,  dueDate: "2026-02-20", status: "paid" },
    { id: "INV-2026-003", description: "Semester 2 tuition",             amount: 2500, dueDate: "2026-07-15", status: "paid" },
    { id: "INV-2026-004", description: "Semester 2 tuition — remainder", amount: 3200, dueDate: "2026-07-15", status: "due" },
  ],
};

const ANNOUNCEMENTS = [
  { id: 1, tag: "Academic", date: "2026-04-10", title: "Semester 1 results released",        body: "Your Semester 1 results are now available in the Grades section of the portal.", priority: "high" },
  { id: 2, tag: "Fees",     date: "2026-04-08", title: "Semester 2 payment reminder",        body: "The remaining Semester 2 tuition balance is due by 15 July 2026.",               priority: "medium" },
  { id: 3, tag: "Campus",   date: "2026-04-02", title: "Library extended hours",             body: "The campus library will remain open until 10:00 PM during the examination period.", priority: "low" },
  { id: 4, tag: "Event",    date: "2026-03-28", title: "Careers Evening — 12 April",         body: "Meet graduate employers from across New Zealand. Register via Careers Services.",  priority: "medium" },
];

const DOCUMENTS = [
  { id: "doc-1", name: "Enrolment confirmation letter", size: "142 KB", type: "PDF", updatedAt: "2026-02-26" },
  { id: "doc-2", name: "Academic transcript",            size: "320 KB", type: "PDF", updatedAt: "2026-03-15" },
  { id: "doc-3", name: "Fees statement — Semester 1",    size: "88 KB",  type: "PDF", updatedAt: "2026-02-22" },
  { id: "doc-4", name: "Programme handbook 2026",        size: "1.2 MB", type: "PDF", updatedAt: "2026-01-15" },
];

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
  (req, res) => res.json({ grades: GRADES })
);

app.get(
  "/api/student/timetable",
  requireAuth,
  requireRole("student"),
  (req, res) => res.json({ days: TIMETABLE })
);

app.get(
  "/api/student/fees",
  requireAuth,
  requireRole("student"),
  (req, res) => res.json(FEES)
);

app.get(
  "/api/student/announcements",
  requireAuth,
  requireRole("student"),
  (req, res) => res.json({ announcements: ANNOUNCEMENTS })
);

app.get(
  "/api/student/documents",
  requireAuth,
  requireRole("student"),
  (req, res) => res.json({ documents: DOCUMENTS })
);

app.get(
  "/api/student/dashboard",
  requireAuth,
  requireRole("student"),
  async (req, res, next) => {
    try {
      const user = await User.findById(req.user.sub);
      if (!user) {
        return res.status(404).json({ message: "User not found.", code: "NOT_FOUND" });
      }
      const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      const today = dayNames[new Date().getDay()];
      res.json({
        student: user.toPublicJSON(),
        stats: {
          gpa: "7.2",
          creditsThisYear: 90,
          outstandingFees: FEES.outstanding,
          currency: FEES.currency,
          attendancePercent: 94,
        },
        announcements: ANNOUNCEMENTS.slice(0, 3),
        todayClasses: TIMETABLE[today] || [],
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
          ...pub,
          lastLogin: u.lastLoginAt
            ? u.lastLoginAt.toISOString().slice(0, 16).replace("T", " ")
            : "—",
        };
      });

      // Add pending invitations as pseudo-users
      const invites = await Invitation.find({
        acceptedAt: null,
        expiresAt: { $gt: new Date() },
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
          lastLogin: "—",
        });
      }

      res.json({ users: list });
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
      const { firstName, lastName, email, loginId, role, programme, adminConfirm } = req.body || {};

      if (!firstName || !lastName || !email || !loginId || !role) {
        return res.status(400).json({
          message: "First name, last name, email, login ID, and role are required.",
          code: "VALIDATION_ERROR",
        });
      }

      if (!["student", "staff", "admin"].includes(role)) {
        return res.status(400).json({
          message: "Role must be one of: student, staff, admin.",
          code: "VALIDATION_ERROR",
        });
      }

      if (role === "admin" && !adminConfirm) {
        return res.status(400).json({
          message: "Creating an administrator requires a confirmation code.",
          code: "ADMIN_CONFIRM_REQUIRED",
        });
      }

      const normalizedLogin = loginId.trim().toUpperCase();
      const normalizedEmail = email.toLowerCase().trim();

      // Duplicate checks — against both users and open invitations
      const existingUser = await User.findOne({
        $or: [{ loginId: normalizedLogin }, { email: normalizedEmail }],
      });
      if (existingUser) {
        return res.status(409).json({
          message: "That login ID or email address is already in use.",
          code: "DUPLICATE",
        });
      }

      const existingInvite = await Invitation.findOne({
        acceptedAt: null,
        $or: [{ loginId: normalizedLogin }, { email: normalizedEmail }],
      });
      if (existingInvite) {
        return res.status(409).json({
          message: "An invitation is already pending for that login ID or email.",
          code: "INVITE_PENDING",
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
        createdBy: req.user.sub,
      });

      const inviteUrl =
        (process.env.FRONTEND_URL || "https://damecooperinstitute.com") +
        "/accept-invite.html?token=" + token;

      // In production, replace this with a real email send.
      console.log("[admin] Invitation created for " + normalizedEmail + " → " + inviteUrl);

      res.status(201).json({
        user: {
          id: invite._id.toString(),
          loginId: invite.loginId,
          role: invite.role,
          firstName: invite.firstName,
          lastName: invite.lastName,
          email: invite.email,
          status: "pending",
        },
        inviteUrl, // remove when email sending is wired
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
          code: "NOT_FOUND",
        });
      }

      // Extend the expiry
      invite.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      await invite.save();

      const inviteUrl =
        (process.env.FRONTEND_URL || "https://damecooperinstitute.com") +
        "/accept-invite.html?token=" + invite.token;

      console.log("[admin] Invitation resent to " + invite.email + " → " + inviteUrl);

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
      // First try as a real user
      const user = await User.findById(req.params.id);
      if (user) {
        user.status = user.status === "suspended" ? "active" : "suspended";
        await user.save();
        return res.json(user.toPublicJSON());
      }

      // Otherwise treat it as an invitation cancellation
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
// INVITATION ROUTES — used by accept-invite.html
// ============================================================

app.post("/api/invitations/verify", async (req, res, next) => {
  try {
    const { token } = req.body || {};
    if (!token) {
      return res.status(400).json({
        message: "Invitation token is required.",
        code: "VALIDATION_ERROR",
      });
    }

    const invite = await Invitation.findOne({ token });

    if (!invite || invite.acceptedAt) {
      return res.status(410).json({
        message: "This invitation link is invalid or has already been used.",
        code: "INVITE_INVALID",
      });
    }

    if (invite.expiresAt && invite.expiresAt < new Date()) {
      return res.status(410).json({
        message: "This invitation link has expired. Please ask for a new one.",
        code: "INVITE_EXPIRED",
      });
    }

    res.json({
      invite: {
        firstName: invite.firstName,
        lastName: invite.lastName,
        loginId: invite.loginId,
        email: invite.email,
        role: invite.role,
      },
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
        code: "VALIDATION_ERROR",
      });
    }
    if (password.length < 8) {
      return res.status(400).json({
        message: "Password must be at least 8 characters.",
        code: "VALIDATION_ERROR",
      });
    }

    const invite = await Invitation.findOne({ token });

    if (!invite || invite.acceptedAt) {
      return res.status(410).json({
        message: "This invitation link is invalid or has already been used.",
        code: "INVITE_INVALID",
      });
    }

    if (invite.expiresAt && invite.expiresAt < new Date()) {
      return res.status(410).json({
        message: "This invitation link has expired. Please ask for a new one.",
        code: "INVITE_EXPIRED",
      });
    }

    // Prevent a race where someone else created the account in the meantime
    const existing = await User.findOne({
      $or: [{ loginId: invite.loginId }, { email: invite.email }],
    });
    if (existing) {
      invite.acceptedAt = new Date();
      await invite.save();
      return res.status(409).json({
        message: "An account with that login ID or email already exists.",
        code: "DUPLICATE",
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
      passwordHash,
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
    code: "NOT_FOUND",
  });
});

app.use((err, req, res, next) => {
  console.error("[error]", err.message);

  if (err.message && err.message.startsWith("Not allowed by CORS")) {
    return res.status(403).json({
      message: err.message,
      code: "CORS_BLOCKED",
    });
  }

  if (err.name === "ValidationError") {
    return res.status(400).json({
      message: "Validation failed.",
      code: "VALIDATION_ERROR",
      details: Object.keys(err.errors || {}),
    });
  }

  if (err.code === 11000) {
    return res.status(409).json({
      message: "A record with that value already exists.",
      code: "DUPLICATE",
    });
  }

  res.status(500).json({
    message: "An unexpected server error occurred.",
    code: "SERVER_ERROR",
  });
});

// ============================================================
// START — connect to MongoDB first, then listen
// ============================================================

async function start() {
  if (!MONGODB_URI) {
    console.error("[start] MONGODB_URI is not set. Aborting.");
    process.exit(1);
  }

  try {
    console.log("[start] Connecting to MongoDB…");
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    console.log("[start] MongoDB connected:", mongoose.connection.name);

    app.listen(PORT, () => {
      console.log(
        "DameCooper Institute API listening on port " +
          PORT +
          " (" +
          (process.env.NODE_ENV || "development") +
          ")"
      );
    });
  } catch (err) {
    console.error("[start] Failed to start:", err.message);
    process.exit(1);
  }
}

start();