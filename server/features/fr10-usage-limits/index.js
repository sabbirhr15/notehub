// FR-10: Usage Limits and Point Spending  (Owner: Member 1)
// Put this feature's routes here. Split into controller.js / model files in this folder if it grows.
const express = require("express");
const router = express.Router();

router.get("/ping", (req, res) => {
  res.json({ feature: "FR-10", name: "Usage Limits and Point Spending", status: "not built yet" });
});

module.exports = { basePath: "/api/usage", router };
