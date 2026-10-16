const storage = require("./storage");

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
      size: Math.round(buf.length / 1024) + " KB",
      updatedAt: new Date()
    });
  }
  console.log("[seed] Documents created:", docs.length);
}