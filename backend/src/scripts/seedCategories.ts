import dotenv from "dotenv";
import path from "path";
import { setServers } from "node:dns";
import mongoose from "mongoose";

// Fix for Windows DNS resolution
setServers(["8.8.8.8", "1.1.1.1"]);

dotenv.config({ path: path.join(__dirname, "../../.env") });
dotenv.config();

import connectDB from "../config/db";
import Category from "../models/Category";

export const DEFAULT_PLATFORM_CATEGORIES = [
  {
    name: "Business & Leadership",
    slug: "business-leadership",
    icon: "💼",
    description: "Executive Leadership, Product Management, Scaling Startups & Agile Strategy",
    gradient: "from-blue-600/15 via-sky-600/10 to-indigo-900/5 border-blue-500/20 text-blue-600 dark:text-blue-400",
    tagQuery: "Business",
    tags: ["business", "management", "leadership", "entrepreneurship", "startup", "strategy", "project management"],
    order: 1,
    isActive: true,
  },
  {
    name: "Finance & Accounting",
    slug: "finance-accounting",
    icon: "📈",
    description: "Financial Modeling, Stock Valuation, Personal Wealth & Corporate Accounting",
    gradient: "from-emerald-600/15 via-teal-600/10 to-emerald-900/5 border-emerald-500/20 text-emerald-600 dark:text-emerald-400",
    tagQuery: "Finance",
    tags: ["finance", "investing", "accounting", "economics", "crypto", "trading", "stocks", "wealth"],
    order: 2,
    isActive: true,
  },
  {
    name: "Design & Creative Arts",
    slug: "design-creative-arts",
    icon: "🎨",
    description: "UI/UX, Figma Design Systems, 3D Art, Motion Graphics & Visual Identity",
    gradient: "from-rose-600/15 via-pink-600/10 to-rose-900/5 border-rose-500/20 text-rose-600 dark:text-rose-400",
    tagQuery: "Design",
    tags: ["design", "ui", "ux", "figma", "illustration", "3d", "blender", "animation", "graphic design", "creative"],
    order: 3,
    isActive: true,
  },
  {
    name: "Software & Web Engineering",
    slug: "software-web-engineering",
    icon: "💻",
    description: "Full-Stack Development, React, Cloud Microservices & Distributed Architecture",
    gradient: "from-purple-600/15 via-violet-600/10 to-purple-900/5 border-purple-500/20 text-purple-600 dark:text-purple-400",
    tagQuery: "Web Development",
    tags: ["react", "node", "typescript", "javascript", "fullstack", "python", "golang", "devops", "cloud", "docker"],
    order: 4,
    isActive: true,
  },
  {
    name: "AI, LLMs & Data Science",
    slug: "ai-data-science",
    icon: "🤖",
    description: "Generative AI, Neural Networks, Predictive Analytics & Large Language Models",
    gradient: "from-amber-600/15 via-orange-600/10 to-amber-900/5 border-amber-500/20 text-amber-600 dark:text-amber-400",
    tagQuery: "AI",
    tags: ["ai", "machine learning", "data science", "deep learning", "llm", "pytorch", "analytics", "nlp"],
    order: 5,
    isActive: true,
  },
  {
    name: "Digital Marketing & Growth",
    slug: "digital-marketing-growth",
    icon: "📣",
    description: "Growth Hacking, SEO, Brand Positioning, Funnel Optimization & Social Strategy",
    gradient: "from-cyan-600/15 via-blue-600/10 to-cyan-900/5 border-cyan-500/20 text-cyan-600 dark:text-cyan-400",
    tagQuery: "Marketing",
    tags: ["marketing", "growth", "seo", "content", "social media", "branding", "copywriting", "advertising"],
    order: 6,
    isActive: true,
  },
  {
    name: "Photography & Media Production",
    slug: "photography-media",
    icon: "📸",
    description: "Cinematography, Video Editing, Studio Lighting, Audio & Podcasting",
    gradient: "from-orange-600/15 via-amber-600/10 to-red-900/5 border-orange-500/20 text-orange-600 dark:text-orange-400",
    tagQuery: "Media",
    tags: ["photography", "video", "editing", "premiere", "cinematography", "audio", "lighting", "podcast"],
    order: 7,
    isActive: true,
  },
  {
    name: "Communication & Leadership Skills",
    slug: "communication-personal-growth",
    icon: "🗣️",
    description: "Public Speaking, Negotiation, Emotional Intelligence & Personal Effectiveness",
    gradient: "from-indigo-600/15 via-teal-600/10 to-blue-900/5 border-indigo-500/20 text-indigo-600 dark:text-indigo-400",
    tagQuery: "Personal Development",
    tags: ["communication", "public speaking", "negotiation", "productivity", "mindset", "wellness"],
    order: 8,
    isActive: true,
  },
];

async function runCategorySeeder() {
  console.log("=================================================");
  console.log("🏷️  SkillKart Multi-Disciplinary Category Seeder");
  console.log("=================================================");

  try {
    await connectDB();

    for (const cat of DEFAULT_PLATFORM_CATEGORIES) {
      const existing = await Category.findOne({ slug: cat.slug });
      if (!existing) {
        await Category.create(cat);
        console.log(`✨ Created Category: ${cat.icon} ${cat.name} (${cat.slug})`);
      } else {
        await Category.updateOne({ slug: cat.slug }, { $set: cat });
        console.log(`ℹ️  Updated Category: ${cat.icon} ${cat.name} (${cat.slug})`);
      }
    }

    const total = await Category.countDocuments();
    console.log(`\n🎉 Total Active Categories in Database: ${total}`);

    // Link existing courses to matching categories
    const Course = (await import("../models/Course")).default;
    const allCourses = await Course.find();
    const allCategories = await Category.find();

    console.log(`\n🔄 Associating ${allCourses.length} courses with categories...`);
    for (const course of allCourses) {
      let matchedCategory = allCategories.find((cat) => {
        const tagSet = new Set((cat.tags || []).map((t) => t.toLowerCase()));
        if (cat.tagQuery) tagSet.add(cat.tagQuery.toLowerCase());
        tagSet.add(cat.name.toLowerCase());

        const titleLower = (course.title || "").toLowerCase();
        const descLower = (course.description || "").toLowerCase();
        const courseTags = (course.tags || []).map((t) => t.toLowerCase());

        return Array.from(tagSet).some(
          (t) => titleLower.includes(t) || descLower.includes(t) || courseTags.some((ct) => ct.includes(t) || t.includes(ct))
        );
      });

      if (!matchedCategory) {
        matchedCategory = allCategories.find((c) => c.slug === "software-web-engineering") || allCategories[0];
      }

      if (matchedCategory) {
        course.category = matchedCategory._id as any;
        await course.save();
        console.log(`   🔗 Linked: "${course.title.slice(0, 40)}..." -> ${matchedCategory.icon} ${matchedCategory.name}`);
      }
    }
    console.log(`✅ Course-Category links updated successfully!`);
  } catch (error) {
    console.error("❌ Error seeding categories:", error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB.\n");
    process.exit(0);
  }
}

runCategorySeeder();
