const mongoose = require("mongoose");

const interviewStatsSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    codingScore: {
      type: Number,
      default: 0,
    },
    communicationScore: {
      type: Number,
      default: 0,
    },
    focusScore: {
      type: Number,
      default: 0,
    },
    overallScore: {
      type: Number,
      default: 0,
    },
    notes: {
      type: String,
    },
  },
  { timestamps: true }
);
interviewStatsSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model("InterviewStats", interviewStatsSchema);
