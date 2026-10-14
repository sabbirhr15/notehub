// FR-7: Note Reviews  (Owner: Member 1)
// Put this feature's routes here. Split into controller.js / model files in this folder if it grows.
const express = require("express");
const router = express.Router();

router.get("/ping", (req, res) => {
  res.json({ feature: "FR-7", name: "Note Reviews", status: "not built yet" });
});

module.exports = { basePath: "/api/reviews", router };
