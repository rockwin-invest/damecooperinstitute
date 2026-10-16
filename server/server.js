// server/server.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || "change-me-in-production";
const JWT_EXPIRES_IN = "4h";

// ---- Middleware
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || "*" }));
app.use(express.json({ limit: "100kb" }));

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: "Too many login attempts. Please try again later.", code: "RATE_LIMITED" }
});

// ---- In-memory demo store (replace with a real database)
const DEMO_USERS = [
  {
    admissionNo: "DC/2025/001",
    // bcrypt hash of "demo1234"
    passwordHash: bcrypt.hashSync("demo1234", 10),
    student: {
      id: "DC-2025-001",
      admissionNo: "DC/2025/001",
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
      campus: "Dunedin Campus"
    }
  }
];

const GRADES = [
  { code: "CS201", title: "Data Structures & Algorithms", credits: 20, grade: "A", points: 8 },
  { code: "CS210", title: "Operating Systems", credits: 20, grade: "B+", points: 7 }
];

const TIMETABLE = {
  Monday: [
    { time: "09:00 – 10:30", title: "Data Structures & Algorithms", room: "B-201", lecturer: "Dr. K. Ngata" }
  ]
};

const FEES = {
  currency: "NZD",
  total: 12800,
  paid: 9600,
  outstanding: 3200,
  items: [
    { id: "INV-2026-001", description: "Semester 1 tuition", amount: 6400, dueDate: "2026-02-20", status: "paid" },
    { id: "INV-2026-004", description: "Semester 2 remainder", amount: 3200, dueDate: "2026-07-15", status: "due" }
  ]
};

const ANNOUNCEMENTS = [
  { id: 1, tag: "Academic", date: "2026-04-10", title: "Semester 1 results released", body: "Your Semester 1 results are now available.", priority: "high" }
];

const DOCUMENTS = [
  { id: "doc-1", name: "Enrolment confirmation letter", size: "142 KB", type: "PDF", updatedAt: "2026-02-26" }
];

// ---- Auth middleware
function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) {
    return res.status(401).json({ message: "Authentication required.", code: "UNAUTHENTICATED" });
  }
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ message: "Your session has expired. Please sign in again.", code: "TOKEN_EXPIRED" });
  }
}

// ---- Routes
app.post("/api/auth/login", loginLimiter, async (req, res) => {
  const { admissionNo, password } = req.body || {};
  if (!admissionNo || !password) {
    return res.status(400).json({ message: "Admission number and password are required.", code: "VALIDATION_ERROR" });
  }
  const user = DEMO_USERS.find(
    (u) => u.admissionNo.toUpperCase() === admissionNo.trim().toUpperCase()
  );
  if (!user) {
    return res.status(401).json({ message: "The admission number or password you entered is incorrect.", code: "INVALID_CREDENTIALS" });
  }
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    return res.status(401).json({ message: "The admission number or password you entered is incorrect.", code: "INVALID_CREDENTIALS" });
  }
  const token = jwt.sign({ sub: user.student.id, admissionNo: user.admissionNo }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  res.json({ token, student: user.student });
});

app.post("/api/auth/logout", requireAuth, (req, res) => res.json({ ok: true }));

app.get("/api/student/profile",       requireAuth, (req, res) => res.json(req.user.admissionNo === DEMO_USERS[0].admissionNo ? DEMO_USERS[0].student : {}));
app.get("/api/student/grades",        requireAuth, (req, res) => res.json({ grades: GRADES }));
app.get("/api/student/timetable",     requireAuth, (req, res) => res.json({ days: TIMETABLE }));
app.get("/api/student/fees",          requireAuth, (req, res) => res.json(FEES));
app.get("/api/student/announcements", requireAuth, (req, res) => res.json({ announcements: ANNOUNCEMENTS }));
app.get("/api/student/documents",     requireAuth, (req, res) => res.json({ documents: DOCUMENTS }));

app.get("/api/student/dashboard", requireAuth, (req, res) => {
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const today = dayNames[new Date().getDay()];
  res.json({
    stats: {
      gpa: "7.2",
      creditsThisYear: 90,
      outstandingFees: FEES.outstanding,
      currency: FEES.currency,
      attendancePercent: 94
    },
    announcements: ANNOUNCEMENTS.slice(0, 3),
    todayClasses: TIMETABLE[today] || []
  });
});

app.listen(PORT, () => {
  console.log("DameCooper student portal API listening on http://localhost:" + PORT);
});