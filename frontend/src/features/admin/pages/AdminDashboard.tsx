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

export interface DashboardCategory {
  _id: string;
  name: string;
  slug: string;
  icon: string;
  courseCount?: number;
  publishedCount?: number;
  isActive: boolean;
}

export function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [categories, setCategories] = useState<DashboardCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get<{ stats: AdminStats }>("/admin/stats"),
      api.get<{ categories: DashboardCategory[] }>("/categories/admin/all").catch(() => ({ data: { categories: [] } })),
    ])
      .then(([statsRes, catRes]) => {
        setStats(statsRes.data.stats);
        setCategories(catRes.data.categories || []);
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
          {Array.from({ length: 6 }).map((_, idx) => (
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
    { title: "Categories", value: categories.length, link: "/admin/categories", icon: "🏷️", color: "bg-pink-50 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400" },
    { title: "Enrollments", value: stats.totalEnrollments, link: "/admin/enrollments", icon: "📈", color: "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Platform overview, metrics and discipline distribution</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/admin/categories"
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors border border-gray-200 dark:border-gray-700 flex items-center gap-1.5"
          >
            <span>🏷️</span>
            <span>Manage Categories</span>
          </Link>
          <Link
            to="/admin/courses"
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-colors shadow-xs"
          >
            Moderate Courses
          </Link>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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

      {/* Category Breakdown Shelf */}
      {categories.length > 0 && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-3xl p-6 shadow-2xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <span>📊</span>
                <span>Course Distribution by Category</span>
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Real-time course inventory and student learning tracks across platform disciplines.
              </p>
            </div>
            <Link
              to="/admin/categories"
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
            >
              <span>Edit Categories & Themes</span>
              <span>→</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
            {categories.map((cat) => {
              const count = cat.courseCount || 0;
              const maxCourses = Math.max(...categories.map((c) => c.courseCount || 0), 1);
              const percentage = Math.round((count / maxCourses) * 100);

              return (
                <a
                  key={cat._id}
                  href={`/courses?category=${cat.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-900/60 border border-gray-200/80 dark:border-gray-700/80 hover:border-indigo-400 dark:hover:border-indigo-500 transition-all group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-2xl">{cat.icon}</span>
                      <span className="text-xs font-bold font-mono px-2 py-0.5 rounded-full bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 shadow-2xs">
                        {count} {count === 1 ? "course" : "courses"}
                      </span>
                    </div>
                    <p className="font-bold text-gray-900 dark:text-white text-sm group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {cat.name}
                    </p>
                  </div>

                  <div className="mt-3 space-y-1.5">
                    <div className="w-full bg-gray-200 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-indigo-600 dark:bg-indigo-400 h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(percentage, 5)}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-gray-400">
                      <span>/{cat.slug}</span>
                      <span className="font-semibold text-indigo-600 dark:text-indigo-400 group-hover:translate-x-0.5 transition-transform">
                        Drill down ↗
                      </span>
                    </div>
                  </div>
                </a>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

