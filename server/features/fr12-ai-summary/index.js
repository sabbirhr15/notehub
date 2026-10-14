// FR-12: AI Note Summary and Auto Tagging  (Owner: Member 3)
// Put this feature's routes here. Split into controller.js / model files in this folder if it grows.
const express = require("express");
const router = express.Router();

router.get("/ping", (req, res) => {
  res.json({ feature: "FR-12", name: "AI Note Summary and Auto Tagging", status: "not built yet" });
});

module.exports = { basePath: "/api/ai", router };
