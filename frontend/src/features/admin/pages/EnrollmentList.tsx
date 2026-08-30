import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { toast } from "react-toastify";

export interface AdminEnrollment {
  _id: string;
  course?: {
    _id?: string;
    title?: string;
  };
  student?: {
    _id?: string;
    name?: string;
  };
  status: string;
  createdAt: string;
}

export function EnrollmentList() {
  const [enrollments, setEnrollments] = useState<AdminEnrollment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEnrollments();
  }, []);

  const fetchEnrollments = () => {
    setLoading(true);
    api
      .get<{ enrollments: AdminEnrollment[] }>("/admin/enrollments")
      .then((res) => {
        setEnrollments(res.data.enrollments || []);
      })
      .catch(() => {
        toast.error("Failed to load enrollments");
      })
      .finally(() => setLoading(false));
  };

  if (loading) {
    return <div className="py-20 text-center text-gray-500">Loading enrollments...</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Enrollments</h1>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left font-semibold text-gray-700">Course</th>
              <th className="px-6 py-3 text-left font-semibold text-gray-700">Student</th>
              <th className="px-6 py-3 text-left font-semibold text-gray-700">Status</th>
              <th className="px-6 py-3 text-left font-semibold text-gray-700">Enrolled At</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {enrollments.map((enr) => (
              <tr key={enr._id}>
                <td className="px-6 py-4 font-medium text-gray-900">{enr.course?.title || "Unknown Course"}</td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-500">{enr.student?.name || "Unknown Student"}</td>
                <td className="px-6 py-4 whitespace-nowrap capitalize text-gray-500">
                  <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${enr.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                    {enr.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                  {new Date(enr.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
            {enrollments.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                  No enrollments found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
