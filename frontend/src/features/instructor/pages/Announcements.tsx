import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { toast } from 'react-toastify';
import {
    fetchAnnouncements,
    createAnnouncement,
    deleteAnnouncement,
    type Announcement,
} from '../api/announcements';

interface Course {
    _id: string;
    title: string;
}

function Announcements() {
    const [courses, setCourses] = useState<Course[]>([]);
    const [selectedCourseId, setSelectedCourseId] = useState('');
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [loadingCourses, setLoadingCourses] = useState(true);
    const [loadingAnnouncements, setLoadingAnnouncements] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    // Load instructor's courses once on mount
    useEffect(() => {
        const load = async () => {
            try {
                const res = await api.get('/courses?mine=true');
                const list: Course[] = res.data.courses ?? [];
                setCourses(list);
                if (list.length > 0) {
                    setSelectedCourseId(list[0]._id);
                }
            } catch {
                toast.error('Failed to load your courses');
            } finally {
                setLoadingCourses(false);
            }
        };
        load();
    }, []);

    // Load announcements whenever selected course changes
    useEffect(() => {
        if (!selectedCourseId) return;
        const load = async () => {
            setLoadingAnnouncements(true);
            try {
                const data = await fetchAnnouncements(selectedCourseId);
                setAnnouncements(data);
            } catch {
                toast.error('Failed to load announcements');
            } finally {
                setLoadingAnnouncements(false);
            }
        };
        load();
    }, [selectedCourseId]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCourseId) return;

        setSubmitting(true);
        try {
            const created = await createAnnouncement(selectedCourseId, { title, body });
            setAnnouncements((prev) => [created, ...prev]);
            setTitle('');
            setBody('');
            toast.success('Announcement posted!');
        } catch {
            toast.error('Failed to post announcement');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (announcementId: string) => {
        if (!selectedCourseId) return;
        setDeletingId(announcementId);
        try {
            await deleteAnnouncement(selectedCourseId, announcementId);
            setAnnouncements((prev) => prev.filter((a) => a._id !== announcementId));
            toast.success('Announcement deleted');
        } catch {
            toast.error('Failed to delete announcement');
        } finally {
            setDeletingId(null);
        }
    };

    if (loadingCourses) {
        return <div className="text-gray-500 dark:text-gray-400 py-10">Loading your courses...</div>;
    }

    return (
        <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">Announcements</h1>

            {courses.length === 0 ? (
                <div className="text-center py-16 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-gray-500 dark:text-gray-400">
                    You don't have any courses yet. Create a course first to post announcements.
                </div>
            ) : (
                <div className="space-y-8">
                    {/* Course selector */}
                    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-xs">
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Select Course
                        </label>
                        <select
                            value={selectedCourseId}
                            onChange={(e) => setSelectedCourseId(e.target.value)}
                            className="w-full max-w-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            {courses.map((c) => (
                                <option key={c._id} value={c._id} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                                    {c.title}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Post new announcement */}
                    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-xs">
                        <h2 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-4">
                            Post New Announcement
                        </h2>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Title
                                </label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="e.g. New resource added for Week 3"
                                    required
                                    minLength={3}
                                    maxLength={140}
                                    className="w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Message
                                </label>
                                <textarea
                                    value={body}
                                    onChange={(e) => setBody(e.target.value)}
                                    placeholder="Write your announcement here..."
                                    required
                                    minLength={10}
                                    rows={4}
                                    className="w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
                            >
                                {submitting ? 'Posting...' : 'Post Announcement'}
                            </button>
                        </form>
                    </div>

                    {/* Existing announcements */}
                    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-xs">
                        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
                            <h2 className="text-base font-semibold text-gray-800 dark:text-gray-200">
                                Posted Announcements
                                {announcements.length > 0 && (
                                    <span className="ml-2 text-xs font-medium text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">
                                        {announcements.length}
                                    </span>
                                )}
                            </h2>
                        </div>

                        {loadingAnnouncements ? (
                            <div className="py-10 text-center text-gray-400 dark:text-gray-500 text-sm">
                                Loading announcements...
                            </div>
                        ) : announcements.length === 0 ? (
                            <div className="py-10 text-center text-gray-400 dark:text-gray-500 text-sm">
                                No announcements yet for this course.
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100 dark:divide-gray-800">
                                {announcements.map((ann) => (
                                    <div
                                        key={ann._id}
                                        className="px-6 py-5 flex items-start justify-between gap-4 hover:bg-gray-50/70 dark:hover:bg-gray-800/50 transition-colors"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">
                                                {ann.title}
                                            </p>
                                            <p className="text-gray-600 dark:text-gray-300 text-sm mt-1 whitespace-pre-line leading-relaxed">
                                                {ann.body}
                                            </p>
                                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                                                {new Date(ann.createdAt).toLocaleDateString('en-IN', {
                                                    day: 'numeric',
                                                    month: 'long',
                                                    year: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => handleDelete(ann._id)}
                                            disabled={deletingId === ann._id}
                                            title="Delete announcement"
                                            className="shrink-0 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors disabled:opacity-40"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                            </svg>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default Announcements;
