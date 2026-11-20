// FR-8: Feedback and Suggestions  (Owner: Member 2)
const express = require("express");
const { protect } = require("../../middleware/auth");
const requireRole = require("../../middleware/requireRole");
const { createFeedback, listMine, listAll, updateFeedback } = require("./controller");

const router = express.Router();

router.get("/ping", (req, res) => {
  res.json({ feature: "FR-8", name: "Feedback and Suggestions", status: "ready" });
});

// Any logged-in user.
router.post("/", protect, createFeedback);
router.get("/mine", protect, listMine); // must come before anything with a "/:id"

// Admin only.
router.get("/", protect, requireRole("admin"), listAll);
router.patch("/:id", protect, requireRole("admin"), updateFeedback);

module.exports = { basePath: "/api/feedback", router };
