// models/InterviewStats.js
const mongoose = require("mongoose");

const scoreSchema = new mongoose.Schema({
  technicalAccuracy: { type: Number, default: 0 },
  communicationClarity: { type: Number, default: 0 },
  confidenceLevel: { type: Number, default: 0 },
  timeManagement: { type: Number, default: 0 },
  completeness: { type: Number, default: 0 },
}, { _id: false });

const interviewStatsSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    jobDescription: {
      type: String,
      default: "General",
    },
    focusPercent: {
      type: Number,
      default: 0,
    },
    narrative: {
      type: String,
      default: "",
    },
    scores: scoreSchema,
    overallScore: {
      type: Number,
      default: 0,
    },
    // Optional: store the full Q&A data
    interviewData: {
      type: Array,
      default: [],
    },
  },
  { timestamps: true }
);

interviewStatsSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model("InterviewStats", interviewStatsSchema);