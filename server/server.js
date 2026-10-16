// ============================================================
// DAMECOOPER INSTITUTE — BACKEND API
// ------------------------------------------------------------
// Runs on Render. Serves the auth flow, student data, staff
// data, and admin user management.
//
// Environment variables (set these in Render's dashboard):
//   PORT          — injected by Render; do not set manually
//   NODE_ENV      — "production"
//   JWT_SECRET    — long random string; generate in Render
//   CORS_ORIGIN   — comma-separated allowed origins
//
// NOTE: the user store below is in-memory and resets on every
// deploy. Replace DEMO_USERS and the in-memory data blocks
// with real database calls when you're ready.
// ============================================================

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const app = express();

// ------------------------------------------------------------
// TRUST PROXY
// Render (and every other managed platform) runs the app
// behind a reverse proxy. Without this, express-rate-limit
// crashes on startup because it can't reliably determine the
// client IP from the X-Forwarded-For header.
// ------------------------------------------------------------
app.set("trust proxy", 1);

const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || "dev-only-change-me";
const JWT_EXPIRES_IN = "4h";

// ------------------------------------------------------------
// CORS — allow the deployed frontend (and localhost for dev)
// ------------------------------------------------------------
const ALLOWED_ORIGINS = (process.env.CORS_ORIGIN ||
  "http://localhost:3000,http://127.0.0.1:3000,http://localhost:5500")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow same-origin / curl / Postman requests with no Origin header
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
    // This is an API; CSP is managed by the frontend on GitHub Pages
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
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 10,                 // 10 attempts per window per IP
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    message: "Too many login attempts. Please try again later.",
    code: "RATE_LIMITED",
  },
});

const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  limit: 120,          // generous, this is per IP
  standardHeaders: "draft-7",
  legacyHeaders: false,
});

app.use("/api", apiLimiter);

// ============================================================
// IN-MEMORY DEMO DATA
// ------------------------------------------------------------
// Everything below resets on every deploy. Swap for a database
// (Postgres, MySQL, MongoDB) when you're ready to go live.
// ============================================================

const DEMO_USERS = [
  {
    id: "u_student_001",
    loginId: "DC/2025/001",
    role: "student",
    firstName: "Sarah",
    lastName: "Johnson",
    initials: "SJ",
    email: "sarah.johnson@student.damecooperinstitute.com",
    phone: "+64 21 234 5678",
    dateOfBirth: "2003-04-12",
    nationality: "New Zealand",
    programme: "BSc Computer Science",
    programmeCode: "BSC-CS",
    school: "School of Engineering",
    level: "Undergraduate — Year 2",
    studyMode: "On campus",
    startDate: "2024-02-26",
    expectedGraduation: "2027-11-30",
    advisor: "Dr. James Aroha",
    campus: "Dunedin Campus",
    // bcrypt hash of "demo1234"
    passwordHash: bcrypt.hashSync("demo1234", 10),
  },
  {
    id: "u_staff_001",
    loginId: "ST/2020/014",
    role: "staff",
    firstName: "James",
    lastName: "Aroha",
    initials: "JA",
    email: "james.aroha@damecooperinstitute.com",
    phone: "+64 3 479 8901",
    department: "School of Engineering",
    title: "Senior Lecturer",
    campus: "Dunedin Campus",
    // bcrypt hash of "staff1234"
    passwordHash: bcrypt.hashSync("staff1234", 10),
  },
  {
    id: "u_admin_001",
    loginId: "AD/2019/001",
    role: "admin",
    firstName: "Rachel",
    lastName: "Tui",
    initials: "RT",
    email: "rachel.tui@damecooperinstitute.com",
    phone: "+64 3 479 8902",
    department: "Registrar",
    title: "Registrar",
    campus: "Dunedin Campus",
    // bcrypt hash of "admin1234"
    passwordHash: bcrypt.hashSync("admin1234", 10),
  },
];

const GRADES = [
  { code: "CS201", title: "Data Structures & Algorithms", credits: 20, grade: "A",  points: 8 },
  { code: "CS210", title: "Operating Systems",            credits: 20, grade: "B+", points: 7 },
  { code: "CS220", title: "Database Systems",             credits: 20, grade: "A",  points: 8 },
  { code: "MATH201", title: "Linear Algebra",             credits: 15, grade: "A-", points: 7 },
  { code: "ENG205", title: "Technical Communication",     credits: 15, grade: "B",  points: 6 },
];

const TIMETABLE = {
  Monday: [
    { time: "09:00 – 10:30", title: "Data Structures & Algorithms", room: "B-201", lecturer: "Dr. K. Ngata" },
    { time: "11:00 – 12:30", title: "Operating Systems",            room: "B-105", lecturer: "Prof. L. Chen" },
  ],
  Tuesday: [
    { time: "10:00 – 11:30", title: "Database Systems",              room: "B-204", lecturer: "Dr. A. Patel" },
  ],
  Wednesday: [
    { time: "09:00 – 10:30", title: "Data Structures & Algorithms", room: "B-201", lecturer: "Dr. K. Ngata" },
  ],
  Thursday: [
    { time: "09:00 – 10:30", title: "Database Systems",              room: "B-204", lecturer: "Dr. A. Patel" },
  ],
  Friday: [
    { time: "14:00 – 17:00", title: "Project Workshop",              room: "Lab 1", lecturer: "Dr. K. Ngata" },
  ],
};

const FEES = {
  currency: "NZD",
  total: 12800,
  paid: 9600,
  outstanding: 3200,
  items: [
    { id: "INV-2026-001", description: "Semester 1 tuition",            amount: 6400, dueDate: "2026-02-20", status: "paid" },
    { id: "INV-2026-002", description: "Student services levy",         amount: 700,  dueDate: "2026-02-20", status: "paid" },
    { id: "INV-2026-003", description: "Semester 2 tuition",            amount: 2500, dueDate: "2026-07-15", status: "paid" },
    { id: "INV-2026-004", description: "Semester 2 tuition — remainder", amount: 3200, dueDate: "2026-07-15", status: "due" },
  ],
};

const ANNOUNCEMENTS = [
  { id: 1, tag: "Academic", date: "2026-04-10", title: "Semester 1 results released",       body: "Your Semester 1 results are now available in the Grades section of the portal.", priority: "high" },
  { id: 2, tag: "Fees",     date: "2026-04-08", title: "Semester 2 payment reminder",       body: "The remaining Semester 2 tuition balance is due by 15 July 2026.",               priority: "medium" },
  { id: 3, tag: "Campus",   date: "2026-04-02", title: "Library extended hours",            body: "The campus library will remain open until 10:00 PM during the examination period.", priority: "low" },
  { id: 4, tag: "Event",    date: "2026-03-28", title: "Careers Evening — 12 April",        body: "Meet graduate employers from across New Zealand. Register via Careers Services.",  priority: "medium" },
];

const DOCUMENTS = [
  { id: "doc-1", name: "Enrolment confirmation letter", size: "142 KB", type: "PDF", updatedAt: "2026-02-26" },
  { id: "doc-2", name: "Academic transcript",            size: "320 KB", type: "PDF", updatedAt: "2026-03-15" },
  { id: "doc-3", name: "Fees statement — Semester 1",    size: "88 KB",  type: "PDF", updatedAt: "2026-02-22" },
  { id: "doc-4", name: "Programme handbook 2026",        size: "1.2 MB", type: "PDF", updatedAt: "2026-01-15" },
];

// Invitations issued by admins, keyed by one-time token
const INVITATIONS = new Map();

// ============================================================
// HELPERS
// ============================================================

function stripSensitive(user) {
  if (!user) return null;
  const clone = { ...user };
  delete clone.passwordHash;
  return clone;
}

function buildToken(user) {
  return jwt.sign(
    { sub: user.id, loginId: user.loginId, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

function findUserByLoginId(loginId) {
  if (!loginId || typeof loginId !== "string") return null;
  const needle = loginId.trim().toUpperCase();
  return DEMO_USERS.find((u) => u.loginId.toUpperCase() === needle) || null;
}

function findUserById(id) {
  return DEMO_USERS.find((u) => u.id === id) || null;
}

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
  res.json({ ok: true, service: "damecooperinstitute-api" });
});

// ============================================================
// AUTH ROUTES
// ============================================================

app.post("/api/auth/signin", loginLimiter, async (req, res) => {
  // Accept both field names — the newer pages send `loginId`,
  // older drafts used `admissionNo`. Support both.
  const body = req.body || {};
  const loginId = body.loginId || body.admissionNo;
  const password = body.password;

  if (!loginId || !password) {
    return res.status(400).json({
      message: "Login ID and password are required.",
      code: "VALIDATION_ERROR",
    });
  }

  const user = findUserByLoginId(loginId);

  // Always run bcrypt.compare so timing attacks can't distinguish
  // "user not found" from "wrong password"
  const hash = user ? user.passwordHash : "$2a$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalid";
  const ok = await bcrypt.compare(password, hash);

  if (!user || !ok) {
    return res.status(401).json({
      message: "The login ID or password you entered is incorrect.",
      code: "INVALID_CREDENTIALS",
    });
  }

  const token = buildToken(user);
  res.json({ token, user: stripSensitive(user) });
});

// Backwards-compatible alias — some older code may call this path
app.post("/api/auth/login", loginLimiter, (req, res, next) => {
  req.url = "/api/auth/signin";
  app._router.handle(req, res, next);
});

app.post("/api/auth/logout", requireAuth, (req, res) => {
  // Stateless JWT — no server-side session to clear.
  res.json({ ok: true });
});

// ============================================================
// STUDENT ROUTES
// ============================================================

app.get(
  "/api/student/profile",
  requireAuth,
  requireRole("student"),
  (req, res) => {
    const user = findUserById(req.user.sub);
    if (!user) {
      return res.status(404).json({ message: "User not found.", code: "NOT_FOUND" });
    }
    res.json(stripSensitive(user));
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
  (req, res) => {
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const today = dayNames[new Date().getDay()];
    res.json({
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
  }
);

// ============================================================
// STAFF ROUTES
// ============================================================

app.get(
  "/api/staff/profile",
  requireAuth,
  requireRole("staff", "admin"),
  (req, res) => {
    const user = findUserById(req.user.sub);
    if (!user) {
      return res.status(404).json({ message: "User not found.", code: "NOT_FOUND" });
    }
    res.json(stripSensitive(user));
  }
);

// ============================================================
// ADMIN ROUTES — user management
// ============================================================

app.get(
  "/api/admin/users",
  requireAuth,
  requireRole("admin"),
  (req, res) => {
    const users = DEMO_USERS.map((u) => ({
      ...stripSensitive(u),
      status: u.status || "active",
      lastLogin: u.lastLogin || "—",
    }));
    // Add any pending invitations as pseudo-users
    for (const inv of INVITATIONS.values()) {
      if (inv.accepted) continue;
      users.push({
        id: inv.id,
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
    res.json({ users });
  }
);

app.post(
  "/api/admin/users",
  requireAuth,
  requireRole("admin"),
  (req, res) => {
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

    // Duplicate checks
    const existsLogin = findUserByLoginId(loginId);
    const existsEmail = DEMO_USERS.find(
      (u) => u.email.toLowerCase() === email.toLowerCase()
    );
    if (existsLogin || existsEmail) {
      return res.status(409).json({
        message: "That login ID or email address is already in use.",
        code: "DUPLICATE",
      });
    }

    // Create the invitation — never the account itself
    const token = require("crypto").randomBytes(32).toString("hex");
    const invite = {
      id: "inv_" + token.slice(0, 12),
      token,
      firstName,
      lastName,
      email,
      loginId: loginId.toUpperCase(),
      role,
      programme: programme || null,
      createdAt: Date.now(),
      accepted: false,
    };
    INVITATIONS.set(token, invite);

    // In production, send the invitation email here.
    // For now, we log the link so you can test locally.
    const inviteUrl = (process.env.FRONTEND_URL || "https://damecooperinstitute.com") +
      "/accept-invite.html?token=" + token;
    console.log("[admin] Invitation created for " + email + " → " + inviteUrl);

    res.status(201).json({
      user: {
        id: invite.id,
        loginId: invite.loginId,
        role: invite.role,
        firstName: invite.firstName,
        lastName: invite.lastName,
        email: invite.email,
        status: "pending",
      },
      inviteUrl, // remove this when email sending is wired up
    });
  }
);

app.post(
  "/api/admin/users/:id/resend-invite",
  requireAuth,
  requireRole("admin"),
  (req, res) => {
    const inv = [...INVITATIONS.values()].find((i) => i.id === req.params.id);
    if (!inv) {
      return res.status(404).json({
        message: "Invitation not found. It may have been accepted already.",
        code: "NOT_FOUND",
      });
    }
    const inviteUrl = (process.env.FRONTEND_URL || "https://damecooperinstitute.com") +
      "/accept-invite.html?token=" + inv.token;
    console.log("[admin] Invitation resent to " + inv.email + " → " + inviteUrl);
    res.json({ ok: true, inviteUrl });
  }
);

app.patch(
  "/api/admin/users/:id/status",
  requireAuth,
  requireRole("admin"),
  (req, res) => {
    const user = findUserById(req.params.id);
    if (user) {
      user.status = user.status === "suspended" ? "active" : "suspended";
      return res.json({ ...stripSensitive(user), status: user.status });
    }
    const inv = [...INVITATIONS.values()].find((i) => i.id === req.params.id);
    if (inv) {
      inv.accepted = !inv.accepted;
      return res.json({ ok: true });
    }
    res.status(404).json({ message: "User not found.", code: "NOT_FOUND" });
  }
);

// ============================================================
// INVITATION ROUTES — used by accept-invite.html
// ============================================================

app.post("/api/invitations/verify", (req, res) => {
  const { token } = req.body || {};
  if (!token) {
    return res.status(400).json({
      message: "Invitation token is required.",
      code: "VALIDATION_ERROR",
    });
  }
  const inv = INVITATIONS.get(token);
  if (!inv || inv.accepted) {
    return res.status(410).json({
      message: "This invitation link is invalid or has already been used.",
      code: "INVITE_INVALID",
    });
  }
  res.json({
    invite: {
      firstName: inv.firstName,
      lastName: inv.lastName,
      loginId: inv.loginId,
      email: inv.email,
      role: inv.role,
    },
  });
});

app.post("/api/invitations/accept", async (req, res) => {
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
  const inv = INVITATIONS.get(token);
  if (!inv || inv.accepted) {
    return res.status(410).json({
      message: "This invitation link is invalid or has already been used.",
      code: "INVITE_INVALID",
    });
  }

  // In a real app you'd INSERT into the users table here.
  // For the demo, we just add them to the in-memory list.
  DEMO_USERS.push({
    id: "u_" + inv.id,
    loginId: inv.loginId,
    role: inv.role,
    firstName: inv.firstName,
    lastName: inv.lastName,
    initials: (inv.firstName[0] || "") + (inv.lastName[0] || ""),
    email: inv.email,
    programme: inv.programme,
    status: "active",
    passwordHash: await bcrypt.hash(password, 10),
  });

  inv.accepted = true;
  res.json({ ok: true, loginId: inv.loginId });
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
    return res.status(403).json({ message: err.message, code: "CORS_BLOCKED" });
  }
  res.status(500).json({
    message: "An unexpected server error occurred.",
    code: "SERVER_ERROR",
  });
});

// ============================================================
// START
// ============================================================

app.listen(PORT, () => {
  console.log(
    "DameCooper Institute API listening on port " + PORT +
    " (" + (process.env.NODE_ENV || "development") + ")"
  );
});