import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Modal } from '../../../components/common';
import { useCurrency } from '@/context/CurrencyContext';

export const getCourseStatusBadge = (course: InstructorCourse) => {
    if (course.isActive === false) {
        return {
            label: 'Suspended by Admin',
            className: 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800',
            tooltip: 'This course has been suspended by platform administrators'
        };
    }

    if (course.status === 'archived') {
        return {
            label: 'Archived',
            className: 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700',
            tooltip: 'This course is archived'
        };
    }

    if (course.status === 'published') {
        if (course.isApproved === true) {
            return {
                label: 'Live',
                className: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800',
                tooltip: 'Live and publicly accessible to students'
            };
        }
        if (course.isApproved === false) {
            return {
                label: 'Rejected',
                className: 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800',
                tooltip: course.rejectionReason ? `Rejected by moderation: ${course.rejectionReason}` : 'Submission rejected by moderation'
            };
        }
        return {
            label: 'Pending Review',
            className: 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800',
            tooltip: 'Submitted for publication — pending administrator review before going live to students'
        };
    }

    if (course.isApproved === false) {
        return {
            label: 'Needs Changes',
            className: 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800',
            tooltip: course.rejectionReason ? `Needs changes: ${course.rejectionReason}` : 'Course rejected by admin, update and resubmit'
        };
    }

    return {
        label: 'Draft',
        className: 'bg-yellow-100 dark:bg-yellow-950/60 text-yellow-700 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-800',
        tooltip: 'Draft — work in progress'
    };
};

export interface InstructorCourse {
    id: string;
    title: string;
    thumbnail: string;
    earnings: number;
    students: number;
    status: string;
    level: string;
    isActive?: boolean;
    isApproved?: boolean;
    rejectionReason?: string;
}

interface RawInstructorCourse {
    _id: string;
    title: string;
    thumbnailUrl?: string;
    enrollmentCount?: number;
    price?: number;
    status: string;
    level?: string;
    isActive?: boolean;
    isApproved?: boolean;
    rejectionReason?: string;
}

function MyCourses() {
    const navigate = useNavigate();
    const { formatAmount } = useCurrency();
    const [courses, setCourses] = useState<InstructorCourse[]>([]);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
    const [togglingId, setTogglingId] = useState<string | null>(null);
    const [restoringId, setRestoringId] = useState<string | null>(null);
    const [archivingId, setArchivingId] = useState<string | null>(null);

    const handleArchive = async (courseId: string) => {
        const target = courses.find((c) => c.id === courseId);
        if (target?.isActive === false) {
            toast.error('This course has been suspended by an administrator and cannot be modified');
            return;
        }
        setArchivingId(courseId);
        try {
            const res = await api.patch<{ message?: string; course?: RawInstructorCourse }>(`/courses/${courseId}/archive`);
            setCourses((prev) =>
                prev.map((c) => (c.id === courseId ? { ...c, status: 'archived' } : c))
            );
            toast.success(res.data?.message || 'Course archived');
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to archive course';
            toast.error(msg);
        } finally {
            setArchivingId(null);
        }
    };

    const handleRestore = async (courseId: string) => {
        const target = courses.find((c) => c.id === courseId);
        if (target?.isActive === false) {
            toast.error('This course has been suspended by an administrator');
            return;
        }
        setRestoringId(courseId);
        try {
            const res = await api.patch<{ message?: string; course?: RawInstructorCourse }>(`/courses/${courseId}/unarchive`);
            const updated = res.data?.course;
            const newStatus = updated?.status || 'draft';
            setCourses((prev) =>
                prev.map((c) => (c.id === courseId ? {
                    ...c,
                    status: newStatus,
                    isApproved: updated ? updated.isApproved : undefined,
                    rejectionReason: updated ? updated.rejectionReason : undefined,
                } : c))
            );
            toast.success(res.data?.message || (newStatus === 'published' ? 'Course unarchived and published' : 'Course restored to draft'));
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to restore course';
            toast.error(msg);
        } finally {
            setRestoringId(null);
        }
    };

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
                isActive: c.isActive,
                isApproved: c.isApproved,
                rejectionReason: c.rejectionReason,
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
        const target = courses.find((c) => c.id === courseId);
        if (target?.isActive === false) {
            toast.error('This course has been suspended by an administrator and cannot be modified');
            return;
        }
        setTogglingId(courseId);
        try {
            if (currentStatus === 'published') {
                const res = await api.patch<{ message?: string; course?: RawInstructorCourse }>(`/courses/${courseId}/unpublish`);
                const updatedCourse = res.data?.course;
                toast.success(res.data?.message || 'Course moved to draft');
                setCourses(prev => prev.map(c =>
                    c.id === courseId ? {
                        ...c,
                        status: 'draft',
                        isApproved: updatedCourse ? updatedCourse.isApproved : undefined,
                        rejectionReason: updatedCourse ? updatedCourse.rejectionReason : undefined,
                    } : c
                ));
            } else {
                const res = await api.patch<{ message?: string; course?: RawInstructorCourse }>(`/courses/${courseId}/publish`);
                const updatedCourse = res.data?.course;
                const msg = res.data?.message || 'Course submitted for review';
                toast.success(msg);
                setCourses(prev => prev.map(c =>
                    c.id === courseId
                        ? {
                              ...c,
                              status: updatedCourse?.status || 'published',
                              isApproved: updatedCourse ? updatedCourse.isApproved : undefined,
                              rejectionReason: updatedCourse ? updatedCourse.rejectionReason : undefined,
                          }
                        : c
                ));
            }
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Action failed';
            toast.error(msg);
        } finally {
            setTogglingId(null);
        }
    };

    const handleResubmit = async (courseId: string) => {
        const target = courses.find((c) => c.id === courseId);
        if (target?.isActive === false) {
            toast.error('This course has been suspended by an administrator and cannot be resubmitted');
            return;
        }
        setTogglingId(courseId);
        try {
            const res = await api.patch<{ message?: string; course?: RawInstructorCourse }>(`/courses/${courseId}/publish`);
            const updatedCourse = res.data?.course;
            const msg = res.data?.message || 'Course resubmitted for moderation';
            toast.success(msg);
            setCourses(prev => prev.map(c =>
                c.id === courseId
                    ? {
                          ...c,
                          status: 'published',
                          isApproved: updatedCourse ? updatedCourse.isApproved : undefined,
                          rejectionReason: updatedCourse ? updatedCourse.rejectionReason : undefined,
                      }
                    : c
            ));
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to resubmit course';
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

                                {/* Status & Action */}
                                <td className="py-4 px-6">
                                    {course.isActive === false && (
                                        <div className="flex items-center gap-2.5">
                                            <button
                                                type="button"
                                                disabled
                                                title="This course has been deactivated by platform administrators and cannot be published or toggled."
                                                className="relative inline-flex h-5 w-9 items-center rounded-full transition-colors bg-gray-300 dark:bg-gray-700 opacity-50 cursor-not-allowed shadow-2xs"
                                            >
                                                <span className="inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-xs translate-x-0.5 transition-transform" />
                                            </button>
                                            <span
                                                className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
                                                title="Suspended by platform administration — this course is deactivated and hidden from public catalogs"
                                            >
                                                Suspended by Admin
                                            </span>
                                        </div>
                                    )}

                                    {course.isActive !== false && course.status === 'published' && course.isApproved === true && (
                                        <div className="flex items-center gap-2.5">
                                            <button
                                                type="button"
                                                onClick={() => togglePublish(course.id, course.status)}
                                                disabled={togglingId === course.id}
                                                title="Course is live. Click to unpublish to Draft."
                                                className="relative inline-flex h-5 w-9 items-center rounded-full transition-colors bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 cursor-pointer shadow-2xs"
                                            >
                                                <span className="inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-xs translate-x-4 transition-transform" />
                                            </button>
                                            <span
                                                className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                                                title="Live and publicly accessible to students"
                                            >
                                                Live
                                            </span>
                                        </div>
                                    )}

                                    {course.isActive !== false && course.status === 'published' && course.isApproved === undefined && (
                                        <div className="flex items-center gap-2">
                                            <span
                                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                                                title="Course has been submitted and is waiting for administrator approval before going live to students"
                                            >
                                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                                Under Review
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => togglePublish(course.id, 'published')}
                                                disabled={togglingId === course.id}
                                                title="Withdraw submission back to Draft to make changes"
                                                className="text-[11px] font-medium text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 underline decoration-dotted cursor-pointer"
                                            >
                                                Withdraw
                                            </button>
                                        </div>
                                    )}

                                    {course.isActive !== false && course.status === 'draft' && course.isApproved !== false && (
                                        <div className="flex items-center gap-2.5">
                                            <button
                                                type="button"
                                                onClick={() => togglePublish(course.id, course.status)}
                                                disabled={togglingId === course.id}
                                                title="Click to publish and submit for review"
                                                className="relative inline-flex h-5 w-9 items-center rounded-full transition-colors bg-gray-300 dark:bg-gray-700 hover:bg-gray-400 disabled:opacity-50 cursor-pointer shadow-2xs"
                                            >
                                                <span className="inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-xs translate-x-0.5 transition-transform" />
                                            </button>
                                            <span
                                                className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-950/60 text-yellow-700 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-800"
                                                title="Draft — offline and work in progress"
                                            >
                                                Draft
                                            </span>
                                        </div>
                                    )}

                                    {course.isActive !== false && course.isApproved === false && (
                                        <div className="flex items-center gap-2">
                                            <span
                                                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
                                                title={course.rejectionReason ? `Reason: ${course.rejectionReason}` : 'Moderation rejected this submission. Edit and resubmit.'}
                                            >
                                                Needs Changes
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => handleResubmit(course.id)}
                                                disabled={togglingId === course.id}
                                                title="Resubmit this course for moderation review"
                                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-2xs cursor-pointer"
                                            >
                                                {togglingId === course.id ? (
                                                    <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                ) : (
                                                    <span>Resubmit</span>
                                                )}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => navigate(`/instructor/courses/${course.id}/edit`)}
                                                className="text-[11px] font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 underline decoration-dotted cursor-pointer"
                                            >
                                                Edit
                                            </button>
                                        </div>
                                    )}

                                    {course.status === 'archived' && (
                                        <div className="flex items-center gap-2">
                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
                                                Archived
                                            </span>
                                            {course.isActive !== false && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleRestore(course.id)}
                                                    disabled={restoringId === course.id}
                                                    title="Restore course to active catalog / draft"
                                                    className="text-[11px] font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline decoration-dotted cursor-pointer disabled:opacity-50"
                                                >
                                                    {restoringId === course.id ? 'Restoring...' : 'Unarchive'}
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </td>

                                {/* Actions */}
                                <td className="py-4 px-6">
                                    <div className="flex items-center justify-end gap-2">
                                        {/* Restore archived course */}
                                        {course.status === 'archived' && (
                                            <button
                                                onClick={() => handleRestore(course.id)}
                                                disabled={restoringId === course.id || course.isActive === false}
                                                id={`restore-course-${course.id}`}
                                                title={course.isActive === false ? 'This course has been suspended by an administrator' : 'Unarchive and restore course'}
                                                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors cursor-pointer disabled:opacity-50 shadow-2xs"
                                            >
                                                {restoringId === course.id ? (
                                                    <>
                                                        <span className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin inline-block" />
                                                        <span>Restoring...</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
                                                        </svg>
                                                        <span>Restore</span>
                                                    </>
                                                )}
                                            </button>
                                        )}

                                        {/* Archive course */}
                                        {course.isActive !== false && course.status !== 'archived' && (
                                            <button
                                                onClick={() => handleArchive(course.id)}
                                                disabled={archivingId === course.id}
                                                id={`archive-course-${course.id}`}
                                                title="Archive course"
                                                className="p-1.5 rounded-lg text-gray-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-gray-800 transition-colors cursor-pointer disabled:opacity-50"
                                            >
                                                {archivingId === course.id ? (
                                                    <span className="w-4 h-4 border-2 border-amber-600 border-t-transparent rounded-full animate-spin inline-block" />
                                                ) : (
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0l-3-3m3 3l3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                                                    </svg>
                                                )}
                                            </button>
                                        )}

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
