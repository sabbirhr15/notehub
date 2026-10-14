const mongoose = require("mongoose");

// The points ledger. Every change to a balance is recorded here.
const pointTransactionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    amount: { type: Number, required: true }, // positive = earned, negative = spent
    reason: {
      type: String,
      required: true,
      enum: [
        "note_approved",
        "like_received",
        "download_received",
        "review_approved",
        "view_charge",
        "download_charge",
        "course_purchase",
        "admin_adjustment",
      ],
    },
    refNote: { type: mongoose.Schema.Types.ObjectId, ref: "Note" },
    balanceAfter: { type: Number },
  },
  { timestamps: true }
);

pointTransactionSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model("PointTransaction", pointTransactionSchema);
