// server/models/userModel.js
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      match: [/\S+@\S+\.\S+/, "Invalid email format"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 6,
    },
    // Strengths and weaknesses updated after each interview analysis
    strengths: { type: [String], default: [] },
    weaknesses: { type: [String], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);