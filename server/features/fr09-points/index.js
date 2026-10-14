// FR-9: Points Earning and History  (Owner: Member 3)
// Put this feature's routes here. Split into controller.js / model files in this folder if it grows.
const express = require("express");
const router = express.Router();

router.get("/ping", (req, res) => {
  res.json({ feature: "FR-9", name: "Points Earning and History", status: "not built yet" });
});

module.exports = { basePath: "/api/points", router };
