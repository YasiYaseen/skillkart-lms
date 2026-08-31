import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import {
    PlayIcon,
    ArrowRightIcon,
    AcademicCapIcon,
    BookOpenIcon,
    ChevronRightIcon,
} from '@heroicons/react/20/solid';

interface EnrollmentCourse {
    _id: string;
    title: string;
    thumbnailUrl?: string;
    instructor?: {
        name?: string;
    };
}

interface EnrollmentItem {
    _id: string;
    course: EnrollmentCourse;
    status: 'active' | 'completed' | 'cancelled';
    progressPercentage: number;
    completedLessonIds: string[];
    totalLessonsCount: number;
    lastAccessedLessonId?: {
        _id: string;
        title: string;
    };
    updatedAt?: string;
}

export function ContinueLearningShelf() {
    const navigate = useNavigate();
    const [enrollments, setEnrollments] = useState<EnrollmentItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get<{ data: EnrollmentItem[] }>('/enrollments/me?status=active')
            .then((res) => {
                setEnrollments(res.data.data || []);
            })
            .catch(() => {
                setEnrollments([]);
            })
            .finally(() => {
                setLoading(false);
            });
    }, []);

    if (loading) {
        return (
            <div className="w-full bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xs animate-pulse">
                <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded w-48 mb-4" />
                <div className="h-32 bg-slate-100 dark:bg-slate-800/60 rounded-lg w-full" />
            </div>
        );
    }

    if (enrollments.length === 0) {
        return (
            <div className="rounded-xl bg-slate-900 text-white p-6 sm:p-8 border border-slate-800 shadow-sm">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div className="max-w-xl">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-500/15 text-blue-300 text-xs font-semibold mb-2.5 border border-blue-400/20">
                            <AcademicCapIcon className="w-3.5 h-3.5" />
                            <span>Learning Dashboard</span>
                        </div>
                        <h2 className="text-xl sm:text-2xl font-bold tracking-tight mb-2">
                            Ready to begin your learning path?
                        </h2>
                        <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                            Explore courses across software development, data science, product leadership, and business strategy.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <Link
                            to="/courses"
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs sm:text-sm shadow-2xs transition-colors"
                        >
                            <span>Explore Catalog</span>
                            <ArrowRightIcon className="w-4 h-4" />
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    const primaryEnrollment = enrollments[0];
    const otherEnrollments = enrollments.slice(1, 4);

    const course = primaryEnrollment.course;
    const progress = Math.round(primaryEnrollment.progressPercentage || 0);
    const lastLesson = primaryEnrollment.lastAccessedLessonId;
    const fallbackThumb = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&h=400&fit=crop';

    const resumeLink = lastLesson
        ? `/learn/${course._id}/${lastLesson._id}`
        : `/learn/${course._id}`;

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="flex h-2.5 w-2.5 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-600"></span>
                    </span>
                    <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                        Continue Learning
                    </h2>
                </div>
                <Link
                    to="/my-courses"
                    className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                >
                    <span>View all enrolled ({enrollments.length})</span>
                    <ChevronRightIcon className="w-3.5 h-3.5" />
                </Link>
            </div>

            {/* Featured Resume Spotlight Card */}
            <div className="rounded-xl bg-slate-900 text-white p-5 sm:p-6 border border-slate-800 shadow-sm">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                    {/* Left: Thumbnail with Play Overlay */}
                    <div className="lg:col-span-4 relative rounded-lg overflow-hidden aspect-16/10 group bg-slate-800">
                        <img
                            src={course.thumbnailUrl || fallbackThumb}
                            alt={course.title}
                            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                        />
                        <div
                            onClick={() => navigate(resumeLink)}
                            className="absolute inset-0 bg-slate-950/40 hover:bg-slate-950/30 transition-colors flex items-center justify-center cursor-pointer"
                        >
                            <div className="w-11 h-11 rounded-full bg-white text-slate-900 flex items-center justify-center pl-0.5 shadow-md group-hover:scale-105 transition-transform">
                                <PlayIcon className="w-5 h-5 text-blue-600" />
                            </div>
                        </div>
                    </div>

                    {/* Middle: Course Info & Next Lesson */}
                    <div className="lg:col-span-5 flex flex-col justify-center space-y-2.5">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-blue-500/20 text-blue-300 text-[11px] font-medium w-fit border border-blue-400/20">
                            <span>In Progress</span>
                        </div>

                        <h3 className="text-lg sm:text-xl font-bold text-white leading-snug line-clamp-2">
                            {course.title}
                        </h3>

                        <p className="text-xs text-slate-400">
                            Instructor: <span className="font-medium text-slate-200">{course.instructor?.name || 'Instructor'}</span>
                        </p>

                        {/* Next Up Lesson */}
                        <div className="p-3 rounded-lg bg-slate-800/80 border border-slate-700/60 flex items-center gap-2.5">
                            <BookOpenIcon className="w-4 h-4 text-blue-400 shrink-0" />
                            <div className="truncate flex-1">
                                <p className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">Up Next</p>
                                <p className="text-xs font-medium text-slate-100 truncate">
                                    {lastLesson ? lastLesson.title : 'Resume next module'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Right: Progress & Action */}
                    <div className="lg:col-span-3 flex flex-col justify-center items-start lg:items-end space-y-3.5 border-t lg:border-t-0 lg:border-l border-slate-800 pt-4 lg:pt-0 lg:pl-6">
                        <div className="w-full text-left lg:text-right">
                            <div className="flex items-center justify-between lg:justify-end gap-3 mb-1.5">
                                <span className="text-xs text-slate-400 font-normal">Progress</span>
                                <span className="text-xs font-bold text-white font-mono">{progress}%</span>
                            </div>
                            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                                <div
                                    className="bg-blue-500 h-full rounded-full transition-all duration-300"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                            <p className="text-[11px] text-slate-400 mt-1">
                                {primaryEnrollment.completedLessonIds?.length || 0} of {primaryEnrollment.totalLessonsCount || 0} lessons completed
                            </p>
                        </div>

                        <div className="w-full flex flex-col sm:flex-row lg:flex-col gap-2">
                            <button
                                onClick={() => navigate(resumeLink)}
                                className="w-full py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                            >
                                <span>Resume Learning</span>
                                <ArrowRightIcon className="w-3.5 h-3.5" />
                            </button>
                            <Link
                                to={`/courses/${course._id}`}
                                className="w-full py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-center font-medium text-xs transition-colors border border-slate-700/60"
                            >
                                View Syllabus
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Other Enrolled Courses Strip (if multiple) */}
            {otherEnrollments.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-1">
                    {otherEnrollments.map((enr) => {
                        const enrCourse = enr.course;
                        const enrProgress = Math.round(enr.progressPercentage || 0);
                        const enrLink = enr.lastAccessedLessonId
                            ? `/learn/${enrCourse._id}/${enr.lastAccessedLessonId._id}`
                            : `/learn/${enrCourse._id}`;

                        return (
                            <div
                                key={enr._id}
                                className="p-3.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs flex items-center gap-3 hover:border-slate-300 dark:hover:border-slate-700 transition-all group"
                            >
                                <img
                                    src={enrCourse.thumbnailUrl || fallbackThumb}
                                    alt={enrCourse.title}
                                    className="w-14 h-10 rounded-md object-cover shrink-0 bg-slate-100 dark:bg-slate-800"
                                />
                                <div className="truncate flex-1">
                                    <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400">
                                        {enrCourse.title}
                                    </h4>
                                    <div className="flex items-center gap-2 mt-1">
                                        <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                            <div
                                                className="bg-blue-600 h-full rounded-full"
                                                style={{ width: `${enrProgress}%` }}
                                            />
                                        </div>
                                        <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">{enrProgress}%</span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => navigate(enrLink)}
                                    className="p-1.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 dark:hover:text-white transition-colors cursor-pointer shrink-0"
                                    title="Continue course"
                                >
                                    <PlayIcon className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default ContinueLearningShelf;
