// FR-4: Note Details, Like and Save  (Owner: Member 1)
const Note = require("../../models/Note");
const Interaction = require("../../models/Interaction");
const { openFileStream, getFileInfo } = require("../../config/gridfs");
const { authorizeDownload } = require("../../services/downloadGate");
const { toListItem, toDetail } = require("../../utils/noteView");

const OBJECT_ID = /^[0-9a-fA-F]{24}$/;

function idOf(value) {
  return String(value && value._id ? value._id : value);
}

// Approved notes are public. A pending or declined note is visible only to its author,
// reviewers and admins (so nobody else can open it by guessing the link).
function canView(user, note) {
  if (note.status === "approved") return true;
  if (!user) return false;
  if (user.role === "admin" || user.role === "reviewer") return true;
  return idOf(note.author) === idOf(user._id);
}

function notFound(res) {
  return res.status(404).json({ message: "Note not found" });
}

async function loadNote(req) {
  if (!OBJECT_ID.test(req.params.id)) return null;
  return Note.findById(req.params.id).populate("author", "name");
}

// GET /api/notes/:id  (public)
async function getNote(req, res, next) {
  try {
    const note = await loadNote(req);
    if (!note || !canView(req.user, note)) return notFound(res);

    let likedByMe = false;
    let savedByMe = false;
    if (req.user) {
      const mine = await Interaction.find({
        user: req.user._id,
        note: note._id,
        type: { $in: ["like", "save"] },
      }).select("type");
      likedByMe = mine.some((i) => i.type === "like");
      savedByMe = mine.some((i) => i.type === "save");
    }

    const isOwner = !!req.user && idOf(note.author) === idOf(req.user._id);
    const isStaff = !!req.user && (req.user.role === "admin" || req.user.role === "reviewer");

    const detail = toDetail(note, { likedByMe, savedByMe, isOwner });
    // The decline reason is for the author and the reviewers only.
    if (!isOwner && !isStaff) detail.declineReason = "";

    res.json({ note: detail });
  } catch (err) {
    next(err);
  }
}

// POST /api/notes/:id/like  (a user can like a note only once)
async function likeNote(req, res, next) {
  try {
    const note = await loadNote(req);
    if (!note || !canView(req.user, note)) return notFound(res);
    if (note.status !== "approved") {
      return res.status(400).json({ message: "Only approved notes can be liked" });
    }
    if (idOf(note.author) === idOf(req.user._id)) {
      return res.status(400).json({ message: "You cannot like your own note" });
    }

    try {
      await Interaction.create({
        user: req.user._id,
        note: note._id,
        type: "like",
        uniqueKey: Interaction.keyFor("like", req.user._id, note._id),
      });
    } catch (err) {
      if (err.code === 11000) {
        return res.status(409).json({ message: "You have already liked this note" });
      }
      throw err;
    }

    const updated = await Note.findByIdAndUpdate(note._id, { $inc: { likesCount: 1 } }, { new: true });
    res.json({ liked: true, likesCount: updated.likesCount });
  } catch (err) {
    next(err);
  }
}

// POST /api/notes/:id/save
async function saveNote(req, res, next) {
  try {
    const note = await loadNote(req);
    if (!note || !canView(req.user, note)) return notFound(res);
    if (note.status !== "approved") {
      return res.status(400).json({ message: "Only approved notes can be saved" });
    }

    // Saving twice does nothing, so there is never a duplicate.
    await Interaction.updateOne(
      { uniqueKey: Interaction.keyFor("save", req.user._id, note._id) },
      { $setOnInsert: { user: req.user._id, note: note._id, type: "save" } },
      { upsert: true }
    );
    res.json({ saved: true });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/notes/:id/save
async function unsaveNote(req, res, next) {
  try {
    if (!OBJECT_ID.test(req.params.id)) return notFound(res);
    await Interaction.deleteOne({ uniqueKey: Interaction.keyFor("save", req.user._id, req.params.id) });
    res.json({ saved: false });
  } catch (err) {
    next(err);
  }
}

// GET /api/notes/saved
async function listSaved(req, res, next) {
  try {
    const rows = await Interaction.find({ user: req.user._id, type: "save" })
      .sort({ createdAt: -1 })
      .populate({ path: "note", populate: { path: "author", select: "name" } });

    const notes = rows
      .map((row) => row.note)
      .filter((note) => note && note.status === "approved")
      .map(toListItem);

    res.json({ notes });
  } catch (err) {
    next(err);
  }
}

// File names can contain any language, so send both a plain and a UTF-8 version.
function contentDisposition(fileName) {
  const plain = fileName.replace(/[^\x20-\x7E]/g, "_").replace(/["\\]/g, "_");
  const encoded = encodeURIComponent(fileName).replace(
    /['()*]/g,
    (ch) => `%${ch.charCodeAt(0).toString(16).toUpperCase()}`
  );
  return `attachment; filename="${plain}"; filename*=UTF-8''${encoded}`;
}

// GET /api/notes/:id/download  (login required)
async function downloadNote(req, res, next) {
  try {
    const note = await loadNote(req);
    if (!note || !canView(req.user, note)) return notFound(res);

    // Module 1: always allowed. FR-10 adds the download limit and point charge in this service.
    const gate = await authorizeDownload(req.user, note);
    if (!gate.allowed) {
      return res.status(gate.status || 403).json({ message: gate.message || "Download not allowed" });
    }

    const info = await getFileInfo(note.fileId);
    if (!info) {
      return res.status(404).json({ message: "The file for this note could not be found" });
    }

    res.set({
      "Content-Type": note.mimeType || "application/octet-stream",
      "Content-Length": info.length,
      "Content-Disposition": contentDisposition(note.fileName || "note"),
    });

    const isOwner = idOf(note.author) === idOf(req.user._id);
    // Record the download once the file has been sent completely.
    res.once("finish", () => {
      Interaction.create({
        user: req.user._id,
        note: note._id,
        type: "download",
        pointsCharged: gate.charged || 0,
      }).catch((err) => console.error("Could not log download:", err.message));

      if (note.status === "approved" && !isOwner) {
        Note.updateOne({ _id: note._id }, { $inc: { downloadsCount: 1 } }).catch((err) =>
          console.error("Could not update download count:", err.message)
        );
      }
    });

    const stream = openFileStream(note.fileId);
    stream.on("error", () => res.destroy());
    stream.pipe(res);
  } catch (err) {
    next(err);
  }
}

module.exports = { getNote, likeNote, saveNote, unsaveNote, listSaved, downloadNote };
