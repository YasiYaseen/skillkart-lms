import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { toast } from 'react-toastify';

function MyCourses() {
    const [courses, setCourses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCourses = async () => {
            try {
                const res = await api.get('/courses?mine=true');
                const data = res.data.courses;
                
                // Fetch enrollments for each to get students & earnings
                const enriched = await Promise.all(data.map(async (c: any) => {
                    try {
                        const eRes = await api.get(`/courses/${c._id}/enrollments`);
                        const students = eRes.data.enrollments.length;
                        return {
                            id: c._id,
                            title: c.title,
                            thumbnail: c.thumbnailUrl || 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=100&h=60&fit=crop',
                            earnings: students * (c.price || 0),
                            students,
                            status: c.status
                        };
                    } catch {
                        return { id: c._id, title: c.title, thumbnail: c.thumbnailUrl, earnings: 0, students: 0, status: c.status };
                    }
                }));
                setCourses(enriched);
            } catch (err: any) {
                toast.error('Failed to fetch instructor courses');
            } finally {
                setLoading(false);
            }
        };
        fetchCourses();
    }, []);

    const togglePublish = async (courseId: string, currentStatus: string) => {
        try {
            if (currentStatus === 'published') {
                await api.patch(`/courses/${courseId}/unpublish`);
                toast.success('Course unpublished');
            } else {
                await api.patch(`/courses/${courseId}/publish`);
                toast.success('Course published!');
            }
            // Update local state
            setCourses(prev => prev.map(c => 
                c.id === courseId ? { ...c, status: currentStatus === 'published' ? 'draft' : 'published' } : c
            ));
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Action failed');
        }
    };

    if (loading) return <div className="text-gray-500 py-10">Loading courses...</div>;

    return (
        <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-8">My Courses</h1>

            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-gray-100">
                            <th className="text-left py-4 px-6 text-gray-500 font-medium">All Courses</th>
                            <th className="text-left py-4 px-6 text-gray-500 font-medium">Earnings</th>
                            <th className="text-left py-4 px-6 text-gray-500 font-medium">Students</th>
                            <th className="text-left py-4 px-6 text-gray-500 font-medium">Course Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {courses.map((course) => (
                            <tr key={course.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                <td className="py-4 px-6">
                                    <div className="flex items-center gap-4">
                                        <img
                                            src={course.thumbnail}
                                            alt={course.title}
                                            className="w-16 h-10 rounded object-cover flex-shrink-0"
                                        />
                                        <span className="text-gray-800 font-medium">{course.title}</span>
                                    </div>
                                </td>
                                <td className="py-4 px-6 text-gray-600">${course.earnings.toFixed(2)}</td>
                                <td className="py-4 px-6 text-gray-600">{course.students}</td>
                                <td className="py-4 px-6">
                                    <div className="flex items-center gap-2">
                                        {/* Toggle */}
                                        <button
                                            onClick={() => togglePublish(course.id, course.status)}
                                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${course.status === 'published' ? 'bg-blue-600' : 'bg-gray-300'
                                                }`}
                                        >
                                            <span
                                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${course.status === 'published' ? 'translate-x-6' : 'translate-x-1'
                                                    }`}
                                            />
                                        </button>
                                        <span className={`text-sm ${course.status === 'published' ? 'text-blue-600' : 'text-gray-400'}`}>
                                            {course.status === 'published' ? 'Live' : 'Draft'}
                                        </span>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {courses.length === 0 && (
                            <tr>
                                <td colSpan={4} className="py-10 text-center text-gray-500">No courses created yet.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default MyCourses;
