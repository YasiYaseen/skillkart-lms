import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ClockIcon, BookOpenIcon } from "@heroicons/react/24/outline";
import { api } from "../../lib/axios";
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
        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <ClockIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          Recently Viewed
        </h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {courses.slice(0, 4).map((course) => (
          <Link
            key={course._id}
            to={`/courses/${course._id}`}
            className="group flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 hover:shadow-sm hover:border-indigo-100 dark:hover:border-indigo-900 transition-all"
          >
            <div className="w-16 h-12 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 shrink-0">
              {course.thumbnailUrl ? (
                <img
                  src={course.thumbnailUrl}
                  alt={course.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <BookOpenIcon className="w-6 h-6" />
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <h4 className="text-xs font-semibold text-gray-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                {course.title}
              </h4>
              {course.instructor?.name && (
                <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
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
