import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { toast } from "react-toastify";
import { Link } from "react-router-dom";

export interface AdminStats {
  totalUsers: number;
  totalStudents: number;
  totalInstructors: number;
  totalCourses: number;
  totalEnrollments: number;
}

export function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<{ stats: AdminStats }>("/admin/stats")
      .then((res) => {
        setStats(res.data.stats);
      })
      .catch((err: unknown) => {
        const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to load stats";
        toast.error(msg);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="space-y-2">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-lg w-52" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-64" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 5 }).map((_, idx) => (
            <div key={idx} className="h-32 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6" />
          ))}
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const statCards = [
    { title: "Total Users", value: stats.totalUsers, link: "/admin/users", icon: "👥", color: "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400" },
    { title: "Students", value: stats.totalStudents, link: "/admin/users", icon: "🎓", color: "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400" },
    { title: "Instructors", value: stats.totalInstructors, link: "/admin/users", icon: "👨‍🏫", color: "bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400" },
    { title: "Courses", value: stats.totalCourses, link: "/admin/courses", icon: "📚", color: "bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400" },
    { title: "Enrollments", value: stats.totalEnrollments, link: "/admin/enrollments", icon: "📈", color: "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Platform overview and platform statistics</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/admin/courses"
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-colors shadow-xs"
          >
            Moderate Courses
          </Link>
          <Link
            to="/admin/audit-logs"
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors border border-gray-200 dark:border-gray-700"
          >
            Audit Logs
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((card, idx) => (
          <Link
            key={idx}
            to={card.link}
            className="group block p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xs hover:shadow-md hover:border-indigo-400 dark:hover:border-indigo-600 transition-all"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{card.title}</span>
              <span className={`p-2 rounded-xl text-sm ${card.color}`}>{card.icon}</span>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
              {card.value}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 flex items-center gap-1 font-medium">
              <span>View details</span>
              <span>→</span>
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
