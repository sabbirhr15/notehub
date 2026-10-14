const jwt = require("jsonwebtoken");
const User = require("../models/User");

function readToken(req) {
  const header = req.headers.authorization || "";
  return header.startsWith("Bearer ") ? header.slice(7) : null;
}

// Requires a valid login token. Puts the user on req.user.
async function protect(req, res, next) {
  try {
    const token = readToken(req);
    if (!token) return res.status(401).json({ message: "Please log in first" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-passwordHash");
    if (!user) return res.status(401).json({ message: "User no longer exists" });

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

// Creates a login token that expires in 7 days.
function signToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: "7d" });
}

module.exports = { protect, signToken };
