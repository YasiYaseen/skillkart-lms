import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import { toast } from "react-toastify";
import { Pagination, Modal, Button } from "@/components/common";
import { ExclamationTriangleIcon, ShieldCheckIcon } from "@heroicons/react/20/solid";

export interface ModerationCourse {
  _id: string;
  title: string;
  thumbnailUrl?: string;
  status: string;
  isApproved?: boolean;
  isActive?: boolean;
  rejectionReason?: string;
  level?: string;
  instructor?: {
    _id?: string;
    name?: string;
  };
}

const PAGE_SIZE = 10;

export function CourseModeration() {
  const [courses, setCourses] = useState<ModerationCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  // Reject modal state
  const [rejectingCourse, setRejectingCourse] = useState<ModerationCourse | null>(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState("");
  const [submittingRejection, setSubmittingRejection] = useState(false);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const res = await api.get<{ courses: ModerationCourse[] }>("/admin/courses");
      setCourses(res.data.courses || []);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to load courses";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (
    courseId: string,
    updates: { isApproved?: boolean; isActive?: boolean; rejectionReason?: string }
  ) => {
    try {
      const res = await api.patch<{ course: ModerationCourse; message: string }>(
        `/admin/courses/${courseId}/moderation`,
        updates
      );
      toast.success(res.data.message || "Course status updated successfully");
      setCourses((prev) =>
        prev.map((c) => (c._id === courseId ? { ...c, ...res.data.course } : c))
      );
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to update course status";
      toast.error(msg);
    }
  };

  const handleOpenRejectModal = (course: ModerationCourse) => {
    setRejectingCourse(course);
    setRejectionReasonInput(course.rejectionReason || "");
  };

  const handleConfirmReject = async () => {
    if (!rejectingCourse) return;
    if (!rejectionReasonInput.trim()) {
      toast.error("Please provide a reason for rejecting this course.");
      return;
    }

    try {
      setSubmittingRejection(true);
      await handleUpdateStatus(rejectingCourse._id, {
        isApproved: false,
        rejectionReason: rejectionReasonInput.trim(),
      });
      setRejectingCourse(null);
    } finally {
      setSubmittingRejection(false);
    }
  };

  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      const matchesSearch =
        searchQuery === "" ||
        course.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.instructor?.name?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "pending" && course.isApproved === undefined) ||
        (statusFilter === "approved" && course.isApproved === true) ||
        (statusFilter === "rejected" && course.isApproved === false) ||
        (statusFilter === "disabled" && course.isActive === false);

      return matchesSearch && matchesStatus;
    });
  }, [courses, searchQuery, statusFilter]);

  const totalPages = Math.ceil(filteredCourses.length / PAGE_SIZE) || 1;
  const paginatedCourses = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredCourses.slice(start, start + PAGE_SIZE);
  }, [filteredCourses, currentPage]);

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    setCurrentPage(1);
  };

  const handleStatusChange = (val: string) => {
    setStatusFilter(val);
    setCurrentPage(1);
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="flex justify-between items-center">
          <div className="h-7 bg-slate-200 dark:bg-slate-700 rounded-lg w-48" />
          <div className="h-9 bg-slate-200 dark:bg-slate-700 rounded-lg w-60" />
        </div>
        <div className="h-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheckIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            Course Moderation
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Review, approve, reject, or disable courses across the platform.</p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <input
            type="text"
            placeholder="Search title or instructor..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-850 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <select
            value={statusFilter}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-850 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">All Moderation States</option>
            <option value="pending">Pending Review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="disabled">Disabled</option>
          </select>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 text-xs">
            <thead className="bg-slate-50 dark:bg-slate-850">
              <tr>
                <th className="px-5 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">Course</th>
                <th className="px-5 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">Instructor</th>
                <th className="px-5 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">Moderation State</th>
                <th className="px-5 py-3 text-right font-semibold text-slate-700 dark:text-slate-300">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
              {paginatedCourses.map((course) => (
                <tr key={course._id} className="hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      {course.thumbnailUrl ? (
                        <img src={course.thumbnailUrl} alt={course.title} className="w-12 h-8 rounded-md object-cover border border-slate-200 dark:border-slate-700 shrink-0" />
                      ) : (
                        <div className="w-12 h-8 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-[10px] shrink-0">
                          {course.title?.substring(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-white line-clamp-1">{course.title}</div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 capitalize">
                            Status: <strong className="font-medium text-slate-700 dark:text-slate-300">{course.status}</strong>
                          </span>
                          <span className="text-slate-300 dark:text-slate-600">•</span>
                          <Link
                            to={`/courses/${course._id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-medium inline-flex items-center gap-0.5"
                          >
                            Preview ↗
                          </Link>
                        </div>
                        {course.rejectionReason && (
                          <div className="mt-1 p-1.5 rounded-md bg-rose-50 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900/30 text-[11px] text-rose-700 dark:text-rose-300">
                            <strong>Feedback:</strong> {course.rejectionReason}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap text-slate-600 dark:text-slate-300 text-xs">
                    {course.instructor?.name || "Unknown"}
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <div className="flex flex-col gap-1 items-start">
                      <span className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-semibold border ${
                        course.isApproved === true
                          ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                          : course.isApproved === false
                          ? "bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800"
                          : "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800"
                      }`}>
                        {course.isApproved === true ? "Approved" : course.isApproved === false ? "Rejected" : "Pending Review"}
                      </span>
                      <span className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-medium border ${
                        course.isActive !== false
                          ? "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700"
                      }`}>
                        {course.isActive !== false ? "Active" : "Disabled"}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap text-right space-x-1.5">
                    {course.isApproved !== true && (
                      <button
                        onClick={() => handleUpdateStatus(course._id, { isApproved: true })}
                        className="text-xs font-semibold px-2.5 py-1 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition-colors cursor-pointer"
                      >
                        Approve
                      </button>
                    )}
                    {course.isApproved !== false && (
                      <button
                        onClick={() => handleOpenRejectModal(course)}
                        className="text-xs font-semibold px-2.5 py-1 rounded-md bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 hover:bg-rose-100 transition-colors cursor-pointer"
                      >
                        Reject
                      </button>
                    )}
                    <button
                      onClick={() => handleUpdateStatus(course._id, { isActive: course.isActive === false })}
                      className={`text-xs font-semibold px-2.5 py-1 rounded-md border transition-colors cursor-pointer ${
                        course.isActive !== false
                          ? "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200"
                          : "bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800 hover:bg-blue-100"
                      }`}
                    >
                      {course.isActive !== false ? "Disable" : "Enable"}
                    </button>
                  </td>
                </tr>
              ))}
              {paginatedCourses.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                    {searchQuery || statusFilter !== "all" ? "No courses matching your filter criteria." : "No courses found."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredCourses.length}
          pageSize={PAGE_SIZE}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* Rejection Modal */}
      {rejectingCourse && (
        <Modal isOpen={Boolean(rejectingCourse)} onClose={() => setRejectingCourse(null)}>
          <div className="p-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-200 dark:border-rose-800">
                <ExclamationTriangleIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Reject Course Submission</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Course: <strong className="text-slate-700 dark:text-slate-300">{rejectingCourse.title}</strong>
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Reason for Rejection (sent to instructor)
              </label>
              <textarea
                value={rejectionReasonInput}
                onChange={(e) => setRejectionReasonInput(e.target.value)}
                placeholder="Explain what needs to be improved or corrected before this course can be approved..."
                rows={4}
                maxLength={500}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-850 text-slate-900 dark:text-white p-3 text-xs focus:outline-none focus:ring-1 focus:ring-rose-500 resize-none"
              />
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 flex justify-between">
                <span>Providing specific feedback helps instructors fix issues quickly.</span>
                <span>{rejectionReasonInput.length}/500</span>
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="secondary"
                onClick={() => setRejectingCourse(null)}
                disabled={submittingRejection}
              >
                Cancel
              </Button>
              <button
                type="button"
                onClick={handleConfirmReject}
                disabled={submittingRejection}
                className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-rose-600 hover:bg-rose-500 text-white transition-colors disabled:opacity-50 shadow-2xs cursor-pointer"
              >
                {submittingRejection ? "Rejecting..." : "Confirm Rejection"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default CourseModeration;
