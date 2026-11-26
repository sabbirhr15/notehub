// FR-6: Reviewer Role Management  (Owner: Member 3)
// A member who has 20 approved notes and 100 likes can ask to become a reviewer.
// The admin approves or rejects the request. The admin can also make any user a reviewer
// directly (by email) and take the reviewer role away again.
const ReviewerRequest = require("../../models/ReviewerRequest");
const User = require("../../models/User");
const Note = require("../../models/Note");

const OBJECT_ID = /^[0-9a-fA-F]{24}$/;
const REQUIRED = { uploads: 20, likes: 100 };
const STATUSES = ["pending", "approved", "rejected"];
const MAX_TEXT = 300;

function idOf(value) {
  return String(value && value._id ? value._id : value);
}

// Approved notes and likes received, for a list of users. Users without notes get zeros.
// (A plain find and a loop: simple to read, and the same result on every MongoDB.)
async function statsFor(userIds) {
  const notes = await Note.find({ author: { $in: userIds }, status: "approved" }).select("author likesCount").lean();
  const map = new Map();
  for (const id of userIds) map.set(String(id), { approvedUploads: 0, likesReceived: 0 });
  for (const note of notes) {
    const stats = map.get(String(note.author));
    stats.approvedUploads += 1;
    stats.likesReceived += note.likesCount || 0;
  }
  return map;
}

function meetsRequirements(stats) {
  return stats.approvedUploads >= REQUIRED.uploads && stats.likesReceived >= REQUIRED.likes;
}

function toRequestItem(request, user, stats) {
  return {
    id: String(request._id),
    status: request.status,
    message: request.message || "",
    adminNote: request.adminNote || "",
    createdAt: request.createdAt,
    decidedAt: request.decidedAt,
    userId: idOf(request.user),
    userName: user ? user.name : "Deleted user",
    userEmail: user ? user.email : "",
    userRole: user ? user.role : "",
    approvedUploads: stats ? stats.approvedUploads : 0,
    likesReceived: stats ? stats.likesReceived : 0,
    meetsRequirements: stats ? meetsRequirements(stats) : false,
  };
}

function toPerson(user, stats) {
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    role: user.role,
    approvedUploads: stats.approvedUploads,
    likesReceived: stats.likesReceived,
  };
}

// ---------------------------------------------------------------- member side

// GET /api/reviewer-requests/me
// My role, my numbers against the requirements, and my latest request.
async function myStatus(req, res, next) {
  try {
    const stats = (await statsFor([req.user._id])).get(String(req.user._id));
    const latest = await ReviewerRequest.findOne({ user: req.user._id }).sort({ createdAt: -1 });
    res.json({
      role: req.user.role,
      approvedUploads: stats.approvedUploads,
      likesReceived: stats.likesReceived,
      required: REQUIRED,
      eligible: req.user.role === "member" && meetsRequirements(stats),
      latestRequest: latest ? toRequestItem(latest, req.user, stats) : null,
    });
  } catch (err) {
    next(err);
  }
}

// POST /api/reviewer-requests   body: { message? }
async function createRequest(req, res, next) {
  try {
    if (req.user.role !== "member") {
      return res.status(400).json({ message: `You are already ${req.user.role === "admin" ? "an admin" : "a reviewer"}` });
    }

    const message = String(req.body.message || "").trim();
    if (message.length > MAX_TEXT) {
      return res.status(400).json({ message: `Message must be at most ${MAX_TEXT} characters` });
    }

    const stats = (await statsFor([req.user._id])).get(String(req.user._id));
    if (!meetsRequirements(stats)) {
      return res.status(403).json({
        message: `You need ${REQUIRED.uploads} approved notes and ${REQUIRED.likes} likes. You have ${stats.approvedUploads} notes and ${stats.likesReceived} likes.`,
      });
    }

    const pending = await ReviewerRequest.findOne({ user: req.user._id, status: "pending" });
    if (pending) return res.status(409).json({ message: "You already have a request waiting for the admin" });

    const request = await ReviewerRequest.create({ user: req.user._id, message });
    res.status(201).json({ request: toRequestItem(request, req.user, stats) });
  } catch (err) {
    next(err);
  }
}

// ----------------------------------------------------------------- admin side

// GET /api/reviewer-requests?status=pending|approved|rejected&page=1
async function listRequests(req, res, next) {
  try {
    const status = STATUSES.includes(req.query.status) ? req.query.status : "pending";
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 15, 1), 50);

    const filter = { status };
    const sort = status === "pending" ? { createdAt: 1 } : { decidedAt: -1, createdAt: -1 };

    const [total, rows, pendingCount] = await Promise.all([
      ReviewerRequest.countDocuments(filter),
      ReviewerRequest.find(filter)
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit)
        .populate("user", "name email role"),
      ReviewerRequest.countDocuments({ status: "pending" }),
    ]);

    const userIds = rows.filter((r) => r.user).map((r) => r.user._id);
    const stats = await statsFor(userIds);

    res.json({
      requests: rows.map((r) => toRequestItem(r, r.user, r.user ? stats.get(String(r.user._id)) : null)),
      page,
      limit,
      total,
      totalPages: Math.max(Math.ceil(total / limit), 1),
      pendingCount,
    });
  } catch (err) {
    next(err);
  }
}

async function explainFailure(id, res) {
  const existing = await ReviewerRequest.findById(id).select("status");
  if (!existing) return res.status(404).json({ message: "Request not found" });
  return res.status(409).json({ message: `This request was already ${existing.status}` });
}

// POST /api/reviewer-requests/:id/approve   body: { adminNote? }
// One atomic update that only matches a pending request, so a double click cannot approve it twice.
async function approveRequest(req, res, next) {
  try {
    if (!OBJECT_ID.test(req.params.id)) return res.status(404).json({ message: "Request not found" });

    const adminNote = String(req.body.adminNote || "").trim().slice(0, MAX_TEXT);
    const request = await ReviewerRequest.findOneAndUpdate(
      { _id: req.params.id, status: "pending" },
      { status: "approved", decidedBy: req.user._id, decidedAt: new Date(), adminNote },
      { new: true }
    );
    if (!request) return explainFailure(req.params.id, res);

    // Only a plain member becomes a reviewer. An admin is never downgraded by mistake.
    await User.updateOne({ _id: request.user, role: "member" }, { role: "reviewer" });

    const user = await User.findById(request.user).select("name email role");
    res.json({ request: toRequestItem(request, user, null) });
  } catch (err) {
    next(err);
  }
}

// POST /api/reviewer-requests/:id/reject   body: { adminNote? }
async function rejectRequest(req, res, next) {
  try {
    if (!OBJECT_ID.test(req.params.id)) return res.status(404).json({ message: "Request not found" });

    const adminNote = String(req.body.adminNote || "").trim().slice(0, MAX_TEXT);
    const request = await ReviewerRequest.findOneAndUpdate(
      { _id: req.params.id, status: "pending" },
      { status: "rejected", decidedBy: req.user._id, decidedAt: new Date(), adminNote },
      { new: true }
    );
    if (!request) return explainFailure(req.params.id, res);

    const user = await User.findById(request.user).select("name email role");
    res.json({ request: toRequestItem(request, user, null) });
  } catch (err) {
    next(err);
  }
}

// GET /api/reviewer-requests/reviewers   (current reviewers)
async function listReviewers(req, res, next) {
  try {
    const users = await User.find({ role: "reviewer" }).sort({ name: 1 }).select("name email role");
    const stats = await statsFor(users.map((u) => u._id));
    res.json({ reviewers: users.map((u) => toPerson(u, stats.get(String(u._id)))) });
  } catch (err) {
    next(err);
  }
}

// POST /api/reviewer-requests/promote   body: { email }
// The admin makes any registered user a reviewer, without a request and without the requirements.
async function promoteUser(req, res, next) {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    if (!email) return res.status(400).json({ message: "Please enter the user's email" });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "No user with this email" });
    if (user.role === "admin") return res.status(400).json({ message: "This user is an admin already" });
    if (user.role === "reviewer") return res.status(409).json({ message: "This user is a reviewer already" });

    // Only change a member (atomic), then close any request this user still has open.
    const changed = await User.findOneAndUpdate({ _id: user._id, role: "member" }, { role: "reviewer" }, { new: true });
    if (!changed) return res.status(409).json({ message: "This user's role has just changed. Please try again" });

    await ReviewerRequest.updateMany(
      { user: user._id, status: "pending" },
      { status: "approved", decidedBy: req.user._id, decidedAt: new Date(), adminNote: "Made a reviewer directly by the admin" }
    );

    const stats = (await statsFor([user._id])).get(String(user._id));
    res.status(201).json({ reviewer: toPerson(changed, stats) });
  } catch (err) {
    next(err);
  }
}

// POST /api/reviewer-requests/demote/:userId
// Takes the reviewer role away (back to member). Admins cannot be changed here.
async function demoteUser(req, res, next) {
  try {
    if (!OBJECT_ID.test(req.params.userId)) return res.status(404).json({ message: "User not found" });

    const user = await User.findOneAndUpdate({ _id: req.params.userId, role: "reviewer" }, { role: "member" }, { new: true });
    if (!user) {
      const existing = await User.findById(req.params.userId).select("role");
      if (!existing) return res.status(404).json({ message: "User not found" });
      return res.status(400).json({ message: `This user is ${existing.role === "admin" ? "an admin" : "not a reviewer"}` });
    }

    res.json({ user: { id: String(user._id), name: user.name, role: user.role } });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  myStatus,
  createRequest,
  listRequests,
  approveRequest,
  rejectRequest,
  listReviewers,
  promoteUser,
  demoteUser,
};
