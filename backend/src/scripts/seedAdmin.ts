import dotenv from "dotenv";
import mongoose from "mongoose";
import path from "path";
import { setServers } from "node:dns";
import { hash } from "bcryptjs";

import connectDB from "../config/db";
import User from "../models/User";

setServers(["8.8.8.8", "1.1.1.1"]);
dotenv.config({ path: path.join(__dirname, "../../.env") });

const email = process.env.ADMIN_EMAIL ?? "admin@skillkart.local";
const password = process.env.ADMIN_PASSWORD ?? "Admin@2026!";

async function seedAdmin() {
  try {
    await connectDB();

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      existingUser.role = "admin";
      existingUser.isActive = true;
      await existingUser.save();
      console.log(`Admin access ensured for ${email}.`);
      return;
    }

    await User.create({
      name: "SkillKart Administrator",
      email,
      password: await hash(password, 10),
      role: "admin",
      onboardingCompleted: true,
      isActive: true,
    });
    console.log(`Admin account created for ${email}.`);
  } finally {
    await mongoose.disconnect();
  }
}

seedAdmin().catch((error: unknown) => {
  console.error("Unable to seed admin account:", error);
  process.exitCode = 1;
});
