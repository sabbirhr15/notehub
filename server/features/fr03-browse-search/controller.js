// FR-3: Browse, Search and Filter Notes  (Owner: Member 3)
const Note = require("../../models/Note");
const { toListItem } = require("../../utils/noteView");

// Makes user text safe to use inside a regular expression ("c++" must not break the search).
function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const SORTS = {
  newest: { createdAt: -1, _id: -1 },
  likes: { likesCount: -1, _id: -1 },
  downloads: { downloadsCount: -1, _id: -1 },
};

// GET /api/browse?q=&subject=&className=&tag=&sort=&page=&limit=   (public)
// Only approved notes are ever returned.
async function browseNotes(req, res, next) {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 12, 1), 50);

    const filter = { status: "approved" };

    const q = String(req.query.q || "").trim().slice(0, 100);
    if (q) {
      const pattern = new RegExp(escapeRegex(q), "i"); // partial, case-insensitive match
      filter.$or = [
        { title: pattern },
        { subject: pattern },
        { className: pattern },
        { tags: pattern },
        { description: pattern },
        { summary: pattern },
      ];
    }

    const subject = String(req.query.subject || "").trim();
    if (subject) filter.subject = new RegExp(`^${escapeRegex(subject)}$`, "i");

    const className = String(req.query.className || "").trim();
    if (className) filter.className = new RegExp(`^${escapeRegex(className)}$`, "i");

    const tag = String(req.query.tag || "").trim().toLowerCase();
    if (tag) filter.tags = tag;

    const sort = SORTS[req.query.sort] || SORTS.newest;

    const [total, notes] = await Promise.all([
      Note.countDocuments(filter),
      Note.find(filter)
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit)
        .populate("author", "name"),
    ]);

    res.json({
      notes: notes.map(toListItem),
      page,
      pages: Math.max(Math.ceil(total / limit), 1),
      total,
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/browse/filters  (the values shown in the filter dropdowns)
async function getFilterOptions(req, res, next) {
  try {
    const approved = { status: "approved" };
    const [subjects, classNames, tags] = await Promise.all([
      Note.distinct("subject", approved),
      Note.distinct("className", approved),
      Note.distinct("tags", approved),
    ]);

    const sorted = (list) =>
      list.filter(Boolean).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));

    res.json({ subjects: sorted(subjects), classNames: sorted(classNames), tags: sorted(tags) });
  } catch (err) {
    next(err);
  }
}

module.exports = { browseNotes, getFilterOptions };
