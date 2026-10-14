const mongoose = require("mongoose");

// One record per user action on a note: view, like, download or save.
// Likes, downloads and saves are unique per (user, note, type). Views are logged every time
// because the daily and monthly usage limits count them.
const interactionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    note: { type: mongoose.Schema.Types.ObjectId, ref: "Note", required: true },
    type: { type: String, enum: ["view", "like", "download", "save"], required: true },
    pointsCharged: { type: Number, default: 0 }, // points spent on this action (0 if within free limit)
  },
  { timestamps: true }
);

interactionSchema.index({ user: 1, type: 1, createdAt: -1 });
interactionSchema.index(
  { user: 1, note: 1, type: 1 },
  { unique: true, partialFilterExpression: { type: { $in: ["like", "save"] } } }
);

module.exports = mongoose.model("Interaction", interactionSchema);
