// FR-4: Note Details, Like and Save  (Owner: Member 1)
const express = require("express");
const { protect, optionalAuth } = require("../../middleware/auth");
const { getNote, likeNote, saveNote, unsaveNote, listSaved, downloadNote } = require("./controller");

const router = express.Router();

router.get("/ping", (req, res) => {
  res.json({ feature: "FR-4", name: "Note Details, Like and Save", status: "ready" });
});

// "/saved" must come before "/:id", otherwise "saved" would be read as a note id.
router.get("/saved", protect, listSaved);

router.get("/:id", optionalAuth, getNote);
router.post("/:id/like", protect, likeNote);
router.post("/:id/save", protect, saveNote);
router.delete("/:id/save", protect, unsaveNote);
router.get("/:id/download", protect, downloadNote);

module.exports = { basePath: "/api/notes", router };
