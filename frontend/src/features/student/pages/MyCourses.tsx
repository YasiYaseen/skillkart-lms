import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { EnrollmentCard } from '@/features/enrollment/components/EnrollmentCard';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';
import LearningStreakCard from '../components/LearningStreakCard';
import CourseRecommendations from '@/components/course/CourseRecommendations';
import RecentlyViewedCourses from '@/components/course/RecentlyViewedCourses';

function MyCourses() {
    const [enrollments, setEnrollments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchEnrollments = async () => {
            try {
                const res = await api.get('/enrollments/me');
                setEnrollments(res.data.data || []);
            } catch (err: any) {
                toast.error(err.response?.data?.message || 'Failed to fetch your courses');
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
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to unenroll');
        }
    };

    if (loading) {
        return <div className="text-center py-20 text-gray-500">Loading your courses...</div>;
    }

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

            {enrollments.length === 0 ? (
                <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <p className="text-gray-500 dark:text-gray-400 mb-4">You have not enrolled in any courses yet.</p>
                    <Link to="/courses" className="inline-flex items-center px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors">
                        Browse Courses
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
