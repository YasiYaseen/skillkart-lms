import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { CourseCard, Course } from '@/components/common';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';

function MyCourses() {
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchEnrollments = async () => {
            try {
                const res = await api.get('/me/courses');
                const mappedCourses = res.data.enrollments.map((enrollment: any) => {
                    const c = enrollment.course;
                    return {
                        id: c._id,
                        title: c.title,
                        instructor: c.instructor?.name || 'Instructor',
                        thumbnail: c.thumbnailUrl || 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400&h=300&fit=crop',
                        rating: 0,
                        reviewCount: 0,
                        price: c.price || 0
                    };
                });
                setCourses(mappedCourses);
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
            
            {courses.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
                    <p className="text-gray-500 mb-4">You have not enrolled in any courses yet.</p>
                    <Link to="/courses" className="text-blue-600 hover:underline">
                        Browse Courses
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {courses.map(course => (
                        <div key={course.id} className="relative group">
                            <CourseCard course={course} />
                            <Link 
                                to={`/learn/${course.id}`}
                                className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-2xl"
                            >
                                <span className="text-white font-semibold bg-blue-600 px-6 py-2 rounded-full">Continue Learning</span>
                            </Link>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default MyCourses;
