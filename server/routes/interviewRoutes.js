// server/routes/interviewRoutes.js
const express = require("express");
const { saveStats } = require("../controllers/interviewController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", protect, saveStats);

module.exports = router;