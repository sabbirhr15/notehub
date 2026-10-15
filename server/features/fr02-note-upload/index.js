// FR-2: Note Upload  (Owner: Member 2)
// Put this feature's routes here. Split into controller.js / model files in this folder if it grows.
const express = require("express");
const router = express.Router();

router.get("/ping", (req, res) => {
  res.json({ feature: "FR-2", name: "Note Upload", status: "not built yet" });
});

module.exports = { basePath: "/api/upload", router };
