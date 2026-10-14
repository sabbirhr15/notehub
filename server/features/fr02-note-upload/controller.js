// FR-2: Note Upload  (Owner: Member 2)
const multer = require("multer");
const Note = require("../../models/Note");
const { saveFile, deleteFile } = require("../../config/gridfs");
const { MAX_FILE_SIZE, checkNoteFile, mimeFor } = require("../../utils/noteFiles");
const { toListItem } = require("../../utils/noteView");

// The file is kept in memory first, checked, and then saved into MongoDB (GridFS).
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE, files: 1 },
});

// "Maths, Physics ,maths" -> ["maths", "physics"]. At most 10 tags, each up to 30 characters.
function parseTags(raw) {
  const seen = new Set();
  String(raw || "")
    .split(",")
    .map((tag) => tag.trim().toLowerCase())
    .filter((tag) => tag.length > 0 && tag.length <= 30)
    .forEach((tag) => seen.add(tag));
  return Array.from(seen).slice(0, 10);
}

function badRequest(res, message) {
  return res.status(400).json({ message });
}

// POST /api/upload  (login required, multipart form with a "file" field)
async function createNote(req, res, next) {
  try {
    const file = req.file;
    const title = String(req.body.title || "").trim();
    const subject = String(req.body.subject || "").trim();
    const className = String(req.body.className || "").trim();
    const description = String(req.body.description || "").trim();

    if (!title) return badRequest(res, "Please enter a title");
    if (title.length > 120) return badRequest(res, "Title must be 120 characters or fewer");
    if (!subject) return badRequest(res, "Please enter a subject");
    if (subject.length > 80) return badRequest(res, "Subject must be 80 characters or fewer");
    if (className.length > 80) return badRequest(res, "Class must be 80 characters or fewer");
    if (!description) return badRequest(res, "Please write a short description of the note");
    if (description.length > 500) return badRequest(res, "Description must be 500 characters or fewer");

    if (file) {
      // Browsers send file names as raw bytes. This restores names in any language (for example Bangla).
      file.originalname = Buffer.from(file.originalname, "latin1").toString("utf8");
    }
    const fileProblem = checkNoteFile(file);
    if (fileProblem) return badRequest(res, fileProblem);

    const mimeType = mimeFor(file.originalname);
    const fileId = await saveFile(file.buffer, file.originalname, mimeType);

    let note;
    try {
      note = await Note.create({
        author: req.user._id,
        title,
        subject,
        className,
        tags: parseTags(req.body.tags),
        description,
        fileId,
        fileName: file.originalname,
        mimeType,
        fileSize: file.size,
        // status stays "pending" until a reviewer or admin approves it (FR-5)
      });
    } catch (err) {
      // Do not leave an orphan file behind if the note could not be saved.
      await deleteFile(fileId).catch(() => {});
      throw err;
    }

    note.author = { _id: req.user._id, name: req.user.name };
    res.status(201).json({
      message: "Note uploaded. It will appear in Browse after it is approved.",
      note: toListItem(note),
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/upload/mine  (the logged-in user's own uploads, with their status)
async function listMine(req, res, next) {
  try {
    const notes = await Note.find({ author: req.user._id })
      .sort({ createdAt: -1 })
      .populate("author", "name");

    res.json({
      notes: notes.map((note) => ({ ...toListItem(note), declineReason: note.declineReason || "" })),
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { upload, createNote, listMine };
