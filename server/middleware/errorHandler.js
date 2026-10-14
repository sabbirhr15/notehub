// Catches errors from any route and returns a clean JSON message.
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (err.name === "MulterError") {
    const message =
      err.code === "LIMIT_FILE_SIZE" ? "File is too large. Maximum size is 10 MB" : err.message;
    return res.status(400).json({ message });
  }
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ message: "Invalid request body" });
  }
  if (err.name === "ValidationError") {
    return res.status(400).json({ message: err.message });
  }
  if (err.code === 11000) {
    return res.status(409).json({ message: "That value already exists" });
  }

  console.error(err);
  res.status(err.status || 500).json({ message: err.message || "Something went wrong" });
}

module.exports = errorHandler;
