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

    if (loading) {
        return <div className="text-center py-20 text-gray-500">Loading your courses...</div>;
    }

    return (
        <div className="container py-10">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">My Enrolled Courses</h1>
            
            {enrollments.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
                    <p className="text-gray-500 mb-4">You have not enrolled in any courses yet.</p>
                    <Link to="/courses" className="text-blue-600 hover:underline">
                        Browse Courses
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {enrollments.map(enrollment => (
                        <EnrollmentCard key={enrollment._id} enrollment={enrollment} />
                    ))}
                </div>
            )}
        </div>
    );
}

export default MyCourses;
