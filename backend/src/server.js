const express = require("express");
const cors = require("cors");
require("dotenv").config();
const connectDB = require("./config/db");

// Workaround for Windows DNS SRV resolution issues
const dns = require("node:dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const app = express();

// Global middleware
app.use(cors());
app.use(express.json());

// Connect to DB
connectDB();

// Routes
const authRoutes = require("./routes/authRoutes");
app.use("/api/auth", authRoutes);

// Health check
app.get("/", (req, res) => {
  res.send("SkillKart API running");
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
