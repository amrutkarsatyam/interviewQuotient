// server/controllers/interviewController.js
const InterviewStats = require("../models/InterviewStats");
const User = require("../models/userModel");

// @desc   Save interview stats and update user profile
// @route  POST /api/interviews
// @access Private
exports.saveStats = async (req, res) => {
  try {
    const { jobDescription, focusPercent, narrative, scores, interviewData, strengths, weaknesses } = req.body;

    const scoreValues = Object.values(scores);
    const overallScore = Math.round(
      scoreValues.reduce((sum, score) => sum + score, 0) / scoreValues.length
    );

    // Create the interview record
    await InterviewStats.create({
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

    // Update the user's strengths and weaknesses
    if (strengths && weaknesses) {
      await User.findByIdAndUpdate(req.user._id, {
        $set: { strengths, weaknesses },
      });
    }

    res.status(201).json({ message: "Interview stats saved successfully." });
  } catch (error) {
    console.error("Error saving stats:", error);
    res.status(500).json({ message: "Server error" });
  }
};