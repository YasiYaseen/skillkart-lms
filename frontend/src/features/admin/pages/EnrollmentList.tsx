import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import { toast } from 'sonner';
import { Pagination } from "@/components/common";
import { AcademicCapIcon } from "@heroicons/react/20/solid";

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
            <AcademicCapIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            Enrollments
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Track and oversee student enrollments across all platform courses.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <input
            type="text"
            placeholder="Search student or course..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-850 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <select
            value={statusFilter}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-850 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 text-xs">
            <thead className="bg-slate-50 dark:bg-slate-850">
              <tr>
                <th className="px-5 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">Course</th>
                <th className="px-5 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">Student</th>
                <th className="px-5 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">Status</th>
                <th className="px-5 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">Enrolled At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
              {paginatedEnrollments.map((enr) => (
                <tr key={enr._id} className="hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900 dark:text-white">{enr.course?.title || "Unknown Course"}</span>
                      {enr.course?._id && (
                        <Link
                          to={`/courses/${enr.course._id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-medium ml-1"
                        >
                          ↗
                        </Link>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <div>
                      <span className="font-medium text-slate-800 dark:text-slate-200 block">{enr.student?.name || "Unknown Student"}</span>
                      {enr.student?.email && (
                        <span className="text-[11px] text-slate-400 dark:text-slate-500">{enr.student.email}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-semibold border ${
                        enr.status === "completed"
                          ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                          : enr.status === "active"
                          ? "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700"
                      }`}
                    >
                      {enr.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap text-slate-500 dark:text-slate-400 text-xs">
                    {new Date(enr.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {paginatedEnrollments.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
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
