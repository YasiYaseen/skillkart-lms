import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { toast } from "react-toastify";

export function CourseModeration() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = () => {
    setLoading(true);
    api
      .get("/admin/courses")
      .then((res) => {
        setCourses(res.data.courses);
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
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update course status");
    }
  };

  if (loading) {
    return <div className="py-20 text-center text-gray-500">Loading courses...</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Course Moderation</h1>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left font-semibold text-gray-700">Course</th>
              <th className="px-6 py-3 text-left font-semibold text-gray-700">Instructor</th>
              <th className="px-6 py-3 text-left font-semibold text-gray-700">State</th>
              <th className="px-6 py-3 text-right font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {courses.map((course) => (
              <tr key={course._id}>
                <td className="px-6 py-4">
                  <div className="font-medium text-gray-900">{course.title}</div>
                  <div className="text-xs text-gray-500 capitalize mt-1">Status: {course.status}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-500">{course.instructor?.name || "Unknown"}</td>
                <td className="px-6 py-4 whitespace-nowrap space-y-1">
                  <div>
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${course.isApproved !== false ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}>
                      {course.isApproved !== false ? "Approved" : "Rejected"}
                    </span>
                  </div>
                  <div>
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${course.isActive !== false ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800"}`}>
                      {course.isActive !== false ? "Active" : "Disabled"}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right space-x-2">
                  <button
                    onClick={() => handleUpdateStatus(course._id, { isApproved: course.isApproved === false })}
                    className={`text-xs font-semibold px-3 py-1.5 rounded ${course.isApproved !== false ? "bg-yellow-50 text-yellow-600 hover:bg-yellow-100" : "bg-green-50 text-green-600 hover:bg-green-100"}`}
                  >
                    {course.isApproved !== false ? "Reject" : "Approve"}
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(course._id, { isActive: course.isActive === false })}
                    className={`text-xs font-semibold px-3 py-1.5 rounded ${course.isActive !== false ? "bg-gray-100 text-gray-600 hover:bg-gray-200" : "bg-blue-50 text-blue-600 hover:bg-blue-100"}`}
                  >
                    {course.isActive !== false ? "Disable" : "Enable"}
                  </button>
                </td>
              </tr>
            ))}
            {courses.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                  No courses found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
