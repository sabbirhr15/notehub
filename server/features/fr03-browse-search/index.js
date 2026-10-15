// FR-3: Browse, Search and Filter Notes  (Owner: Member 3)
const express = require("express");
const { browseNotes, getFilterOptions } = require("./controller");

const router = express.Router();

router.get("/ping", (req, res) => {
  res.json({ feature: "FR-3", name: "Browse, Search and Filter Notes", status: "ready" });
});

router.get("/filters", getFilterOptions);
router.get("/", browseNotes);

module.exports = { basePath: "/api/browse", router };
