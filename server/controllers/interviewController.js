const InterviewStats = require("../models/InterviewStats");

// @desc Save interview stats
// @route POST /api/interviews
// @access Private
exports.saveStats = async (req, res) => {
  try {
    const { codingScore, communicationScore, focusScore, notes } = req.body;

    const overallScore = Math.round(
      (codingScore + communicationScore + focusScore) / 3
    );

    const stats = await InterviewStats.create({
      user: req.user._id,
      codingScore,
      communicationScore,
      focusScore,
      overallScore,
      notes,
    });

    res.status(201).json(stats);
  } catch (error) {
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
