import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ClockIcon, BookOpenIcon } from "@heroicons/react/24/outline";
import { api } from "@/lib/api";
import { useAuth } from "../../features/auth/AuthContext";

interface RecentCourse {
  _id: string;
  title: string;
  thumbnailUrl?: string;
  price?: number;
  level?: string;
  instructor?: {
    name: string;
  };
}

export default function RecentlyViewedCourses() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<RecentCourse[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchRecent() {
      if (!user) return;
      try {
        setLoading(true);
        const res = await api.get("/me/recently-viewed");
        setCourses(res.data.courses || []);
      } catch (err) {
        console.error("Failed to load recently viewed courses:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchRecent();
  }, [user]);

  if (!user || loading || courses.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <ClockIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span>Recently Viewed</span>
        </h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {courses.slice(0, 4).map((course) => (
          <Link
            key={course._id}
            to={`/courses/${course._id}`}
            className="group flex items-center gap-3 p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-2xs hover:shadow-sm transition-all"
          >
            <div className="w-14 h-10 rounded-md overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0">
              {course.thumbnailUrl ? (
                <img
                  src={course.thumbnailUrl}
                  alt={course.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400">
                  <BookOpenIcon className="w-5 h-5" />
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <h4 className="text-xs font-semibold text-slate-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {course.title}
              </h4>
              {course.instructor?.name && (
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  {course.instructor.name}
                </p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
