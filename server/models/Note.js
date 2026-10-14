const mongoose = require("mongoose");

const noteSchema = new mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true, trim: true },
    subject: { type: String, required: true, trim: true },
    className: { type: String, trim: true }, // "class" is a reserved word in JS, so we use className
    tags: [{ type: String, trim: true, lowercase: true }],

    // Short description written by the author. Shown for free on the details page.
    description: { type: String, required: true, trim: true, maxlength: 500 },

    // File stored in GridFS (PDF, image, DOCX or PPTX)
    fileId: { type: mongoose.Schema.Types.ObjectId, required: true },
    fileName: { type: String },
    mimeType: { type: String },
    fileSize: { type: Number },

    // Approval flow
    status: { type: String, enum: ["pending", "approved", "declined"], default: "pending" },
    declineReason: { type: String },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    reviewedAt: { type: Date },

    // Filled by the AI feature (FR-12). Author can edit tags.
    summary: { type: String },

    community: { type: mongoose.Schema.Types.ObjectId, ref: "Community" },

    likesCount: { type: Number, default: 0 },
    downloadsCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

noteSchema.index({ title: "text", subject: "text", tags: "text", summary: "text" });
noteSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model("Note", noteSchema);
