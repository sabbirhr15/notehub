// Decides whether a user may download a note right now.
// Module 1: everyone who is logged in may download, and nothing is charged.
// FR-10 (Module 3) replaces this with the free limit (5 per day, 30 per month) and the
// 10 point charge after that. The download route in FR-4 already calls this function,
// so only this file changes when FR-10 is built.
//
// Returns { allowed: true, charged: 0 }
//      or { allowed: false, status: 403, message: "..." }
async function authorizeDownload(user, note) {
  return { allowed: true, charged: 0 };
}

module.exports = { authorizeDownload };
