// ============================================================
// Local file storage
// ------------------------------------------------------------
// Documents live under server/storage/documents/<studentId>/.
// In production, swap this out for cloud storage (S3, R2,
// Backblaze) and generate signed URLs on download instead.
// ============================================================

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "storage", "documents");

function ensureDir(p) {
  if (!fs.existsSync(p)) {
    fs.mkdirSync(p, { recursive: true });
  }
}

function documentPath(studentId, storageKey) {
  const studentDir = path.join(ROOT, String(studentId));
  return path.join(studentDir, path.basename(storageKey));
}

function fileExists(studentId, storageKey) {
  return fs.existsSync(documentPath(studentId, storageKey));
}

function writeDocument(studentId, storageKey, buffer) {
  const studentDir = path.join(ROOT, String(studentId));
  ensureDir(studentDir);
  fs.writeFileSync(path.join(studentDir, path.basename(storageKey)), buffer);
}

function streamDocument(studentId, storageKey) {
  return fs.createReadStream(documentPath(studentId, storageKey));
}

module.exports = {
  ROOT,
  documentPath,
  fileExists,
  writeDocument,
  streamDocument
};