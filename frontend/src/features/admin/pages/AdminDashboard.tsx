import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { toast } from 'sonner';
import { Link } from "react-router-dom";
import {
  UserGroupIcon,
  AcademicCapIcon,
  UserIcon,
  BookOpenIcon,
  TagIcon,
  ChartBarIcon,
  ArrowRightIcon,
} from "@heroicons/react/20/solid";

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
          <div className="h-7 bg-slate-200 dark:bg-slate-800 rounded w-48" />
          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-64" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div key={idx} className="h-28 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5" />
          ))}
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const statCards = [
    { title: "Total Users", value: stats.totalUsers, link: "/admin/users", icon: <UserGroupIcon className="w-5 h-5 text-blue-600" /> },
    { title: "Students", value: stats.totalStudents, link: "/admin/users", icon: <AcademicCapIcon className="w-5 h-5 text-emerald-600" /> },
    { title: "Instructors", value: stats.totalInstructors, link: "/admin/users", icon: <UserIcon className="w-5 h-5 text-indigo-600" /> },
    { title: "Courses", value: stats.totalCourses, link: "/admin/courses", icon: <BookOpenIcon className="w-5 h-5 text-amber-600" /> },
    { title: "Categories", value: categories.length, link: "/admin/categories", icon: <TagIcon className="w-5 h-5 text-rose-600" /> },
    { title: "Enrollments", value: stats.totalEnrollments, link: "/admin/enrollments", icon: <ChartBarIcon className="w-5 h-5 text-purple-600" /> },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Admin Dashboard</h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">Platform overview, metrics and discipline distribution</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/admin/categories"
            className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors border border-slate-200 dark:border-slate-700 flex items-center gap-1.5"
          >
            <TagIcon className="w-3.5 h-3.5 text-slate-500" />
            <span>Manage Categories</span>
          </Link>
          <Link
            to="/admin/courses"
            className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-colors shadow-2xs"
          >
            Moderate Courses
          </Link>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {statCards.map((card, idx) => (
          <Link
            key={idx}
            to={card.link}
            className="group block p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 transition-all"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{card.title}</span>
              <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800">{card.icon}</div>
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              {card.value}
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-2 flex items-center gap-1 font-medium">
              <span>View details</span>
              <ArrowRightIcon className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </p>
          </Link>
        ))}
      </div>

      {/* Category Breakdown Shelf */}
      {categories.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 sm:p-6 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ChartBarIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Course Distribution by Category</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Real-time course inventory and student learning tracks across platform disciplines.
              </p>
            </div>
            <Link
              to="/admin/categories"
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              <span>Manage Categories</span>
              <ArrowRightIcon className="w-3 h-3" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-2">
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
                  className="p-4 rounded-lg bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-sm text-slate-900 dark:text-white">{cat.name}</span>
                      <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 shadow-2xs">
                        {count} {count === 1 ? "course" : "courses"}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 space-y-1.5">
                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-blue-600 dark:bg-blue-400 h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(percentage, 5)}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span>/{cat.slug}</span>
                      <span className="font-medium text-blue-600 dark:text-blue-400 group-hover:translate-x-0.5 transition-transform">
                        Explore &rarr;
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

export default AdminDashboard;

