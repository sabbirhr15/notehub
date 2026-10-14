const mongoose = require("mongoose");

// One record per user action on a note: view, like, download or save.
// Likes and saves are allowed only once per user and note. The database enforces that with
// "uniqueKey". Downloads are logged every time, because the download limit (FR-10) counts them.
const interactionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    note: { type: mongoose.Schema.Types.ObjectId, ref: "Note", required: true },
    type: { type: String, enum: ["view", "like", "download", "save"], required: true },
    pointsCharged: { type: Number, default: 0 }, // points spent on this action (0 if within the free limit)
    uniqueKey: { type: String }, // set only for like and save, e.g. "like:<userId>:<noteId>"
  },
  { timestamps: true }
);

interactionSchema.index({ user: 1, type: 1, createdAt: -1 });
// Sparse: records without a uniqueKey (downloads) are ignored by this index.
interactionSchema.index({ uniqueKey: 1 }, { unique: true, sparse: true });

interactionSchema.statics.keyFor = function keyFor(type, userId, noteId) {
  return `${type}:${userId}:${noteId}`;
};

module.exports = mongoose.model("Interaction", interactionSchema);
