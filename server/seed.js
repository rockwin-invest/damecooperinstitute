// ============================================================
// One-time seed script
// ------------------------------------------------------------
// Run once with: node server/seed.js
// Creates the three demo accounts in MongoDB.
// ============================================================

require("dotenv").config();
const bcrypt = require("bcryptjs");
const { connectDb, mongoose } = require("./db");
const User = require("./models/User");

async function seed() {
  await connectDb();

  const demoUsers = [
    {
      loginId: "DC/2025/001",
      role: "student",
      firstName: "Sarah",
      lastName: "Johnson",
      initials: "SJ",
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
      password: "demo1234",
    },
    {
      loginId: "ST/2020/014",
      role: "staff",
      firstName: "James",
      lastName: "Aroha",
      initials: "JA",
      email: "james.aroha@damecooperinstitute.com",
      department: "School of Engineering",
      title: "Senior Lecturer",
      campus: "Dunedin Campus",
      password: "staff1234",
    },
    {
      loginId: "AD/2019/001",
      role: "admin",
      firstName: "Rachel",
      lastName: "Tui",
      initials: "RT",
      email: "rachel.tui@damecooperinstitute.com",
      department: "Registrar",
      title: "Registrar",
      campus: "Dunedin Campus",
      password: "admin1234",
    },
  ];

  for (const u of demoUsers) {
    const exists = await User.findOne({ loginId: u.loginId });
    if (exists) {
      console.log("[seed] Skipping existing:", u.loginId);
      continue;
    }
    const passwordHash = await bcrypt.hash(u.password, 10);
    const { password, ...rest } = u;
    await User.create({ ...rest, passwordHash, status: "active" });
    console.log("[seed] Created:", u.loginId, "(" + u.role + ")");
  }

  console.log("[seed] Done.");
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error("[seed] Failed:", err);
  process.exit(1);
});