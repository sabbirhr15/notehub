// Turns a Note document into the plain object the client receives.
// Shared by FR-2 (my uploads), FR-3 (browse) and FR-4 (details, saved).
// It never exposes fileId, so the file can only be reached through the download route.
const { kindOf } = require("./noteFiles");

function authorOf(note) {
  // author is populated with { _id, name } by the routes that use this helper
  if (note.author && note.author.name) {
    return { id: String(note.author._id), name: note.author.name };
  }
  return { id: note.author ? String(note.author) : null, name: "Unknown" };
}

function toListItem(note) {
  const author = authorOf(note);
  return {
    id: String(note._id),
    title: note.title,
    subject: note.subject,
    className: note.className || "",
    tags: note.tags || [],
    description: note.description,
    status: note.status,
    fileKind: kindOf(note.fileName),
    authorId: author.id,
    authorName: author.name,
    likesCount: note.likesCount,
    downloadsCount: note.downloadsCount,
    createdAt: note.createdAt,
  };
}

function toDetail(note, extras = {}) {
  return {
    ...toListItem(note),
    summary: note.summary || "",
    fileName: note.fileName,
    fileSize: note.fileSize,
    declineReason: note.declineReason || "",
    ...extras,
  };
}

module.exports = { toListItem, toDetail };
