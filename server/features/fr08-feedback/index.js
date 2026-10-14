// FR-8: Feedback and Suggestions  (Owner: Member 2)
// Put this feature's routes here. Split into controller.js / model files in this folder if it grows.
const express = require("express");
const router = express.Router();

router.get("/ping", (req, res) => {
  res.json({ feature: "FR-8", name: "Feedback and Suggestions", status: "not built yet" });
});

module.exports = { basePath: "/api/feedback", router };
