import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { toast } from 'react-toastify';
import { Modal } from '../../../components/common';
import { useCurrency } from '@/context/CurrencyContext';

const STATUS_BADGE: Record<string, string> = {
    published: 'bg-green-100 dark:bg-green-950/60 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800',
    draft: 'bg-yellow-100 dark:bg-yellow-950/60 text-yellow-700 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-800',
    archived: 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400',
};

export interface InstructorCourse {
    id: string;
    title: string;
    thumbnail: string;
    earnings: number;
    students: number;
    status: string;
    level: string;
}

interface RawInstructorCourse {
    _id: string;
    title: string;
    thumbnailUrl?: string;
    enrollmentCount?: number;
    price?: number;
    status: string;
    level?: string;
}

function MyCourses() {
    const navigate = useNavigate();
    const { formatAmount } = useCurrency();
    const [courses, setCourses] = useState<InstructorCourse[]>([]);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
    const [togglingId, setTogglingId] = useState<string | null>(null);

    const fetchCourses = useCallback(async () => {
        try {
            const res = await api.get<{ courses: RawInstructorCourse[] }>('/courses?mine=true');
            const data = res.data.courses || [];
            const mapped: InstructorCourse[] = data.map((c: RawInstructorCourse) => ({
                id: c._id,
                title: c.title,
                thumbnail: c.thumbnailUrl || 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=100&h=60&fit=crop',
                earnings: (c.enrollmentCount || 0) * (c.price || 0),
                students: c.enrollmentCount || 0,
                status: c.status,
                level: c.level || 'beginner',
            }));
            setCourses(mapped);
        } catch {
            toast.error('Failed to fetch instructor courses');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCourses();
    }, [fetchCourses]);

    const togglePublish = async (courseId: string, currentStatus: string) => {
        setTogglingId(courseId);
        try {
            if (currentStatus === 'published') {
                await api.patch(`/courses/${courseId}/unpublish`);
                toast.success('Course moved to draft');
            } else {
                await api.patch(`/courses/${courseId}/publish`);
                toast.success('Course published!');
            }
            setCourses(prev => prev.map(c =>
                c.id === courseId
                    ? { ...c, status: currentStatus === 'published' ? 'draft' : 'published' }
                    : c
            ));
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Action failed';
            toast.error(msg);
        } finally {
            setTogglingId(null);
        }
    };

    const handleDelete = async (courseId: string) => {
        setDeletingId(courseId);
        try {
            await api.delete(`/courses/${courseId}`);
            toast.success('Course deleted');
            setCourses(prev => prev.filter(c => c.id !== courseId));
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Delete failed';
            toast.error(msg);
        } finally {
            setDeletingId(null);
            setConfirmDeleteId(null);
        }
    };

    const courseToDelete = courses.find(c => c.id === confirmDeleteId);

    if (loading) return <div className="text-gray-500 dark:text-gray-400 py-10">Loading courses...</div>;

    return (
        <div>
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Courses</h1>
                <Link
                    to="/instructor/create-course"
                    id="create-course-btn"
                    className="bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-xs"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    New Course
                </Link>
            </div>

            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-xs">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/80">
                            <th className="text-left py-3.5 px-6 text-gray-500 dark:text-gray-400 font-medium">Course</th>
                            <th className="text-left py-3.5 px-6 text-gray-500 dark:text-gray-400 font-medium">Level</th>
                            <th className="text-left py-3.5 px-6 text-gray-500 dark:text-gray-400 font-medium">Earnings</th>
                            <th className="text-left py-3.5 px-6 text-gray-500 dark:text-gray-400 font-medium">Students</th>
                            <th className="text-left py-3.5 px-6 text-gray-500 dark:text-gray-400 font-medium">Status</th>
                            <th className="text-right py-3.5 px-6 text-gray-500 dark:text-gray-400 font-medium">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {courses.map((course) => (
                            <tr key={course.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50/60 dark:hover:bg-gray-800/50 transition-colors">
                                {/* Course info */}
                                <td className="py-4 px-6">
                                    <div className="flex items-center gap-3">
                                        <img
                                            src={course.thumbnail}
                                            alt={course.title}
                                            className="w-14 h-9 rounded-md object-cover shrink-0 border border-gray-100 dark:border-gray-700"
                                        />
                                        <span className="text-gray-800 dark:text-gray-200 font-medium line-clamp-2 max-w-xs">{course.title}</span>
                                    </div>
                                </td>

                                {/* Level */}
                                <td className="py-4 px-6">
                                    <span className="capitalize text-gray-600 dark:text-gray-300">{course.level}</span>
                                </td>

                                {/* Earnings */}
                                <td className="py-4 px-6 text-gray-600 dark:text-gray-300">{formatAmount(course.earnings)}</td>

                                {/* Students */}
                                <td className="py-4 px-6 text-gray-600 dark:text-gray-300">{course.students}</td>

                                {/* Status toggle */}
                                <td className="py-4 px-6">
                                    <div className="flex items-center gap-2.5">
                                        <button
                                            onClick={() => togglePublish(course.id, course.status)}
                                            disabled={togglingId === course.id}
                                            title={course.status === 'published' ? 'Unpublish' : 'Publish'}
                                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors disabled:opacity-50 ${
                                                course.status === 'published' ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-700'
                                            }`}
                                        >
                                            <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                                                course.status === 'published' ? 'translate-x-4' : 'translate-x-0.5'
                                            }`} />
                                        </button>
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[course.status] || STATUS_BADGE.draft}`}>
                                            {course.status === 'published' ? 'Live' : course.status === 'archived' ? 'Archived' : 'Draft'}
                                        </span>
                                    </div>
                                </td>

                                {/* Actions */}
                                <td className="py-4 px-6">
                                    <div className="flex items-center justify-end gap-2">
                                        {/* Edit */}
                                        <button
                                            onClick={() => navigate(`/instructor/courses/${course.id}/edit`)}
                                            id={`edit-course-${course.id}`}
                                            title="Edit course"
                                            className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-gray-800 transition-colors"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
                                            </svg>
                                        </button>

                                        {/* Delete */}
                                        <button
                                            onClick={() => setConfirmDeleteId(course.id)}
                                            id={`delete-course-${course.id}`}
                                            title="Delete course"
                                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-gray-800 transition-colors"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                            </svg>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}

                        {courses.length === 0 && (
                            <tr>
                                <td colSpan={6} className="py-16 text-center text-gray-400 dark:text-gray-500">
                                    <div className="flex flex-col items-center gap-3">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1} className="text-gray-300 dark:text-gray-600">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                                        </svg>
                                        <p>No courses yet. <Link to="/instructor/create-course" className="text-blue-600 dark:text-blue-400 hover:underline">Create your first course</Link></p>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={!!confirmDeleteId}
                onClose={() => setConfirmDeleteId(null)}
                title="Delete Course"
            >
                <div className="space-y-4">
                    <p className="text-gray-600 dark:text-gray-300">
                        Are you sure you want to delete{' '}
                        <span className="font-semibold text-gray-900 dark:text-white">"{courseToDelete?.title}"</span>?
                        This will permanently remove the course and all its sections, lessons, enrollments, and reviews.
                    </p>
                    <p className="text-sm text-red-600 dark:text-red-400 font-medium">This action cannot be undone.</p>

                    <div className="flex gap-3 pt-2">
                        <button
                            onClick={() => confirmDeleteId && handleDelete(confirmDeleteId)}
                            disabled={!!deletingId}
                            id="confirm-delete-btn"
                            className="flex-1 bg-red-600 text-white py-2.5 rounded-lg font-semibold text-sm hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {deletingId ? 'Deleting...' : 'Yes, delete course'}
                        </button>
                        <button
                            onClick={() => setConfirmDeleteId(null)}
                            disabled={!!deletingId}
                            className="flex-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 py-2.5 rounded-lg font-semibold text-sm hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}

export default MyCourses;
