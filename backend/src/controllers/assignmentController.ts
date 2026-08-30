import type { Request, Response } from "express";
import { isValidObjectId, Types } from "mongoose";
import Assignment from "../models/Assignment";
import AssignmentSubmission from "../models/AssignmentSubmission";
import Course from "../models/Course";
import Enrollment from "../models/Enrollment";
import Notification from "../models/Notification";
import {
  createAssignmentSchema,
  updateAssignmentSchema,
  submitAssignmentSchema,
  gradeSubmissionSchema,
} from "../validators/assignmentValidator";

// Helper: Extract single string param
function getParam(param: string | string[] | undefined): string {
  if (!param) return "";
  return Array.isArray(param) ? param[0] : param;
}

// Helper: Check if user owns course or is admin
async function getCourseOwnedByUser(courseId: string, userId: string, role: string) {
  const course = await Course.findById(courseId).select("_id title instructor");
  if (!course) return null;
  if (role !== "admin" && course.instructor.toString() !== userId) return null;
  return course;
}

// ---------------------------------------------------------------------------
// GET /api/assignments/course/:courseId
// Returns assignments for a course with student submission state if student
// ---------------------------------------------------------------------------
export async function getCourseAssignments(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const courseId = getParam(req.params.courseId);
    if (!isValidObjectId(courseId)) {
      return res.status(400).json({ message: "Invalid course ID" });
    }

    const course = await Course.findById(courseId).select("_id instructor title");
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    const isInstructorOrAdmin =
      req.user.role === "admin" || course.instructor.toString() === req.user.id;

    if (!isInstructorOrAdmin) {
      const enrollment = await Enrollment.exists({
        student: req.user.id,
        course: courseId,
        status: "active",
      });
      if (!enrollment) {
        return res.status(403).json({ message: "You must be enrolled to view course assignments." });
      }
    }

    const assignments = await Assignment.find({ course: courseId })
      .sort({ createdAt: -1 })
      .lean();

    if (isInstructorOrAdmin) {
      // Aggregate submission counts per assignment
      const assignmentIds = assignments.map((a) => a._id);
      const submissionStats = await AssignmentSubmission.aggregate([
        { $match: { assignment: { $in: assignmentIds } } },
        {
          $group: {
            _id: "$assignment",
            totalSubmissions: { $sum: 1 },
            pendingCount: {
              $sum: {
                $cond: [{ $in: ["$status", ["submitted", "under_review"]] }, 1, 0],
              },
            },
            gradedCount: {
              $sum: {
                $cond: [{ $eq: ["$status", "graded"] }, 1, 0],
              },
            },
          },
        },
      ]);

      const statsMap = new Map(submissionStats.map((s) => [s._id.toString(), s]));
      const enriched = assignments.map((a) => {
        const stats = statsMap.get(a._id.toString());
        return {
          ...a,
          totalSubmissions: stats?.totalSubmissions || 0,
          pendingCount: stats?.pendingCount || 0,
          gradedCount: stats?.gradedCount || 0,
        };
      });

      return res.json({ assignments: enriched });
    } else {
      // Student: attach their own submission
      const submissions = await AssignmentSubmission.find({
        course: courseId,
        student: req.user.id,
      }).lean();

      const submissionMap = new Map(submissions.map((s) => [s.assignment.toString(), s]));
      const enriched = assignments.map((a) => ({
        ...a,
        mySubmission: submissionMap.get(a._id.toString()) || null,
      }));

      return res.json({ assignments: enriched });
    }
  } catch (error) {
    return res.status(500).json({ message: "Server error retrieving assignments" });
  }
}

// ---------------------------------------------------------------------------
// GET /api/assignments/:id
// ---------------------------------------------------------------------------
export async function getAssignmentById(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const id = getParam(req.params.id);
    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid assignment ID" });
    }

    const assignment = await Assignment.findById(id).populate("course", "title instructor").lean();
    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    let mySubmission = null;
    if (req.user.role === "student") {
      mySubmission = await AssignmentSubmission.findOne({
        assignment: id,
        student: req.user.id,
      }).lean();
    }

    return res.json({ assignment, mySubmission });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
}

// ---------------------------------------------------------------------------
// POST /api/assignments/course/:courseId
// Instructor/Admin creates a new assignment
// ---------------------------------------------------------------------------
export async function createAssignment(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const courseId = getParam(req.params.courseId);
    if (!isValidObjectId(courseId)) {
      return res.status(400).json({ message: "Invalid course ID" });
    }

    const course = await getCourseOwnedByUser(courseId, req.user.id, req.user.role);
    if (!course) {
      return res.status(403).json({ message: "Course not found or access denied" });
    }

    const parsed = createAssignmentSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: "Validation failed",
        errors: parsed.error.flatten(),
      });
    }

    const assignment = await Assignment.create({
      course: courseId,
      section: parsed.data.sectionId && isValidObjectId(parsed.data.sectionId) ? parsed.data.sectionId : undefined,
      title: parsed.data.title,
      description: parsed.data.description,
      instructions: parsed.data.instructions,
      rubric: parsed.data.rubric,
      maxScore: parsed.data.maxScore,
      dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : undefined,
      attachments: parsed.data.attachments,
      createdBy: req.user.id,
    });

    // Notify enrolled students
    setImmediate(async () => {
      try {
        const enrollments = await Enrollment.find({
          course: courseId,
          status: "active",
        }).select("student");

        if (enrollments.length > 0) {
          const notifications = enrollments.map((e) => ({
            recipient: e.student,
            title: "New Assignment Released",
            message: `New assignment "${parsed.data.title}" has been posted in ${course.title}.`,
            type: "info" as const,
            link: `/learn/${courseId}`,
          }));
          await Notification.insertMany(notifications);
        }
      } catch {
        // Safe fail
      }
    });

    return res.status(201).json({ message: "Assignment created successfully", assignment });
  } catch (error) {
    return res.status(500).json({ message: "Server error creating assignment" });
  }
}

// ---------------------------------------------------------------------------
// PUT /api/assignments/:id
// ---------------------------------------------------------------------------
export async function updateAssignment(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const id = getParam(req.params.id);
    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid assignment ID" });
    }

    const assignment = await Assignment.findById(id);
    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    const course = await getCourseOwnedByUser(assignment.course.toString(), req.user.id, req.user.role);
    if (!course) {
      return res.status(403).json({ message: "Access denied" });
    }

    const parsed = updateAssignmentSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: "Validation failed",
        errors: parsed.error.flatten(),
      });
    }

    if (parsed.data.title !== undefined) assignment.title = parsed.data.title;
    if (parsed.data.description !== undefined) assignment.description = parsed.data.description;
    if (parsed.data.instructions !== undefined) assignment.instructions = parsed.data.instructions;
    if (parsed.data.rubric !== undefined) assignment.rubric = parsed.data.rubric;
    if (parsed.data.maxScore !== undefined) assignment.maxScore = parsed.data.maxScore;
    if (parsed.data.dueDate !== undefined) {
      assignment.dueDate = parsed.data.dueDate ? new Date(parsed.data.dueDate) : undefined;
    }
    if (parsed.data.attachments !== undefined) assignment.attachments = parsed.data.attachments;
    if (parsed.data.sectionId !== undefined) {
      assignment.section = parsed.data.sectionId && isValidObjectId(parsed.data.sectionId)
        ? new Types.ObjectId(parsed.data.sectionId)
        : undefined;
    }

    await assignment.save();
    return res.json({ message: "Assignment updated successfully", assignment });
  } catch (error) {
    return res.status(500).json({ message: "Server error updating assignment" });
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/assignments/:id
// ---------------------------------------------------------------------------
export async function deleteAssignment(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const id = getParam(req.params.id);
    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid assignment ID" });
    }

    const assignment = await Assignment.findById(id);
    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    const course = await getCourseOwnedByUser(assignment.course.toString(), req.user.id, req.user.role);
    if (!course) {
      return res.status(403).json({ message: "Access denied" });
    }

    await Assignment.findByIdAndDelete(id);
    await AssignmentSubmission.deleteMany({ assignment: id });

    return res.json({ message: "Assignment and related submissions deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Server error deleting assignment" });
  }
}

// ---------------------------------------------------------------------------
// POST /api/assignments/:id/submit
// Student submits project work (file upload, repo link, or text)
// ---------------------------------------------------------------------------
export async function submitAssignment(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const id = getParam(req.params.id);
    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid assignment ID" });
    }

    const assignment = await Assignment.findById(id);
    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    // Verify enrollment
    const enrollment = await Enrollment.findOne({
      student: req.user.id,
      course: assignment.course,
      status: "active",
    });
    if (!enrollment) {
      return res.status(403).json({ message: "You must be enrolled in the course to submit assignments." });
    }

    const parsed = submitAssignmentSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: "Validation failed",
        errors: parsed.error.flatten(),
      });
    }

    // Upsert student submission
    const submission = await AssignmentSubmission.findOneAndUpdate(
      { assignment: id, student: req.user.id },
      {
        assignment: id,
        course: assignment.course,
        student: req.user.id,
        submissionType: parsed.data.submissionType,
        fileUrl: parsed.data.fileUrl,
        fileName: parsed.data.fileName,
        externalLink: parsed.data.externalLink,
        studentNote: parsed.data.studentNote,
        status: "submitted",
        submittedAt: new Date(),
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    // Notify instructor
    setImmediate(async () => {
      try {
        const course = await Course.findById(assignment.course).select("instructor title");
        if (course) {
          await Notification.create({
            recipient: course.instructor,
            title: "New Student Submission",
            message: `A student submitted work for "${assignment.title}" in ${course.title}.`,
            type: "info",
            link: `/instructor/assignments`,
          });
        }
      } catch {
        // Safe fail
      }
    });

    return res.status(200).json({ message: "Assignment submitted successfully", submission });
  } catch (error) {
    return res.status(500).json({ message: "Server error submitting assignment" });
  }
}

// ---------------------------------------------------------------------------
// GET /api/assignments/instructor/submissions
// Instructor fetches all student submissions across courses or for specific assignment
// ---------------------------------------------------------------------------
export async function getInstructorSubmissions(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { courseId, assignmentId, status } = req.query;

    // Find courses taught by instructor
    const courseFilter: Record<string, unknown> = {};
    if (req.user.role !== "admin") {
      const instructorCourses = await Course.find({ instructor: req.user.id }).select("_id");
      const courseIds = instructorCourses.map((c) => c._id);
      courseFilter.course = { $in: courseIds };
    }

    if (courseId && isValidObjectId(courseId as string)) {
      courseFilter.course = courseId;
    }

    if (assignmentId && isValidObjectId(assignmentId as string)) {
      courseFilter.assignment = assignmentId;
    }

    if (status && typeof status === "string" && status !== "all") {
      courseFilter.status = status;
    }

    const submissions = await AssignmentSubmission.find(courseFilter)
      .populate("student", "name email avatar")
      .populate("assignment", "title maxScore rubric dueDate")
      .populate("course", "title")
      .sort({ submittedAt: -1 })
      .lean();

    return res.json({ submissions });
  } catch (error) {
    return res.status(500).json({ message: "Server error fetching submissions" });
  }
}

// ---------------------------------------------------------------------------
// PUT /api/assignments/submissions/:submissionId/grade
// Instructor grades a student submission with score, rubric breakdown, and feedback
// ---------------------------------------------------------------------------
export async function gradeSubmission(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const submissionId = getParam(req.params.submissionId);
    if (!isValidObjectId(submissionId)) {
      return res.status(400).json({ message: "Invalid submission ID" });
    }

    const submission = await AssignmentSubmission.findById(submissionId).populate("assignment");
    if (!submission) {
      return res.status(404).json({ message: "Submission not found" });
    }

    const course = await getCourseOwnedByUser(submission.course.toString(), req.user.id, req.user.role);
    if (!course) {
      return res.status(403).json({ message: "Access denied" });
    }

    const parsed = gradeSubmissionSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: "Validation failed",
        errors: parsed.error.flatten(),
      });
    }

    submission.score = parsed.data.score;
    submission.status = parsed.data.status;
    submission.rubricScores = parsed.data.rubricScores;
    submission.instructorFeedback = parsed.data.instructorFeedback;
    submission.gradedBy = new Types.ObjectId(req.user.id);
    submission.gradedAt = new Date();

    await submission.save();

    // Notify the student
    setImmediate(async () => {
      try {
        const assignmentObj = submission.assignment as { title?: string; maxScore?: number } | null;
        await Notification.create({
          recipient: submission.student,
          title: "Assignment Graded",
          message: `Your submission for "${assignmentObj?.title || "assignment"}" was graded: ${parsed.data.score}/${assignmentObj?.maxScore || 100} points.`,
          type: "success",
          link: `/learn/${submission.course}`,
        });
      } catch {
        // Safe fail
      }
    });

    return res.json({ message: "Submission graded successfully", submission });
  } catch (error) {
    return res.status(500).json({ message: "Server error grading submission" });
  }
}
