const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db");
// server/server.js
const app = express();

dotenv.config();
connectDB();

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/interviews", require("./routes/interviewRoutes"));


// test route
app.get("/", (req, res) => res.send("API is running..."));

app.get("/api", (req, res) => {
  res.json({
    message: "Welcome to the API root",
    endpoints: ["/api/auth", "/api/interviews", "/api/health"]
  });
});

app.get("/api/health", (req, res) => {
  res.json({ ok: true, now: new Date().toISOString() });
});


app.use((err, req, res, next) => {
  console.error(err.stack);
  const status = err.statusCode || 500;
  res.status(status).json({
    message: err.message || "Server error",
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
