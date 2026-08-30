import type { Request, Response } from "express";
import { generateCoursesSchema } from "../../validators/adminGenerator.validator";
import {
  generateInstructorAndCourses,
  PRESET_COURSES,
  DEFAULT_SKILLKART_INSTRUCTOR,
} from "../../services/courseGeneratorService";
import { recordAuditLog } from "../../services/auditService";

// ---------------------------------------------------------------------------
// GET /api/admin/course-presets
// ---------------------------------------------------------------------------
export async function getCoursePresets(req: Request, res: Response) {
  try {
    const presets = PRESET_COURSES.map((preset) => ({
      id: preset.id,
      title: preset.title,
      description: preset.description,
      thumbnailUrl: preset.thumbnailUrl,
      tags: preset.tags,
      level: preset.level,
      isPaid: preset.isPaid,
      price: preset.price,
      sectionsCount: preset.sections.length,
      lessonsCount: preset.sections.reduce((acc, s) => acc + s.lessons.length, 0),
      quizzesCount: preset.sections.reduce(
        (acc, s) => acc + s.lessons.filter((l) => l.quiz).length,
        0
      ),
      assignmentsCount: preset.sections.reduce(
        (acc, s) => acc + s.lessons.filter((l) => l.assignment).length,
        0
      ),
    }));

    return res.json({
      presets,
      defaultInstructor: DEFAULT_SKILLKART_INSTRUCTOR,
    });
  } catch (error) {
    console.error("Error in getCoursePresets:", error);
    return res.status(500).json({ message: "Failed to retrieve course presets" });
  }
}

// ---------------------------------------------------------------------------
// POST /api/admin/generate-courses
// ---------------------------------------------------------------------------
export async function generateAdminCourses(req: Request, res: Response) {
  try {
    const parsed = generateCoursesSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: "Validation failed",
        errors: parsed.error.flatten(),
      });
    }

    const result = await generateInstructorAndCourses(parsed.data);

    if (req.user) {
      await recordAuditLog({
        adminId: req.user.id,
        action: "GENERATE_DEMO_COURSES",
        targetType: "user",
        targetId: result.instructor.id,
        targetName: `${result.instructor.name} (${result.instructor.email})`,
        details: {
          coursesCreated: result.coursesCreated,
          coursesSkipped: result.coursesSkipped,
          totalSectionsCreated: result.totalSectionsCreated,
          totalLessonsCreated: result.totalLessonsCreated,
          totalQuizzesCreated: result.totalQuizzesCreated,
        },
        req,
      });
    }

    return res.status(201).json({
      message: "Instructor & courses generated successfully",
      result,
    });
  } catch (error: any) {
    console.error("Error in generateAdminCourses:", error);
    return res.status(500).json({
      message: error?.message || "Failed to generate courses",
    });
  }
}
