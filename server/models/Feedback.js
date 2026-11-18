const mongoose = require('mongoose');

// FR-8: users send suggestions / bug reports / other feedback.
// Admin reads them and changes the status.
const feedbackSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: ['suggestion', 'bug', 'other'],
      default: 'suggestion',
    },
    message: { type: String, required: true, trim: true, minlength: 10, maxlength: 1000 },
    status: {
      type: String,
      enum: ['new', 'reviewed', 'resolved'],
      default: 'new',
    },
    adminNote: { type: String, trim: true, maxlength: 500, default: '' },
    handledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

feedbackSchema.index({ status: 1, createdAt: -1 });
feedbackSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('Feedback', feedbackSchema);
