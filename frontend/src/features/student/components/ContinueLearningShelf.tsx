import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';

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
            <div className="w-full bg-white dark:bg-gray-800/80 rounded-3xl p-6 border border-gray-100 dark:border-gray-700/80 shadow-xs animate-pulse">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-md w-48 mb-4" />
                <div className="h-36 bg-gray-100 dark:bg-gray-700/50 rounded-2xl w-full" />
            </div>
        );
    }

    if (enrollments.length === 0) {
        return (
            <div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-indigo-600 via-indigo-700 to-purple-800 text-white p-7 md:p-8 shadow-xl shadow-indigo-500/10">
                <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
                <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div className="max-w-xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-semibold mb-3">
                            <span>✨</span>
                            <span>Begin Your Next Milestone</span>
                        </div>
                        <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-2">
                            Ready to kickstart your tech career?
                        </h2>
                        <p className="text-indigo-100 text-sm leading-relaxed">
                            Discover hands-on courses taught by industry veterans. Enroll in free starter courses or explore curated career tracks below!
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <Link
                            to="/courses"
                            className="px-6 py-3 rounded-2xl bg-white text-indigo-700 hover:bg-indigo-50 font-bold text-sm shadow-md transition-transform hover:-translate-y-0.5"
                        >
                            Browse All Courses →
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
                    <span className="flex h-3 w-3 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-600"></span>
                    </span>
                    <h2 className="text-xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                        Jump Back In
                    </h2>
                </div>
                <Link
                    to="/my-courses"
                    className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                >
                    <span>View all ({enrollments.length})</span>
                    <span>→</span>
                </Link>
            </div>

            {/* Featured Resume Spotlight Card */}
            <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-indigo-900 via-gray-900 to-indigo-950 text-white p-6 md:p-8 border border-indigo-800/40 shadow-xl">
                <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

                <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                    {/* Left: Thumbnail with Play Overlay */}
                    <div className="lg:col-span-4 relative rounded-2xl overflow-hidden aspect-video group shadow-lg">
                        <img
                            src={course.thumbnailUrl || fallbackThumb}
                            alt={course.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div
                            onClick={() => navigate(resumeLink)}
                            className="absolute inset-0 bg-black/40 hover:bg-black/30 transition-colors flex items-center justify-center cursor-pointer"
                        >
                            <div className="w-14 h-14 rounded-full bg-white/90 text-indigo-600 flex items-center justify-center pl-1 shadow-xl group-hover:scale-110 transition-transform">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7">
                                    <path fillRule="evenodd" d="M4.5 5.653c0-1.427 1.529-2.33 2.779-1.643l11.54 6.347c1.295.712 1.295 2.573 0 3.286L7.28 19.99c-1.25.687-2.779-.217-2.779-1.643V5.653Z" clipRule="evenodd" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    {/* Middle: Course Info & Next Lesson */}
                    <div className="lg:col-span-5 flex flex-col justify-center space-y-3">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold w-fit border border-indigo-400/20">
                            <span>⚡ Currently In Progress</span>
                        </div>

                        <h3 className="text-xl md:text-2xl font-black text-white leading-snug line-clamp-2">
                            {course.title}
                        </h3>

                        <p className="text-xs text-indigo-200">
                            Instructor: <span className="font-semibold text-white">{course.instructor?.name || 'Instructor'}</span>
                        </p>

                        {/* Next Up Lesson */}
                        <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-indigo-500/30 text-indigo-300 flex items-center justify-center text-sm font-bold shrink-0">
                                ▶
                            </div>
                            <div className="truncate flex-1">
                                <p className="text-[10px] uppercase font-bold text-indigo-300 tracking-wider">Next Lesson</p>
                                <p className="text-xs font-semibold text-white truncate">
                                    {lastLesson ? lastLesson.title : 'Resume next available module'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Right: Progress & Action */}
                    <div className="lg:col-span-3 flex flex-col justify-center items-start lg:items-end space-y-4 border-t lg:border-t-0 lg:border-l border-white/10 pt-4 lg:pt-0 lg:pl-6">
                        <div className="w-full text-left lg:text-right">
                            <div className="flex items-center justify-between lg:justify-end gap-3 mb-1.5">
                                <span className="text-xs text-indigo-200 font-medium">Course Progress</span>
                                <span className="text-sm font-extrabold text-white font-mono">{progress}%</span>
                            </div>
                            <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                                <div
                                    className="bg-linear-to-r from-indigo-400 to-purple-400 h-full rounded-full transition-all duration-500"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                            <p className="text-[11px] text-indigo-300 mt-1">
                                {primaryEnrollment.completedLessonIds?.length || 0} of {primaryEnrollment.totalLessonsCount || 0} lessons completed
                            </p>
                        </div>

                        <div className="w-full flex flex-col sm:flex-row lg:flex-col gap-2">
                            <button
                                onClick={() => navigate(resumeLink)}
                                className="w-full py-3 px-5 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-bold text-xs md:text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/30 transition-all cursor-pointer"
                            >
                                <span>Resume Learning</span>
                                <span>→</span>
                            </button>
                            <Link
                                to={`/courses/${course._id}`}
                                className="w-full py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white text-center font-semibold text-xs transition-colors"
                            >
                                View Full Syllabus
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Other Enrolled Courses Strip (if multiple) */}
            {otherEnrollments.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-2">
                    {otherEnrollments.map((enr) => {
                        const enrCourse = enr.course;
                        const enrProgress = Math.round(enr.progressPercentage || 0);
                        const enrLink = enr.lastAccessedLessonId
                            ? `/learn/${enrCourse._id}/${enr.lastAccessedLessonId._id}`
                            : `/learn/${enrCourse._id}`;

                        return (
                            <div
                                key={enr._id}
                                className="p-4 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-xs flex items-center gap-4 hover:shadow-md transition-all group"
                            >
                                <img
                                    src={enrCourse.thumbnailUrl || fallbackThumb}
                                    alt={enrCourse.title}
                                    className="w-16 h-12 rounded-xl object-cover shrink-0"
                                />
                                <div className="truncate flex-1">
                                    <h4 className="text-xs font-bold text-gray-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                                        {enrCourse.title}
                                    </h4>
                                    <div className="flex items-center gap-2 mt-1.5">
                                        <div className="w-full bg-gray-100 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden">
                                            <div
                                                className="bg-indigo-600 dark:bg-indigo-400 h-full rounded-full"
                                                style={{ width: `${enrProgress}%` }}
                                            />
                                        </div>
                                        <span className="text-[10px] font-mono text-gray-500 dark:text-gray-400">{enrProgress}%</span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => navigate(enrLink)}
                                    className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-600 hover:text-white text-xs font-bold transition-colors cursor-pointer shrink-0"
                                    title="Continue course"
                                >
                                    ▶
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
