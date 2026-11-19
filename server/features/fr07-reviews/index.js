// FR-7: Note Reviews  (Owner: Member 1)
const express = require("express");
const { protect, optionalAuth } = require("../../middleware/auth");
const requireRole = require("../../middleware/requireRole");
const {
  createReview,
  listNoteReviews,
  listMine,
  listIncoming,
  approveReview,
  rejectReview,
} = require("./controller");

const router = express.Router();

router.get("/ping", (req, res) => {
  res.json({ feature: "FR-7", name: "Note Reviews", status: "ready" });
});

// Reviews of one note: public list, and reviewers/admins can write one.
router.get("/note/:noteId", optionalAuth, listNoteReviews);
router.post("/note/:noteId", protect, requireRole("reviewer", "admin"), createReview);

// My own pages.
router.get("/mine", protect, listMine);
router.get("/incoming", protect, listIncoming);

// The note's author decides on a review.
router.post("/:id/approve", protect, approveReview);
router.post("/:id/reject", protect, rejectReview);

module.exports = { basePath: "/api/reviews", router };
