import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import { toast } from "react-toastify";

export interface ModerationCourse {
  _id: string;
  title: string;
  thumbnailUrl?: string;
  status: string;
  isApproved?: boolean;
  isActive?: boolean;
  level?: string;
  instructor?: {
    _id?: string;
    name?: string;
  };
}

export function CourseModeration() {
  const [courses, setCourses] = useState<ModerationCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = () => {
    setLoading(true);
    api
      .get<{ courses: ModerationCourse[] }>("/admin/courses")
      .then((res) => {
        setCourses(res.data.courses || []);
      })
      .catch(() => {
        toast.error("Failed to load courses");
      })
      .finally(() => setLoading(false));
  };

  const handleUpdateStatus = async (courseId: string, updates: { isActive?: boolean; isApproved?: boolean }) => {
    try {
      await api.patch(`/admin/courses/${courseId}/status`, updates);
      toast.success("Course status updated");
      setCourses(courses.map(c => c._id === courseId ? { ...c, ...updates } : c));
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to update course status";
      toast.error(msg);
    }
  };

  const filteredCourses = courses.filter((c) => {
    const q = searchQuery.toLowerCase();
    const titleMatch = c.title?.toLowerCase().includes(q);
    const instructorMatch = c.instructor?.name?.toLowerCase().includes(q);
    const levelMatch = c.level?.toLowerCase().includes(q);
    return titleMatch || instructorMatch || levelMatch;
  });

  if (loading) {
    return <div className="py-20 text-center text-gray-500">Loading courses...</div>;
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Course Moderation</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Review, approve, reject, or disable courses across the platform.</p>
        </div>
        <div className="w-full sm:w-72">
          <input
            type="text"
            placeholder="Search by title or instructor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3.5 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
            <thead className="bg-gray-50 dark:bg-gray-900/50">
              <tr>
                <th className="px-6 py-3.5 text-left font-semibold text-gray-700 dark:text-gray-300">Course</th>
                <th className="px-6 py-3.5 text-left font-semibold text-gray-700 dark:text-gray-300">Instructor</th>
                <th className="px-6 py-3.5 text-left font-semibold text-gray-700 dark:text-gray-300">Moderation State</th>
                <th className="px-6 py-3.5 text-right font-semibold text-gray-700 dark:text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
              {filteredCourses.map((course) => (
                <tr key={course._id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {course.thumbnailUrl ? (
                        <img src={course.thumbnailUrl} alt={course.title} className="w-12 h-9 rounded object-cover border border-gray-200 dark:border-gray-700 shrink-0" />
                      ) : (
                        <div className="w-12 h-9 rounded bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs shrink-0">
                          {course.title?.substring(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <div className="font-semibold text-gray-900 dark:text-white line-clamp-1">{course.title}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                            Status: <strong className="font-medium text-gray-700 dark:text-gray-300">{course.status}</strong>
                          </span>
                          <span className="text-gray-300 dark:text-gray-600">•</span>
                          <Link
                            to={`/courses/${course._id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium inline-flex items-center gap-0.5"
                          >
                            Preview ↗
                          </Link>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600 dark:text-gray-300">
                    {course.instructor?.name || "Unknown"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col gap-1.5 items-start">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        course.isApproved === true
                          ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300"
                          : course.isApproved === false
                          ? "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300"
                          : "bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300"
                      }`}>
                        {course.isApproved === true ? "Approved" : course.isApproved === false ? "Rejected" : "Pending Review"}
                      </span>
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        course.isActive !== false
                          ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                          : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                      }`}>
                        {course.isActive !== false ? "Active" : "Disabled"}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right space-x-2">
                    {course.isApproved !== true && (
                      <button
                        onClick={() => handleUpdateStatus(course._id, { isApproved: true })}
                        className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900/50 transition-colors"
                      >
                        Approve
                      </button>
                    )}
                    {course.isApproved !== false && (
                      <button
                        onClick={() => handleUpdateStatus(course._id, { isApproved: false })}
                        className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors"
                      >
                        Reject
                      </button>
                    )}
                    <button
                      onClick={() => handleUpdateStatus(course._id, { isActive: course.isActive === false })}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                        course.isActive !== false
                          ? "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                          : "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50"
                      }`}
                    >
                      {course.isActive !== false ? "Disable" : "Enable"}
                    </button>
                  </td>
                </tr>
              ))}
              {filteredCourses.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    {searchQuery ? "No courses matching your search." : "No courses found."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default CourseModeration;
