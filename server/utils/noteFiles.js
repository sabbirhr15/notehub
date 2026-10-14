// Rules for the files users can upload (FR-2) and download (FR-4).
// Shared helper, so both features agree on what a valid note file is.
const path = require("path");

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

// extension -> { kind, mime }. The mime type we store comes from here, never from the browser.
const ALLOWED = {
  ".pdf": { kind: "pdf", mime: "application/pdf" },
  ".png": { kind: "image", mime: "image/png" },
  ".jpg": { kind: "image", mime: "image/jpeg" },
  ".jpeg": { kind: "image", mime: "image/jpeg" },
  ".webp": { kind: "image", mime: "image/webp" },
  ".docx": {
    kind: "docx",
    mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  },
  ".pptx": {
    kind: "pptx",
    mime: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  },
};

const ALLOWED_TEXT = "PDF, image (PNG, JPG, WEBP), Word (DOCX) or PowerPoint (PPTX)";

function extensionOf(fileName = "") {
  return path.extname(fileName).toLowerCase();
}

function kindOf(fileName) {
  const info = ALLOWED[extensionOf(fileName)];
  return info ? info.kind : "file";
}

// Checks the first bytes of the file, so a renamed .exe cannot pass as a .pdf.
function matchesSignature(ext, buf) {
  if (!buf || buf.length < 12) return false;
  const hex = buf.subarray(0, 4).toString("hex");
  switch (ALLOWED[ext].kind) {
    case "pdf":
      return buf.subarray(0, 4).toString("latin1") === "%PDF";
    case "image":
      if (ext === ".png") return hex === "89504e47";
      if (ext === ".webp") {
        return buf.subarray(0, 4).toString("latin1") === "RIFF" && buf.subarray(8, 12).toString("latin1") === "WEBP";
      }
      return hex.startsWith("ffd8ff"); // jpg, jpeg
    case "docx":
    case "pptx":
      return hex === "504b0304"; // DOCX and PPTX are zip files
    default:
      return false;
  }
}

// Returns an error message, or null if the file is fine. `file` is a multer memory file.
function checkNoteFile(file) {
  if (!file) return "Please choose a file to upload";
  const ext = extensionOf(file.originalname);
  if (!ALLOWED[ext]) return `Only ${ALLOWED_TEXT} files are allowed`;
  if (file.size > MAX_FILE_SIZE) return "File is too large. Maximum size is 10 MB";
  if (!matchesSignature(ext, file.buffer)) return `This file does not look like a real ${ext.slice(1).toUpperCase()} file`;
  return null;
}

function mimeFor(fileName) {
  const info = ALLOWED[extensionOf(fileName)];
  return info ? info.mime : "application/octet-stream";
}

module.exports = { MAX_FILE_SIZE, ALLOWED_TEXT, kindOf, mimeFor, checkNoteFile };
