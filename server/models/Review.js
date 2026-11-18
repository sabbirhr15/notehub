const mongoose = require('mongoose');

// FR-7: a reviewer reviews an approved note. The review becomes public
// only after the note's author approves it.
const reviewSchema = new mongoose.Schema(
  {
    note: { type: mongoose.Schema.Types.ObjectId, ref: 'Note', required: true },
    reviewer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    // note author, stored here so "reviews waiting for me" is a fast query
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    rating: { type: Number, required: true, min: 1, max: 5, validate: Number.isInteger },
    comment: { type: String, required: true, trim: true, minlength: 10, maxlength: 500 },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    decidedAt: { type: Date, default: null },
    // guards against giving the +5 reviewer points twice
    pointsAwarded: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// one review per reviewer per note (database enforced)
reviewSchema.index({ note: 1, reviewer: 1 }, { unique: true });
reviewSchema.index({ note: 1, status: 1, createdAt: -1 });
reviewSchema.index({ author: 1, status: 1, createdAt: -1 });
reviewSchema.index({ reviewer: 1, createdAt: -1 });

module.exports = mongoose.model('Review', reviewSchema);
