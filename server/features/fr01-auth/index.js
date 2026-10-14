// FR-1: User Registration and Login  (Owner: Member 1)
// Put this feature's routes here. Split into controller.js / model files in this folder if it grows.
const express = require("express");
const router = express.Router();

router.get("/ping", (req, res) => {
  res.json({ feature: "FR-1", name: "User Registration and Login", status: "not built yet" });
});

module.exports = { basePath: "/api/auth", router };
