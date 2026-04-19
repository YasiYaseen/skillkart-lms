import { api } from "@/lib/api";

export const enrollmentService = {
  enroll: (courseId: string) =>
    api.post("/enrollments", { courseId }),

  getMyEnrollments: (params?: { status?: string; page?: number; limit?: number }) =>
    api.get("/enrollments/me", { params }),

  getCourseEnrollment: (courseId: string) =>
    api.get(`/enrollments/${courseId}/enrollment`),

  updateProgress: (enrollmentId: string, lessonId: string, completed: boolean) =>
    api.patch(`/enrollments/${enrollmentId}/progress`, { lessonId, completed }),

  cancelEnrollment: (enrollmentId: string) =>
    api.delete(`/enrollments/${enrollmentId}`),
};
