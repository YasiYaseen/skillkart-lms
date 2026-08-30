import dotenv from "dotenv";
import path from "path";
import { setServers } from "node:dns";
import mongoose from "mongoose";

// Fix for Windows DNS resolution
setServers(["8.8.8.8", "1.1.1.1"]);

dotenv.config({ path: path.join(__dirname, "../../.env") });
dotenv.config();

import connectDB from "../config/db";
import {
  generateInstructorAndCourses,
  DEFAULT_SKILLKART_INSTRUCTOR,
  PRESET_COURSES,
} from "../services/courseGeneratorService";

async function runSeeder() {
  console.log("=================================================");
  console.log("🚀 SkillKart Instructor & Course Seeder");
  console.log("=================================================");

  try {
    await connectDB();

    console.log(`\n⏳ Checking/Creating Instructor: ${DEFAULT_SKILLKART_INSTRUCTOR.name} (${DEFAULT_SKILLKART_INSTRUCTOR.email})...`);

    const result = await generateInstructorAndCourses({
      instructor: DEFAULT_SKILLKART_INSTRUCTOR,
      selectedPresets: PRESET_COURSES.map((p) => p.id),
      forceRegenerate: process.argv.includes("--force"),
    });

    console.log(`\n✅ Instructor status: ${result.instructor.created ? "Created new" : "Already exists"}`);
    console.log(`📌 Instructor ID: ${result.instructor.id}`);
    console.log(`\n📚 Courses Generation Summary:`);
    console.log(`-------------------------------------------------`);
    console.log(`- Courses Created: ${result.coursesCreated}`);
    console.log(`- Courses Skipped (Already existed): ${result.coursesSkipped}`);
    console.log(`- Total Sections Created: ${result.totalSectionsCreated}`);
    console.log(`- Total Lessons Created: ${result.totalLessonsCreated}`);
    console.log(`- Total Quizzes Created: ${result.totalQuizzesCreated}`);
    console.log(`-------------------------------------------------`);

    result.details.forEach((d, idx) => {
      const icon = d.status === "created" ? "✨" : "ℹ️";
      console.log(`${icon} [${idx + 1}] "${d.title}" -> ${d.status.toUpperCase()} (${d.sectionsCount} sections, ${d.lessonsCount} lessons)`);
    });

    console.log("\n🎉 Seeding completed successfully!");
  } catch (error) {
    console.error("\n❌ Error during seeding:", error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB.\n");
    process.exit(0);
  }
}

runSeeder();
