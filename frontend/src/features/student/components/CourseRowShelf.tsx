import { Link } from 'react-router-dom';
import { CourseCard, Course } from '@/components/common/CourseCard';
import { ArrowRightIcon } from '@heroicons/react/20/solid';
import React from 'react';

interface CourseRowShelfProps {
    title: string;
    subtitle?: string;
    icon?: React.ReactNode;
    courses: Course[];
    viewAllLink?: string;
    loading?: boolean;
    badge?: string;
}

function CourseSkeletonCard() {
    return (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xs animate-pulse flex flex-col h-full">
            <div className="aspect-16/10 bg-slate-200 dark:bg-slate-800 w-full" />
            <div className="p-4 sm:p-5 space-y-3 flex-1 flex flex-col justify-between">
                <div className="space-y-2">
                    <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-3/4" />
                    <div className="h-3 bg-slate-100 dark:bg-slate-800/60 rounded w-1/2" />
                </div>
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                    <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-16" />
                    <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-12" />
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
                        {icon && (
                            <span className="text-slate-700 dark:text-slate-300 flex items-center">
                                {icon}
                            </span>
                        )}
                        <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                            {title}
                        </h2>
                        {badge && (
                            <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                {badge}
                            </span>
                        )}
                    </div>
                    {subtitle && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            {subtitle}
                        </p>
                    )}
                </div>

                {viewAllLink && (
                    <Link
                        to={viewAllLink}
                        className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1 shrink-0 transition-colors"
                    >
                        <span>Explore All</span>
                        <ArrowRightIcon className="w-3.5 h-3.5" />
                    </Link>
                )}
            </div>

            {/* Courses Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
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
