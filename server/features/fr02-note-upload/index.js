// FR-2: Note Upload  (Owner: Member 2)
const express = require("express");
const { protect } = require("../../middleware/auth");
const { upload, createNote, listMine } = require("./controller");

const router = express.Router();

router.get("/ping", (req, res) => {
  res.json({ feature: "FR-2", name: "Note Upload", status: "ready" });
});

router.post("/", protect, upload.single("file"), createNote);
router.get("/mine", protect, listMine);

module.exports = { basePath: "/api/upload", router };
