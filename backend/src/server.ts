import express, { json } from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db";
import authRoutes from "./routes/authRoutes";
import courseRoutes from "./routes/courseRoutes";
import sectionRoutes from "./routes/sectionRoutes";
import lessonRoutes from "./routes/lessonRoutes";
import meRoutes from "./routes/meRoutes";
import quizRoutes from "./routes/quizRoutes";
import enrollmentRoutes from "./routes/enrollmentRoutes";

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
app.use("/api/enrollments", enrollmentRoutes);

// Health check
app.get("/", (req, res) => {
  res.send("SkillKart API running");
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
