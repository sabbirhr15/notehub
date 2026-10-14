// Use after protect. Example: router.get("/queue", protect, requireRole("admin", "reviewer"), handler)
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: "Please log in first" });
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: "You do not have permission to do this" });
    }
    next();
  };
}

module.exports = requireRole;
