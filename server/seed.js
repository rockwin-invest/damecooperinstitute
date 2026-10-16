// ============================================================
// One-time seed script
// ------------------------------------------------------------
// Run locally with: node server/seed.js
//
// Creates:
//   • Three demo users (student, staff, admin)
//   • Grades, timetable, invoices, documents for the student
//   • Global announcements authored by the admin
//
// Idempotent — running it twice won't duplicate anything.
// ============================================================

require("dotenv").config();

const bcrypt = require("bcryptjs");
const { connectDb, mongoose } = require("./db");

const User         = require("./models/User");
const Grade        = require("./models/Grade");
const ClassSession = require("./models/ClassSession");
const Invoice      = require("./models/Invoice");
const Document     = require("./models/Document");
const Announcement = require("./models/Announcement");

const storage = require("./storage");

/* ------------------------------------------------------------
   User creation / lookup
   ------------------------------------------------------------ */
async function upsertUser(data) {
  const existing = await User.findOne({ loginId: data.loginId });
  if (existing) {
    console.log("[seed] User exists:", data.loginId);
    return existing;
  }
  const { password, ...rest } = data;
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({ ...rest, passwordHash, status: "active" });
  console.log("[seed] User created:", data.loginId, "(" + data.role + ")");
  return user;
}

/* ------------------------------------------------------------
   Grades
   ------------------------------------------------------------ */
async function seedGrades(studentId) {
  const semester = "2026-S1";
  const count = await Grade.countDocuments({ studentId, semester });
  if (count > 0) {
    console.log("[seed] Grades already present for this student");
    return;
  }

  const grades = [
    { code: "CS201",   title: "Data Structures & Algorithms", credits: 20, grade: "A",  points: 8 },
    { code: "CS210",   title: "Operating Systems",             credits: 20, grade: "B+", points: 7 },
    { code: "CS220",   title: "Database Systems",              credits: 20, grade: "A",  points: 8 },
    { code: "MATH201", title: "Linear Algebra",                credits: 15, grade: "A-", points: 7 },
    { code: "ENG205",  title: "Technical Communication",       credits: 15, grade: "B",  points: 6 }
  ];

  await Grade.insertMany(
    grades.map((g) => ({ ...g, studentId, semester }))
  );
  console.log("[seed] Grades created:", grades.length);
}

/* ------------------------------------------------------------
   Timetable — links each session to both the student and the
   staff member who teaches it.
   ------------------------------------------------------------ */
async function seedTimetable(studentId, staffId) {
  const semester = "2026-S1";
  const count = await ClassSession.countDocuments({ studentId, semester });
  if (count > 0) {
    console.log("[seed] Timetable already present for this student");
    return;
  }

  const sessions = [
    { courseCode: "CS201",   courseTitle: "Data Structures & Algorithms", dayOfWeek: "Monday",    startTime: "09:00", endTime: "10:30", room: "B-201", lecturer: "Dr. J. Aroha" },
    { courseCode: "CS210",   courseTitle: "Operating Systems",             dayOfWeek: "Monday",    startTime: "11:00", endTime: "12:30", room: "B-105", lecturer: "Dr. J. Aroha" },
    { courseCode: "MATH201", courseTitle: "Linear Algebra",                dayOfWeek: "Monday",    startTime: "14:00", endTime: "15:30", room: "A-310", lecturer: "Dr. M. Reid" },
    { courseCode: "CS220",   courseTitle: "Database Systems",              dayOfWeek: "Tuesday",   startTime: "10:00", endTime: "11:30", room: "B-204", lecturer: "Dr. J. Aroha" },
    { courseCode: "ENG205",  courseTitle: "Technical Communication",       dayOfWeek: "Tuesday",   startTime: "13:00", endTime: "14:30", room: "C-102", lecturer: "Ms. H. Walker" },
    { courseCode: "CS201",   courseTitle: "Data Structures & Algorithms", dayOfWeek: "Wednesday", startTime: "09:00", endTime: "10:30", room: "B-201", lecturer: "Dr. J. Aroha" },
    { courseCode: "CS210",   courseTitle: "Operating Systems (Lab)",       dayOfWeek: "Wednesday", startTime: "15:00", endTime: "16:30", room: "Lab 3", lecturer: "Dr. J. Aroha" },
    { courseCode: "CS220",   courseTitle: "Database Systems",              dayOfWeek: "Thursday",  startTime: "09:00", endTime: "10:30", room: "B-204", lecturer: "Dr. J. Aroha" },
    { courseCode: "MATH201", courseTitle: "Linear Algebra",                dayOfWeek: "Thursday",  startTime: "11:00", endTime: "12:30", room: "A-310", lecturer: "Dr. M. Reid" },
    { courseCode: "ENG205",  courseTitle: "Technical Communication",       dayOfWeek: "Friday",    startTime: "10:00", endTime: "11:30", room: "C-102", lecturer: "Ms. H. Walker" },
    { courseCode: "CS201",   courseTitle: "Project Workshop",              dayOfWeek: "Friday",    startTime: "14:00", endTime: "17:00", room: "Lab 1", lecturer: "Dr. J. Aroha" }
  ];

  await ClassSession.insertMany(
    sessions.map((s) => ({
      ...s,
      studentId,
      staffId: staffId || null,
      semester
    }))
  );
  console.log("[seed] Class sessions created:", sessions.length);
}

/* ------------------------------------------------------------
   Invoices
   ------------------------------------------------------------ */
async function seedInvoices(studentId) {
  const count = await Invoice.countDocuments({ studentId });
  if (count > 0) {
    console.log("[seed] Invoices already present for this student");
    return;
  }

  const invoices = [
    { reference: "INV-2026-001", description: "Semester 1 tuition",             amount: 6400, dueDate: new Date("2026-02-20"), status: "paid", paidAt: new Date("2026-02-15") },
    { reference: "INV-2026-002", description: "Student services levy",          amount: 700,  dueDate: new Date("2026-02-20"), status: "paid", paidAt: new Date("2026-02-15") },
    { reference: "INV-2026-003", description: "Semester 2 tuition",             amount: 2500, dueDate: new Date("2026-07-15"), status: "paid", paidAt: new Date("2026-07-10") },
    { reference: "INV-2026-004", description: "Semester 2 tuition — remainder", amount: 3200, dueDate: new Date("2026-07-15"), status: "due",  paidAt: null }
  ];

  await Invoice.insertMany(
    invoices.map((i) => ({ ...i, studentId, currency: "NZD" }))
  );
  console.log("[seed] Invoices created:", invoices.length);
}

/* ------------------------------------------------------------
   Documents — generates real (tiny) PDFs and writes them to
   server/storage/documents/<studentId>/
   ------------------------------------------------------------ */
async function seedDocuments(studentId) {
  const count = await Document.countDocuments({ studentId });
  if (count > 0) {
    console.log("[seed] Documents already present for this student");
    return;
  }

  // Minimal valid PDF — renders as a blank page with text
  function makePdf(text) {
    const content = "BT /F1 14 Tf 60 720 Td (" + text + ") Tj ET";
    const objects = [
      "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n",
      "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n",
      "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n",
      "4 0 obj\n<< /Length " + content.length + " >>\nstream\n" + content + "\nendstream\nendobj\n",
      "5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n"
    ];
    let pdf = "%PDF-1.4\n";
    const offsets = [0];
    for (const o of objects) {
      offsets.push(pdf.length);
      pdf += o;
    }
    const xrefPos = pdf.length;
    pdf += "xref\n0 " + (objects.length + 1) + "\n";
    pdf += "0000000000 65535 f \n";
    for (let i = 1; i <= objects.length; i++) {
      pdf += String(offsets[i]).padStart(10, "0") + " 00000 n \n";
    }
    pdf += "trailer\n<< /Size " + (objects.length + 1) + " /Root 1 0 R >>\n";
    pdf += "startxref\n" + xrefPos + "\n%%EOF\n";
    return Buffer.from(pdf, "binary");
  }

  function humanSize(bytes) {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  }

  const docs = [
    { name: "Enrolment confirmation letter", key: "enrolment-2026.pdf", text: "Enrolment Confirmation — DameCooper Institute" },
    { name: "Academic transcript",            key: "transcript-2026.pdf", text: "Academic Transcript — DameCooper Institute" },
    { name: "Fees statement — Semester 1",    key: "fees-s1-2026.pdf",    text: "Fees Statement Semester 1 — DameCooper Institute" },
    { name: "Programme handbook 2026",        key: "handbook-2026.pdf",   text: "Programme Handbook 2026 — DameCooper Institute" }
  ];

  for (const d of docs) {
    const buf = makePdf(d.text);
    storage.writeDocument(studentId, d.key, buf);
    await Document.create({
      studentId,
      name: d.name,
      storageKey: d.key,
      type: "PDF",
      mimeType: "application/pdf",
      size: humanSize(buf.length),
      updatedAt: new Date()
    });
  }
  console.log("[seed] Documents created:", docs.length);
}

/* ------------------------------------------------------------
   Announcements
   ------------------------------------------------------------ */
async function seedAnnouncements(authorId) {
  const count = await Announcement.countDocuments({});
  if (count > 0) {
    console.log("[seed] Announcements already present");
    return;
  }

  const announcements = [
    { tag: "Academic", title: "Semester 1 results released", body: "Your Semester 1 results are now available in the Grades section of the portal.", priority: "high",   publishedAt: new Date("2026-04-10") },
    { tag: "Fees",     title: "Semester 2 payment reminder", body: "The remaining Semester 2 tuition balance is due by 15 July 2026.",               priority: "medium", publishedAt: new Date("2026-04-08") },
    { tag: "Campus",   title: "Library extended hours",      body: "The campus library will remain open until 10:00 PM during the examination period.", priority: "low",    publishedAt: new Date("2026-04-02") },
    { tag: "Event",    title: "Careers Evening — 12 April",  body: "Meet graduate employers from across New Zealand. Register via the Careers Services page.", priority: "medium", publishedAt: new Date("2026-03-28") }
  ];

  await Announcement.insertMany(
    announcements.map((a) => ({ ...a, authorId }))
  );
  console.log("[seed] Announcements created:", announcements.length);
}

/* ============================================================
   MAIN
   ============================================================ */
async function seed() {
  await connectDb();
  console.log("[seed] Connected to MongoDB");

  // 1. Users
  const student = await upsertUser({
    loginId: "DC/2025/001",
    role: "student",
    firstName: "Sarah",
    lastName: "Johnson",
    email: "sarah.johnson@student.damecooperinstitute.com",
    phone: "+64 21 234 5678",
    dateOfBirth: new Date("2003-04-12"),
    nationality: "New Zealand",
    programme: "BSc Computer Science",
    programmeCode: "BSC-CS",
    school: "School of Engineering",
    level: "Undergraduate — Year 2",
    studyMode: "On campus",
    advisor: "Dr. James Aroha",
    campus: "Dunedin Campus",
    password: "demo1234"
  });

  const staff = await upsertUser({
    loginId: "ST/2020/014",
    role: "staff",
    firstName: "James",
    lastName: "Aroha",
    email: "james.aroha@damecooperinstitute.com",
    department: "School of Engineering",
    title: "Senior Lecturer",
    campus: "Dunedin Campus",
    password: "staff1234"
  });

  const admin = await upsertUser({
    loginId: "AD/2019/001",
    role: "admin",
    firstName: "Rachel",
    lastName: "Tui",
    email: "rachel.tui@damecooperinstitute.com",
    department: "Registrar",
    title: "Registrar",
    campus: "Dunedin Campus",
    password: "admin1234"
  });

  // 2. Academic data for the demo student — sessions linked to the staff member
  await seedGrades(student._id);
  await seedTimetable(student._id, staff._id);
  await seedInvoices(student._id);
  await seedDocuments(student._id);

  // 3. Global announcements (authored by admin)
  await seedAnnouncements(admin._id);

  console.log("[seed] Done.");
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error("[seed] Failed:", err);
  process.exit(1);
});