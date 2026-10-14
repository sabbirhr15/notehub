// Builds the Express app. Kept separate from index.js so it can be loaded without a database.
const fs = require("fs");
const path = require("path");
const express = require("express");
const cors = require("cors");
const errorHandler = require("./middleware/errorHandler");

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173" }));
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", app: "NoteHub" });
});

// Auto-load every feature folder inside ./features.
// Each feature has an index.js that exports { basePath, router }.
// Adding a new feature never requires editing this file.
const featuresDir = path.join(__dirname, "features");
fs.readdirSync(featuresDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort()
  .forEach((name) => {
    const feature = require(path.join(featuresDir, name));
    if (!feature || !feature.basePath || !feature.router) {
      throw new Error(`Feature "${name}" must export { basePath, router }`);
    }
    app.use(feature.basePath, feature.router);
  });

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});
app.use(errorHandler);

module.exports = app;
