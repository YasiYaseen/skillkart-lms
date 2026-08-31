import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { SparklesIcon, BookOpenIcon } from "@heroicons/react/24/solid";
import Rating from "../common/Rating";
import { useCurrency } from "@/context/CurrencyContext";

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
  subtitle = "Curated courses tailored to your recent learning activity",
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
      <div className="space-y-3 animate-pulse">
        <div className="h-5 w-40 bg-slate-200 dark:bg-slate-800 rounded"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-52 bg-slate-100 dark:bg-slate-800/60 rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  if (courses.length === 0) return null;

  const displayCourses = courses.slice(0, limit);
  const { formatPrice } = useCurrency();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <SparklesIcon className="w-4 h-4 text-amber-500" />
            <span>{title}</span>
          </h2>
          {subtitle && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>
          )}
        </div>
        <Link
          to="/courses"
          className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
        >
          View all courses &rarr;
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {displayCourses.map((course) => (
          <Link
            key={course._id}
            to={`/courses/${course._id}`}
            className="group bg-white dark:bg-slate-900 rounded-xl overflow-hidden shadow-2xs border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col"
          >
            <div className="aspect-16/10 w-full overflow-hidden bg-slate-100 dark:bg-slate-800 relative">
              {course.thumbnailUrl ? (
                <img
                  src={course.thumbnailUrl}
                  alt={course.title}
                  className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400">
                  <BookOpenIcon className="w-8 h-8" />
                </div>
              )}
              {course.level && (
                <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-white/95 dark:bg-slate-900/95 text-slate-700 dark:text-slate-300 capitalize border border-slate-200/50 dark:border-slate-800/50">
                  {course.level}
                </span>
              )}
            </div>

            <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2">
              <div>
                <h3 className="font-semibold text-xs text-slate-900 dark:text-white line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {course.title}
                </h3>
                {course.instructor?.name && (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    {course.instructor.name}
                  </p>
                )}
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <Rating value={course.averageRating || 0} count={course.reviewCount} />
                <div className="font-bold text-xs text-slate-900 dark:text-white">
                  {course.isPaid && course.price ? formatPrice(course.price) : "Free"}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
