// FR-6: Reviewer Role Management  (Owner: Member 3)
const express = require("express");
const { protect } = require("../../middleware/auth");
const requireRole = require("../../middleware/requireRole");
const {
  myStatus,
  createRequest,
  listRequests,
  approveRequest,
  rejectRequest,
  listReviewers,
  promoteUser,
  demoteUser,
} = require("./controller");

const router = express.Router();

router.get("/ping", (req, res) => {
  res.json({ feature: "FR-6", name: "Reviewer Role Management", status: "ready" });
});

// Any logged-in user: my numbers and my request.
router.get("/me", protect, myStatus);
router.post("/", protect, createRequest);

// Admin only. The fixed paths (reviewers, promote, demote) come before the "/:id" paths.
router.get("/", protect, requireRole("admin"), listRequests);
router.get("/reviewers", protect, requireRole("admin"), listReviewers);
router.post("/promote", protect, requireRole("admin"), promoteUser);
router.post("/demote/:userId", protect, requireRole("admin"), demoteUser);
router.post("/:id/approve", protect, requireRole("admin"), approveRequest);
router.post("/:id/reject", protect, requireRole("admin"), rejectRequest);

module.exports = { basePath: "/api/reviewer-requests", router };
