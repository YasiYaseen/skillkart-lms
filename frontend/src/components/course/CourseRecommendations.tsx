import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { SparklesIcon, BookOpenIcon } from "@heroicons/react/24/solid";
import Rating from "../common/Rating";

interface RecommendedCourse {
  _id: string;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  price?: number;
  isPaid?: boolean;
  level?: string;
  tags?: string[];
  averageRating: number;
  reviewCount: number;
  enrollmentCount: number;
  instructor?: {
    _id?: string;
    name: string;
    avatar?: string;
  };
}

interface CourseRecommendationsProps {
  title?: string;
  subtitle?: string;
  limit?: number;
}

export default function CourseRecommendations({
  title = "Recommended for You",
  subtitle = "Based on your interests and popular courses",
  limit = 4,
}: CourseRecommendationsProps) {
  const [courses, setCourses] = useState<RecommendedCourse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRecommendations() {
      try {
        setLoading(true);
        const res = await fetch("/api/courses/recommendations");
        if (res.ok) {
          const data = await res.json();
          setCourses(data.recommendations || []);
        }
      } catch (err) {
        console.error("Failed to load course recommendations:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchRecommendations();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-6 w-48 bg-gray-200 dark:bg-gray-700 rounded"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="h-56 bg-gray-100 dark:bg-gray-800 rounded-2xl"></div>
          <div className="h-56 bg-gray-100 dark:bg-gray-800 rounded-2xl"></div>
          <div className="h-56 bg-gray-100 dark:bg-gray-800 rounded-2xl"></div>
          <div className="h-56 bg-gray-100 dark:bg-gray-800 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  if (courses.length === 0) return null;

  const displayCourses = courses.slice(0, limit);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <SparklesIcon className="w-6 h-6 text-amber-500" />
            {title}
          </h2>
          {subtitle && (
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">{subtitle}</p>
          )}
        </div>
        <Link
          to="/courses"
          className="text-xs sm:text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
        >
          View all courses &rarr;
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {displayCourses.map((course) => (
          <Link
            key={course._id}
            to={`/courses/${course._id}`}
            className="group bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all flex flex-col"
          >
            <div className="aspect-video w-full overflow-hidden bg-gray-100 dark:bg-gray-700 relative">
              {course.thumbnailUrl ? (
                <img
                  src={course.thumbnailUrl}
                  alt={course.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <BookOpenIcon className="w-10 h-10" />
                </div>
              )}
              {course.level && (
                <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/90 dark:bg-gray-900/90 text-gray-800 dark:text-gray-200 capitalize backdrop-blur-sm">
                  {course.level}
                </span>
              )}
            </div>

            <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
              <div>
                <h3 className="font-semibold text-sm text-gray-900 dark:text-white line-clamp-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {course.title}
                </h3>
                {course.instructor?.name && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    by {course.instructor.name}
                  </p>
                )}
              </div>

              <div className="pt-2 border-t border-gray-100 dark:border-gray-700/60 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1">
                  <Rating value={course.averageRating} readonly size="sm" />
                  <span className="text-gray-500 text-[11px]">({course.reviewCount})</span>
                </div>
                <div className="font-bold text-sm text-indigo-600 dark:text-indigo-400">
                  {course.isPaid && course.price ? `$${course.price.toFixed(2)}` : "Free"}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
