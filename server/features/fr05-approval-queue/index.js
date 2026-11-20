// FR-5: Note Approval Queue  (Owner: Member 2)
const express = require("express");
const { protect } = require("../../middleware/auth");
const requireRole = require("../../middleware/requireRole");
const { listQueue, approveNote, declineNote } = require("./controller");

const router = express.Router();

router.get("/ping", (req, res) => {
  res.json({ feature: "FR-5", name: "Note Approval Queue", status: "ready" });
});

// Everything here is for reviewers and admins only.
router.use(protect, requireRole("reviewer", "admin"));

router.get("/", listQueue);
router.post("/:id/approve", approveNote);
router.post("/:id/decline", declineNote);

module.exports = { basePath: "/api/approvals", router };
