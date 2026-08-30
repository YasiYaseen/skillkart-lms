import { Link } from 'react-router-dom';
import { CourseCard, Course } from '@/components/common/CourseCard';

interface CourseRowShelfProps {
    title: string;
    subtitle?: string;
    icon?: string;
    courses: Course[];
    viewAllLink?: string;
    loading?: boolean;
    badge?: string;
}

function CourseSkeletonCard() {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden shadow-xs animate-pulse flex flex-col h-full">
            <div className="aspect-video bg-gray-200 dark:bg-gray-700 w-full" />
            <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                <div className="space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                    <div className="h-3 bg-gray-100 dark:bg-gray-700/60 rounded w-1/2" />
                </div>
                <div className="pt-3 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16" />
                    <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-12" />
                </div>
            </div>
        </div>
    );
}

export function CourseRowShelf({
    title,
    subtitle,
    icon,
    courses,
    viewAllLink,
    loading = false,
    badge,
}: CourseRowShelfProps) {
    if (!loading && (!courses || courses.length === 0)) {
        return null;
    }

    return (
        <section className="space-y-4">
            {/* Shelf Header */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
                <div>
                    <div className="flex items-center gap-2">
                        {icon && <span className="text-xl">{icon}</span>}
                        <h2 className="text-xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                            {title}
                        </h2>
                        {badge && (
                            <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                                {badge}
                            </span>
                        )}
                    </div>
                    {subtitle && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            {subtitle}
                        </p>
                    )}
                </div>

                {viewAllLink && (
                    <Link
                        to={viewAllLink}
                        className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1 shrink-0 transition-colors"
                    >
                        <span>Explore All</span>
                        <span>→</span>
                    </Link>
                )}
            </div>

            {/* Courses Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                {loading
                    ? Array.from({ length: 4 }).map((_, i) => <CourseSkeletonCard key={i} />)
                    : courses.slice(0, 4).map((c) => (
                        <CourseCard key={c.id} course={c} />
                    ))}
            </div>
        </section>
    );
}

export default CourseRowShelf;
