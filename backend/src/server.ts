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
import userRoutes from "./routes/userRoutes";
import certificateRoutes from "./routes/certificateRoutes";
import notificationRoutes from "./routes/notificationRoutes";
import uploadRoutes from "./routes/uploadRoutes";
import adminRoutes from "./routes/adminRoutes";
import wishlistRoutes from "./routes/wishlistRoutes";
import instructorRoutes from "./routes/instructorRoutes";
import noteRoutes from "./routes/noteRoutes";
import assignmentRoutes from "./routes/assignmentRoutes";
import couponRoutes from "./routes/couponRoutes";
import orderRoutes from "./routes/orderRoutes";
import newsletterRoutes from "./routes/newsletterRoutes";

import path from "path";

dotenv.config();
// Workaround for Windows DNS SRV resolution issues
import { setServers } from "node:dns";
setServers(["8.8.8.8", "1.1.1.1"]);

const app = express();

// Global middleware
app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173", credentials: true }));
app.use(json());

// Connect to DB
connectDB();

// Serve uploaded files statically
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/sections", sectionRoutes);
app.use("/api/lessons", lessonRoutes);
app.use("/api/me", meRoutes);
app.use("/api", quizRoutes);
app.use("/api/enrollments", enrollmentRoutes);
app.use("/api/users", userRoutes);
app.use("/api/certificates", certificateRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/instructor", instructorRoutes);
app.use("/api/notes", noteRoutes);
app.use("/api/assignments", assignmentRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/newsletter", newsletterRoutes);

import { getPublicSettings } from "./controllers/admin/adminSettingsController";
app.get("/api/settings/public", getPublicSettings);


// Health check
app.get("/", (req, res) => {
  res.send("SkillKart API running");
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
