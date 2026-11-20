// FR-5: Note Approval Queue  (Owner: Member 2)
// Reviewers and admins see pending notes, then approve them or decline them with a reason.
// Approving gives the author POINT_RULES.NOTE_APPROVED points.
const Note = require("../../models/Note");
const { changePoints, POINT_RULES } = require("../../services/points");
const { toListItem } = require("../../utils/noteView");

const OBJECT_ID = /^[0-9a-fA-F]{24}$/;
const STATUSES = ["pending", "approved", "declined"];
const MIN_REASON = 5;
const MAX_REASON = 300;

function notFound(res) {
  return res.status(404).json({ message: "Note not found" });
}

// What a queue row looks like: the normal list item plus the review details.
function toQueueItem(note) {
  return {
    ...toListItem(note),
    declineReason: note.declineReason || "",
    reviewedAt: note.reviewedAt || null,
    reviewedByName: note.reviewedBy && note.reviewedBy.name ? note.reviewedBy.name : "",
    fileName: note.fileName,
  };
}

// GET /api/approvals?status=pending|approved|declined&page=1&limit=10
// Pending notes are shown oldest first (first come, first served). The other tabs show newest first.
// You never see your own notes here, because nobody may approve their own note.
async function listQueue(req, res, next) {
  try {
    const status = STATUSES.includes(req.query.status) ? req.query.status : "pending";
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 50);

    const filter = { status, author: { $ne: req.user._id } };
    const sort = status === "pending" ? { createdAt: 1 } : { reviewedAt: -1, createdAt: -1 };

    const [total, notes, pendingCount] = await Promise.all([
      Note.countDocuments(filter),
      Note.find(filter)
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit)
        .populate("author", "name")
        .populate("reviewedBy", "name"),
      Note.countDocuments({ status: "pending", author: { $ne: req.user._id } }),
    ]);

    res.json({
      notes: notes.map(toQueueItem),
      page,
      limit,
      total,
      totalPages: Math.max(Math.ceil(total / limit), 1),
      pendingCount,
    });
  } catch (err) {
    next(err);
  }
}

// Why a decision failed, so the message is helpful.
async function explainFailure(req, res) {
  const existing = await Note.findById(req.params.id).select("status author");
  if (!existing) return notFound(res);
  if (String(existing.author) === String(req.user._id)) {
    return res.status(403).json({ message: "You cannot approve or decline your own note" });
  }
  return res.status(409).json({ message: `This note was already ${existing.status}` });
}

// POST /api/approvals/:id/approve
// One atomic update: it only matches a pending note that is not yours, so two reviewers clicking
// at the same moment cannot both approve it, and the author is paid exactly once.
async function approveNote(req, res, next) {
  try {
    if (!OBJECT_ID.test(req.params.id)) return notFound(res);

    const note = await Note.findOneAndUpdate(
      { _id: req.params.id, status: "pending", author: { $ne: req.user._id } },
      { status: "approved", reviewedBy: req.user._id, reviewedAt: new Date(), $unset: { declineReason: "" } },
      { new: true }
    ).populate("author", "name");

    if (!note) return explainFailure(req, res);

    await changePoints(note.author._id, POINT_RULES.NOTE_APPROVED, "note_approved", note._id);
    res.json({ note: toQueueItem(note) });
  } catch (err) {
    next(err);
  }
}

// POST /api/approvals/:id/decline   body: { reason }
async function declineNote(req, res, next) {
  try {
    if (!OBJECT_ID.test(req.params.id)) return notFound(res);

    const reason = String(req.body.reason || "").trim();
    if (reason.length < MIN_REASON || reason.length > MAX_REASON) {
      return res
        .status(400)
        .json({ message: `Please write a reason between ${MIN_REASON} and ${MAX_REASON} characters` });
    }

    const note = await Note.findOneAndUpdate(
      { _id: req.params.id, status: "pending", author: { $ne: req.user._id } },
      { status: "declined", declineReason: reason, reviewedBy: req.user._id, reviewedAt: new Date() },
      { new: true }
    ).populate("author", "name");

    if (!note) return explainFailure(req, res);

    res.json({ note: toQueueItem(note) });
  } catch (err) {
    next(err);
  }
}

module.exports = { listQueue, approveNote, declineNote };
