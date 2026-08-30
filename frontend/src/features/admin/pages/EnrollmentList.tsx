import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import { toast } from "react-toastify";
import { Pagination } from "@/components/common";

export interface AdminEnrollment {
  _id: string;
  course?: {
    _id?: string;
    title?: string;
    thumbnailUrl?: string;
  };
  student?: {
    _id?: string;
    name?: string;
    email?: string;
    avatar?: string;
  };
  status: string;
  createdAt: string;
  progressPercentage?: number;
}

const PAGE_SIZE = 10;

export function EnrollmentList() {
  const [enrollments, setEnrollments] = useState<AdminEnrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

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

  const filteredEnrollments = useMemo(() => {
    return enrollments.filter((enr) => {
      const q = searchQuery.toLowerCase();
      const courseTitle = enr.course?.title?.toLowerCase() || "";
      const studentName = enr.student?.name?.toLowerCase() || "";
      const studentEmail = enr.student?.email?.toLowerCase() || "";
      const matchesQuery = courseTitle.includes(q) || studentName.includes(q) || studentEmail.includes(q);
      const matchesStatus = statusFilter === "all" || enr.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [enrollments, searchQuery, statusFilter]);

  const totalPages = Math.ceil(filteredEnrollments.length / PAGE_SIZE) || 1;
  const paginatedEnrollments = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredEnrollments.slice(start, start + PAGE_SIZE);
  }, [filteredEnrollments, currentPage]);

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
      <div className="space-y-6 animate-pulse">
        <div className="flex justify-between items-center">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-lg w-48" />
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-xl w-64" />
        </div>
        <div className="h-96 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Enrollments</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Track and oversee student enrollments across all platform courses.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <input
            type="text"
            placeholder="Search student or course..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="px-3.5 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <select
            value={statusFilter}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="px-3.5 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
            <thead className="bg-gray-50 dark:bg-gray-900/50">
              <tr>
                <th className="px-6 py-3.5 text-left font-semibold text-gray-700 dark:text-gray-300">Course</th>
                <th className="px-6 py-3.5 text-left font-semibold text-gray-700 dark:text-gray-300">Student</th>
                <th className="px-6 py-3.5 text-left font-semibold text-gray-700 dark:text-gray-300">Status</th>
                <th className="px-6 py-3.5 text-left font-semibold text-gray-700 dark:text-gray-300">Enrolled At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
              {paginatedEnrollments.map((enr) => (
                <tr key={enr._id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900 dark:text-white">{enr.course?.title || "Unknown Course"}</span>
                      {enr.course?._id && (
                        <Link
                          to={`/courses/${enr.course._id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium ml-1"
                        >
                          ↗
                        </Link>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <span className="font-medium text-gray-800 dark:text-gray-200 block">{enr.student?.name || "Unknown Student"}</span>
                      {enr.student?.email && (
                        <span className="text-xs text-gray-400 dark:text-gray-500">{enr.student.email}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        enr.status === "completed"
                          ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300"
                          : enr.status === "active"
                          ? "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300"
                          : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                      }`}
                    >
                      {enr.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500 dark:text-gray-400 text-xs">
                    {new Date(enr.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {paginatedEnrollments.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    {searchQuery || statusFilter !== "all"
                      ? "No enrollments matching your search criteria."
                      : "No enrollments found."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredEnrollments.length}
          pageSize={PAGE_SIZE}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
}

export default EnrollmentList;
