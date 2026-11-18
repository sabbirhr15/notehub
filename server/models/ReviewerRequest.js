const mongoose = require('mongoose');

// FR-6: a member asks to become a reviewer (needs 20 approved uploads and
// 100 likes). Admin approves or rejects. Admin can also promote directly,
// which does not need a request document.
const reviewerRequestSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    message: { type: String, trim: true, maxlength: 300, default: '' },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    decidedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    decidedAt: { type: Date, default: null },
    adminNote: { type: String, trim: true, maxlength: 300, default: '' },
  },
  { timestamps: true }
);

reviewerRequestSchema.index({ status: 1, createdAt: -1 });
reviewerRequestSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('ReviewerRequest', reviewerRequestSchema);
