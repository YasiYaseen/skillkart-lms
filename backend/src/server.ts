import express, { json } from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import courseRoutes from "./routes/courseRoutes.js";
import sectionRoutes from "./routes/sectionRoutes.js";
import lessonRoutes from "./routes/lessonRoutes.js";
import meRoutes from "./routes/meRoutes.js";
import quizRoutes from "./routes/quizRoutes.js";

dotenv.config();
// Workaround for Windows DNS SRV resolution issues
import { setServers } from "node:dns";
setServers(["8.8.8.8", "1.1.1.1"]);

const app = express();

// Global middleware
app.use(cors());
app.use(json());

// Connect to DB
connectDB();

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/sections", sectionRoutes);
app.use("/api/lessons", lessonRoutes);
app.use("/api/me", meRoutes);
app.use("/api", quizRoutes);

// Health check
app.get("/", (req, res) => {
  res.send("SkillKart API running");
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
