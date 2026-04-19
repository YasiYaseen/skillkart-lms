import { useState, useEffect, useCallback } from "react";
import { enrollmentService } from "../services/enrollmentService";
import { toast } from "react-toastify";

export type EnrollmentStatus = "active" | "completed" | "cancelled" | "expired" | "pending_payment";

export interface IEnrollment {
  _id: string;
  student: string;
  course: string;
  status: EnrollmentStatus;
  progressPercentage: number;
  completedLessonsCount: number;
  totalLessonsCount: number;
  completedLessonIds: string[];
  lastAccessedLessonId?: string;
  enrolledAt: string;
  paymentStatus: string;
}

export function useEnrollment(courseId?: string) {
  const [enrollment, setEnrollment] = useState<IEnrollment | null>(null);
  // Initialize loading=true when courseId is provided to avoid a flash of the
  // unenrolled state before the first fetch resolves.
  const [loading, setLoading] = useState(!!courseId);
  const [enrolling, setEnrolling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEnrollment = useCallback(async () => {
    if (!courseId) return;
    setLoading(true);
    try {
      const res = await enrollmentService.getCourseEnrollment(courseId);
      setEnrollment(res.data);
      setError(null);
    } catch (err: any) {
      if (err.response?.status !== 404) {
        setError(err.response?.data?.message || "Failed to fetch enrollment");
      }
      setEnrollment(null);
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    fetchEnrollment();
  }, [fetchEnrollment]);

  const enroll = async () => {
    if (!courseId) return;
    setEnrolling(true);
    try {
      const res = await enrollmentService.enroll(courseId);
      setEnrollment(res.data.enrollment || res.data);
      toast.success("Successfully enrolled!");
      return true;
    } catch (err: any) {
      const msg = err.response?.data?.message || "Failed to enroll";
      toast.error(msg);
      setError(msg);
      return false;
    } finally {
      setEnrolling(false);
    }
  };

  const updateProgress = async (lessonId: string, completed: boolean) => {
    if (!enrollment) return;
    try {
      const res = await enrollmentService.updateProgress(enrollment._id, lessonId, completed);
      setEnrollment(res.data);
      return res.data;
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update progress");
      throw err;
    }
  };

  const cancel = async () => {
    if (!enrollment) return;
    try {
      await enrollmentService.cancelEnrollment(enrollment._id);
      setEnrollment({ ...enrollment, status: "cancelled" });
      toast.success("Enrollment cancelled");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to cancel enrollment");
    }
  };

  return {
    enrollment,
    loading,
    enrolling,
    error,
    enroll,
    updateProgress,
    cancel,
    isEnrolled: enrollment?.status === "active" || enrollment?.status === "completed",
    progressPercentage: enrollment?.progressPercentage || 0,
    refetch: fetchEnrollment,
  };
}
