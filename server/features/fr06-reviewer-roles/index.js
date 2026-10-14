// FR-6: Reviewer Role Management  (Owner: Member 3)
// Put this feature's routes here. Split into controller.js / model files in this folder if it grows.
const express = require("express");
const router = express.Router();

router.get("/ping", (req, res) => {
  res.json({ feature: "FR-6", name: "Reviewer Role Management", status: "not built yet" });
});

module.exports = { basePath: "/api/reviewer-requests", router };
