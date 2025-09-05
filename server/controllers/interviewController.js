// controllers/interviewController.js
const InterviewStats = require("../models/InterviewStats");

// @desc Save interview stats
// @route POST /api/interviews
// @access Private
exports.saveStats = async (req, res) => {
  try {
    const { jobDescription, focusPercent, narrative, scores, interviewData } = req.body;

    // Calculate an overall score from the detailed scores
    const scoreValues = Object.values(scores);
    const overallScore = Math.round(
      scoreValues.reduce((sum, score) => sum + score, 0) / scoreValues.length
    );

    const stats = await InterviewStats.create({
      user: req.user._id,
      jobDescription,
      focusPercent,
      narrative,
      scores: {
        technicalAccuracy: scores["Technical Accuracy"],
        communicationClarity: scores["Communication & Clarity"],
        confidenceLevel: scores["Confidence Level"],
        timeManagement: scores["Time Management"],
        completeness: scores["Completeness of Answers"],
      },
      overallScore,
      interviewData,
    });

    res.status(201).json(stats);
  } catch (error) {
    console.error("Error saving stats:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc Get all stats for logged-in user
// @route GET /api/interviews
// @access Private
exports.getStats = async (req, res) => {
  try {
    const stats = await InterviewStats.find({ user: req.user._id }).sort({
      createdAt: -1,
    });
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};