// FR-7: Note Reviews  (Owner: Member 1)
// A reviewer (or admin) writes a rating and a comment on an approved note.
// The review stays "pending" until the note's author approves it. Only then is it public,
// and the reviewer earns POINT_RULES.REVIEW_APPROVED points.
const Review = require("../../models/Review");
const Note = require("../../models/Note");
const { changePoints, POINT_RULES } = require("../../services/points");

const OBJECT_ID = /^[0-9a-fA-F]{24}$/;
const MIN_COMMENT = 10;
const MAX_COMMENT = 500;

function idOf(value) {
  return String(value && value._id ? value._id : value);
}

function notFound(res, what = "Review") {
  return res.status(404).json({ message: `${what} not found` });
}

// The review shape the client receives.
function toReviewItem(review) {
  const note = review.note && review.note.title ? review.note : null;
  const reviewer = review.reviewer && review.reviewer.name ? review.reviewer : null;
  return {
    id: String(review._id),
    noteId: idOf(review.note),
    noteTitle: note ? note.title : "",
    reviewerId: idOf(review.reviewer),
    reviewerName: reviewer ? reviewer.name : "Unknown",
    rating: review.rating,
    comment: review.comment,
    status: review.status,
    createdAt: review.createdAt,
    decidedAt: review.decidedAt,
  };
}

// POST /api/reviews/note/:noteId   (reviewer or admin)
async function createReview(req, res, next) {
  try {
    const { noteId } = req.params;
    if (!OBJECT_ID.test(noteId)) return notFound(res, "Note");

    const rating = Number(req.body.rating);
    const comment = String(req.body.comment || "").trim();

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Rating must be a whole number from 1 to 5" });
    }
    if (comment.length < MIN_COMMENT || comment.length > MAX_COMMENT) {
      return res
        .status(400)
        .json({ message: `Review must be between ${MIN_COMMENT} and ${MAX_COMMENT} characters` });
    }

    const note = await Note.findById(noteId);
    if (!note || note.status !== "approved") return notFound(res, "Note");
    if (idOf(note.author) === idOf(req.user._id)) {
      return res.status(400).json({ message: "You cannot review your own note" });
    }

    // The unique index on { note, reviewer } blocks a second review even if two requests arrive together.
    let review;
    try {
      review = await Review.create({
        note: note._id,
        reviewer: req.user._id,
        author: note.author,
        rating,
        comment,
      });
    } catch (err) {
      if (err.code === 11000) {
        return res.status(409).json({ message: "You have already reviewed this note" });
      }
      throw err;
    }

    res.status(201).json({ review: toReviewItem(review) });
  } catch (err) {
    next(err);
  }
}

// GET /api/reviews/note/:noteId   (public, login optional)
// Approved reviews of one note, the average rating, and the logged-in user's own review (if any).
async function listNoteReviews(req, res, next) {
  try {
    const { noteId } = req.params;
    if (!OBJECT_ID.test(noteId)) return notFound(res, "Note");

    const note = await Note.findById(noteId).select("status author");
    if (!note || note.status !== "approved") return notFound(res, "Note");

    const approved = await Review.find({ note: noteId, status: "approved" })
      .sort({ createdAt: -1 })
      .populate("reviewer", "name");

    const count = approved.length;
    const average = count ? approved.reduce((sum, r) => sum + r.rating, 0) / count : 0;

    let mine = null;
    if (req.user) {
      const own = await Review.findOne({ note: noteId, reviewer: req.user._id }).populate("reviewer", "name");
      if (own) mine = toReviewItem(own);
    }

    const role = req.user ? req.user.role : null;
    res.json({
      reviews: approved.map(toReviewItem),
      count,
      average: Math.round(average * 10) / 10,
      mine,
      // Tells the page whether to show the "write a review" form.
      canReview:
        !!req.user &&
        (role === "reviewer" || role === "admin") &&
        idOf(note.author) !== idOf(req.user._id) &&
        !mine,
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/reviews/mine   (reviews I wrote, any status)
async function listMine(req, res, next) {
  try {
    const rows = await Review.find({ reviewer: req.user._id })
      .sort({ createdAt: -1 })
      .populate("note", "title")
      .populate("reviewer", "name");
    res.json({ reviews: rows.map(toReviewItem) });
  } catch (err) {
    next(err);
  }
}

// GET /api/reviews/incoming?status=pending|approved|rejected   (reviews written on MY notes)
async function listIncoming(req, res, next) {
  try {
    const filter = { author: req.user._id };
    if (["pending", "approved", "rejected"].includes(req.query.status)) {
      filter.status = req.query.status;
    }
    const rows = await Review.find(filter)
      .sort({ createdAt: -1 })
      .populate("note", "title")
      .populate("reviewer", "name");
    res.json({ reviews: rows.map(toReviewItem) });
  } catch (err) {
    next(err);
  }
}

// Shared by approve and reject. Only the note's author can decide, and only while it is pending.
// The status change is one atomic update, so a double click cannot decide the same review twice.
async function decide(req, res, next, newStatus) {
  try {
    const { id } = req.params;
    if (!OBJECT_ID.test(id)) return notFound(res);

    const review = await Review.findOneAndUpdate(
      { _id: id, author: req.user._id, status: "pending" },
      { status: newStatus, decidedAt: new Date() },
      { new: true }
    )
      .populate("note", "title")
      .populate("reviewer", "name");

    if (!review) {
      // Work out why, so the message is helpful.
      const existing = await Review.findById(id).select("author status");
      if (!existing || idOf(existing.author) !== idOf(req.user._id)) return notFound(res);
      return res.status(409).json({ message: `This review was already ${existing.status}` });
    }

    if (newStatus === "approved") {
      // pointsAwarded flips false -> true exactly once, so the reviewer is never paid twice.
      const first = await Review.findOneAndUpdate(
        { _id: review._id, pointsAwarded: false },
        { pointsAwarded: true }
      );
      if (first) {
        await changePoints(review.reviewer._id, POINT_RULES.REVIEW_APPROVED, "review_approved", review.note._id);
      }
    }

    res.json({ review: toReviewItem(review) });
  } catch (err) {
    next(err);
  }
}

const approveReview = (req, res, next) => decide(req, res, next, "approved");
const rejectReview = (req, res, next) => decide(req, res, next, "rejected");

module.exports = { createReview, listNoteReviews, listMine, listIncoming, approveReview, rejectReview };
