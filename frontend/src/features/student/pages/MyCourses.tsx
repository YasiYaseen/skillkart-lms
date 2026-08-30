import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { EnrollmentCard, EnrollmentCardProps } from '@/features/enrollment/components/EnrollmentCard';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';
import LearningStreakCard from '../components/LearningStreakCard';
import CourseRecommendations from '@/components/course/CourseRecommendations';
import RecentlyViewedCourses from '@/components/course/RecentlyViewedCourses';

type EnrollmentItem = EnrollmentCardProps['enrollment'];

function EnrollmentCardSkeleton() {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xs border border-gray-200 dark:border-gray-700 overflow-hidden animate-pulse flex flex-col">
            <div className="aspect-video bg-gray-200 dark:bg-gray-700 w-full" />
            <div className="p-5 flex flex-col flex-grow space-y-3">
                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded-md w-4/5" />
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
                <div className="mt-auto pt-4 space-y-2">
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full w-full" />
                    <div className="flex justify-between items-center">
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-8" />
                    </div>
                </div>
            </div>
        </div>
    );
}

function MyCourses() {
    const [enrollments, setEnrollments] = useState<EnrollmentItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchEnrollments = async () => {
            try {
                const res = await api.get<{ data: EnrollmentItem[] }>('/enrollments/me');
                setEnrollments(res.data.data || []);
            } catch (err: unknown) {
                const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to fetch your courses';
                toast.error(msg);
            } finally {
                setLoading(false);
            }
        };

        fetchEnrollments();
    }, []);

    const handleUnenroll = async (enrollmentId: string) => {
        try {
            await api.delete(`/enrollments/${enrollmentId}`);
            toast.success('Successfully unenrolled from the course');
            setEnrollments(prev => prev.filter(e => e._id !== enrollmentId));
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to unenroll';
            toast.error(msg);
        }
    };

    const activeCourses = enrollments.filter(e => e.status === 'active');
    const completedCourses = enrollments.filter(e => e.status === 'completed');

    return (
        <div className="container py-10 space-y-10">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">My Learning</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">Track your active courses, streaks, and learning journey.</p>
            </div>

            {/* Learning Streak Tracker */}
            <LearningStreakCard />

            {/* Recently Viewed Strip */}
            <RecentlyViewedCourses />

            {loading ? (
                <div className="space-y-6">
                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-48 animate-pulse" />
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <EnrollmentCardSkeleton key={i} />
                        ))}
                    </div>
                </div>
            ) : enrollments.length === 0 ? (
                <div className="text-center py-16 px-6 bg-white dark:bg-gray-800 rounded-3xl shadow-xs border border-gray-100 dark:border-gray-700">
                    <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-4 text-2xl shadow-xs">
                        🎓
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Start your learning journey</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-6">
                        You haven't enrolled in any courses yet. Browse our catalog of expert-led courses and start building your skills today.
                    </p>
                    <Link
                        to="/courses"
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-all shadow-md hover:shadow-indigo-500/25"
                    >
                        <span>Explore Courses</span>
                        <span>→</span>
                    </Link>
                </div>
            ) : (
                <div className="space-y-12">
                    {/* Active / In Progress */}
                    {activeCourses.length > 0 && (
                        <section>
                            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-5 flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block"></span>
                                In Progress
                                <span className="text-sm font-normal text-gray-400">({activeCourses.length})</span>
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                {activeCourses.map(enrollment => (
                                    <EnrollmentCard
                                        key={enrollment._id}
                                        enrollment={enrollment}
                                        onUnenroll={handleUnenroll}
                                    />
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Completed */}
                    {completedCourses.length > 0 && (
                        <section>
                            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-5 flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block"></span>
                                Completed
                                <span className="text-sm font-normal text-gray-400">({completedCourses.length})</span>
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                {completedCourses.map(enrollment => (
                                    <EnrollmentCard
                                        key={enrollment._id}
                                        enrollment={enrollment}
                                        completed
                                    />
                                ))}
                            </div>
                        </section>
                    )}
                </div>
            )}

            {/* Course Recommendations */}
            <div className="pt-6 border-t border-gray-100 dark:border-gray-800">
                <CourseRecommendations
                    title="Recommended Next Steps"
                    subtitle="Explore courses matching your interests and popular topics"
                />
            </div>
        </div>
    );
}

export default MyCourses;
