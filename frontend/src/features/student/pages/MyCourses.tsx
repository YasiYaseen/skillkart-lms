import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { EnrollmentCard } from '@/features/enrollment/components/EnrollmentCard';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';

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
        <div className="container py-10">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">My Learning</h1>

            {enrollments.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
                    <p className="text-gray-500 mb-4">You have not enrolled in any courses yet.</p>
                    <Link to="/courses" className="text-blue-600 hover:underline">
                        Browse Courses
                    </Link>
                </div>
            ) : (
                <div className="space-y-12">
                    {/* Active / In Progress */}
                    {activeCourses.length > 0 && (
                        <section>
                            <h2 className="text-xl font-semibold text-gray-800 mb-5 flex items-center gap-2">
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
                            <h2 className="text-xl font-semibold text-gray-800 mb-5 flex items-center gap-2">
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
        </div>
    );
}

export default MyCourses;
