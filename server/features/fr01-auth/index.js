// FR-1: User Registration and Login  (Owner: Member 1)
const express = require("express");
const { protect } = require("../../middleware/auth");
const { register, login, me } = require("./controller");

const router = express.Router();

router.get("/ping", (req, res) => {
  res.json({ feature: "FR-1", name: "User Registration and Login", status: "ready" });
});

router.post("/register", register);
router.post("/login", login);
router.get("/me", protect, me);

module.exports = { basePath: "/api/auth", router };
