const express = require("express");
const { saveStats, getStats } = require("../controllers/interviewController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", protect, saveStats);
router.get("/", protect, getStats);

module.exports = router;
