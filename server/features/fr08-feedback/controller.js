// FR-8: Feedback and Suggestions  (Owner: Member 2)
// Any logged-in user can send feedback. The admin reads it and updates its status.
const Feedback = require("../../models/Feedback");

const OBJECT_ID = /^[0-9a-fA-F]{24}$/;
const TYPES = ["suggestion", "bug", "other"];
const STATUSES = ["new", "reviewed", "resolved"];
const MIN_MESSAGE = 10;
const MAX_MESSAGE = 1000;
const MAX_NOTE = 500;
const DAILY_LIMIT = 10; // stops one account from flooding the admin page

function toFeedbackItem(item) {
  const user = item.user && item.user.name ? item.user : null;
  return {
    id: String(item._id),
    type: item.type,
    message: item.message,
    status: item.status,
    adminNote: item.adminNote || "",
    userName: user ? user.name : "",
    userEmail: user ? user.email : "",
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

// POST /api/feedback   body: { type, message }
async function createFeedback(req, res, next) {
  try {
    const type = TYPES.includes(req.body.type) ? req.body.type : "suggestion";
    const message = String(req.body.message || "").trim();

    if (message.length < MIN_MESSAGE || message.length > MAX_MESSAGE) {
      return res
        .status(400)
        .json({ message: `Message must be between ${MIN_MESSAGE} and ${MAX_MESSAGE} characters` });
    }

    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const sentToday = await Feedback.countDocuments({ user: req.user._id, createdAt: { $gte: since } });
    if (sentToday >= DAILY_LIMIT) {
      return res.status(429).json({ message: "You have sent a lot of feedback today. Please try again tomorrow" });
    }

    const item = await Feedback.create({ user: req.user._id, type, message });
    res.status(201).json({ feedback: toFeedbackItem(item) });
  } catch (err) {
    next(err);
  }
}

// GET /api/feedback/mine   (what I sent, with the admin's answer)
async function listMine(req, res, next) {
  try {
    const rows = await Feedback.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json({ feedback: rows.map(toFeedbackItem) });
  } catch (err) {
    next(err);
  }
}

// GET /api/feedback?status=new|reviewed|resolved&type=...&page=1   (admin)
async function listAll(req, res, next) {
  try {
    const filter = {};
    if (STATUSES.includes(req.query.status)) filter.status = req.query.status;
    if (TYPES.includes(req.query.type)) filter.type = req.query.type;

    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 15, 1), 50);

    const [total, rows, newCount] = await Promise.all([
      Feedback.countDocuments(filter),
      Feedback.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate("user", "name email"),
      Feedback.countDocuments({ status: "new" }),
    ]);

    res.json({
      feedback: rows.map(toFeedbackItem),
      page,
      limit,
      total,
      totalPages: Math.max(Math.ceil(total / limit), 1),
      newCount,
    });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/feedback/:id   body: { status?, adminNote? }   (admin)
async function updateFeedback(req, res, next) {
  try {
    if (!OBJECT_ID.test(req.params.id)) return res.status(404).json({ message: "Feedback not found" });

    const changes = {};
    if (req.body.status !== undefined) {
      if (!STATUSES.includes(req.body.status)) {
        return res.status(400).json({ message: "Status must be new, reviewed or resolved" });
      }
      changes.status = req.body.status;
    }
    if (req.body.adminNote !== undefined) {
      const adminNote = String(req.body.adminNote).trim();
      if (adminNote.length > MAX_NOTE) {
        return res.status(400).json({ message: `Note must be at most ${MAX_NOTE} characters` });
      }
      changes.adminNote = adminNote;
    }
    if (Object.keys(changes).length === 0) {
      return res.status(400).json({ message: "Nothing to update" });
    }
    changes.handledBy = req.user._id;

    const item = await Feedback.findByIdAndUpdate(req.params.id, changes, { new: true }).populate(
      "user",
      "name email"
    );
    if (!item) return res.status(404).json({ message: "Feedback not found" });

    res.json({ feedback: toFeedbackItem(item) });
  } catch (err) {
    next(err);
  }
}

module.exports = { createFeedback, listMine, listAll, updateFeedback };
