// FR-3: Browse, Search and Filter Notes  (Owner: Member 3)
// Put this feature's routes here. Split into controller.js / model files in this folder if it grows.
const express = require("express");
const router = express.Router();

router.get("/ping", (req, res) => {
  res.json({ feature: "FR-3", name: "Browse, Search and Filter Notes", status: "not built yet" });
});

module.exports = { basePath: "/api/browse", router };
