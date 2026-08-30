import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { toast } from 'react-toastify';
import { LessonQuiz } from '@/components/LessonQuiz';
import { CourseAnnouncements } from '@/features/student/components/CourseAnnouncements';
import { LessonDiscussion } from '@/features/student/components/LessonDiscussion';
import { LessonNotes } from '@/features/student/components/LessonNotes';
import {
    fetchLessonBookmarkStatus,
    toggleLessonBookmark,
    fetchCourseBookmarks,
} from '@/features/student/api/bookmarks';

function LessonViewer() {
    const { courseId, lessonId } = useParams();
    const navigate = useNavigate();
    
    const [course, setCourse] = useState<any>(null);
    const [sections, setSections] = useState<any[]>([]);
    const [lessons, setLessons] = useState<any[]>([]);
    const [items, setItems] = useState<any[]>([]);
    const [completedLessonIds, setCompletedLessonIds] = useState<string[]>([]);
    const [bookmarkedLessonIds, setBookmarkedLessonIds] = useState<string[]>([]);
    const [isBookmarked, setIsBookmarked] = useState(false);
    const [togglingBookmark, setTogglingBookmark] = useState(false);
    const [progressPercentage, setProgressPercentage] = useState<number>(0);
    const [quizPassed, setQuizPassed] = useState(false);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'lesson' | 'notes' | 'discussion' | 'announcements'>('lesson');

    // Fetch course structure only once per course visit
    useEffect(() => {
        const fetchCourse = async () => {
            setLoading(true);
            try {
                const courseRes = await api.get(`/courses/${courseId}`);
                const c = courseRes.data.course;
                setCourse(c);
                setSections(c.sections || []);
                setLessons(c.lessons || []);
                setItems(c.lessonItems || []);
            } catch {
                toast.error('Failed to load course content');
            } finally {
                setLoading(false);
            }
        };

        fetchCourse();
    }, [courseId]);

    // Fetch course bookmarks
    const loadCourseBookmarks = useCallback(async () => {
        if (!courseId) return;
        try {
            const bookmarks = await fetchCourseBookmarks(courseId);
            setBookmarkedLessonIds(bookmarks.map((b) => b.lesson?._id || (b.lesson as any)));
        } catch {
            // Silently fail for non-enrolled
        }
    }, [courseId]);

    useEffect(() => {
        loadCourseBookmarks();
    }, [loadCourseBookmarks]);

    // Fetch active lesson bookmark status
    useEffect(() => {
        if (!lessonId) return;
        let isMounted = true;
        fetchLessonBookmarkStatus(lessonId)
            .then((status) => {
                if (isMounted) setIsBookmarked(status);
            })
            .catch(() => {});
        return () => {
            isMounted = false;
        };
    }, [lessonId]);

    // Fetch progress and handle lesson redirect whenever lesson context changes
    useEffect(() => {
        if (!courseId) return;

        const fetchProgress = async () => {
            try {
                const progRes = await api.get(`/me/courses/${courseId}/progress`);
                const p = progRes.data;
                setCompletedLessonIds(p.completedLessonIds || []);
                setProgressPercentage(p.progressPercentage || 0);

                if (!lessonId) {
                    if (p.lastLessonId) {
                        navigate(`/learn/${courseId}/${p.lastLessonId}`, { replace: true });
                    }
                }
            } catch {
                // Progress fetch failing silently is acceptable
            }
        };

        fetchProgress();
    }, [courseId, lessonId, navigate]);

    // Once course loads and no lessonId is set, navigate to the first lesson
    useEffect(() => {
        if (!lessonId && lessons.length > 0) {
            navigate(`/learn/${courseId}/${lessons[0]._id}`, { replace: true });
        }
    }, [courseId, lessonId, lessons, navigate]);

    useEffect(() => {
        setQuizPassed(false);
    }, [lessonId]);

    const activeLesson = lessons.find(l => l._id === lessonId);
    const activeItems = activeLesson ? items.filter(i => i.lesson === activeLesson._id) : [];

    const lessonIndex = lessons.findIndex(l => l._id === lessonId);
    const nextLesson = lessons[lessonIndex + 1];
    const prevLesson = lessons[lessonIndex - 1];

    const handleProgress = async () => {
        try {
            await api.post(`/lessons/${lessonId}/progress`, { completed: true });
            
            const progRes = await api.get(`/me/courses/${courseId}/progress`);
            const p = progRes.data;
            setCompletedLessonIds(p.completedLessonIds || []);
            setProgressPercentage(p.progressPercentage || 0);

            if (p.isCompleted || p.progressPercentage === 100) {
                toast.success('🎉 Congratulations! You completed this course! Your certificate is ready under My Certificates.', {
                    autoClose: 8000,
                });
            } else {
                toast.success('Progress saved!');
            }
        } catch {
            toast.error('Failed to save progress');
        }
    };

    const handleToggleBookmark = async () => {
        if (!lessonId || togglingBookmark) return;
        try {
            setTogglingBookmark(true);
            const res = await toggleLessonBookmark(lessonId);
            setIsBookmarked(res.bookmarked);
            if (res.bookmarked) {
                setBookmarkedLessonIds((prev) => Array.from(new Set([...prev, lessonId])));
                toast.success('Lesson bookmarked!');
            } else {
                setBookmarkedLessonIds((prev) => prev.filter((id) => id !== lessonId));
                toast.info('Bookmark removed');
            }
        } catch {
            toast.error('Failed to update bookmark');
        } finally {
            setTogglingBookmark(false);
        }
    };

    if (loading) return <div className="text-center py-20 text-gray-500">Loading lesson...</div>;
    if (!course) return <div className="text-center py-20 text-red-500">Course not found</div>;

    return (
        <div className="flex flex-col md:flex-row h-[calc(100vh-64px)] overflow-hidden bg-gray-50">
            {/* Sidebar (Curriculum) */}
            <div className="w-full md:w-80 bg-white border-r border-gray-200 overflow-y-auto flex-shrink-0">
                <div className="p-6 border-b border-gray-100">
                    <Link to={`/courses/${courseId}`} className="text-sm font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1 mb-2">
                        ← Back to Course Info
                    </Link>
                    <h2 className="text-lg font-bold text-gray-900 leading-tight mb-4">{course.title}</h2>
                    
                    {/* Progress Bar UI */}
                    <div className="text-sm text-gray-600 mb-1 flex justify-between">
                        <span>Course Progress</span>
                        <span className="font-bold">{progressPercentage}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-blue-600 h-2 rounded-full transition-all duration-300" style={{ width: `${progressPercentage}%` }}></div>
                    </div>
                </div>
                
                <div className="flex flex-col">
                    {sections.map((sec, sIdx) => {
                        const secLessons = lessons.filter(l => l.section === sec._id);
                        return (
                            <div key={sec._id} className="border-b border-gray-100">
                                <div className="bg-gray-50 px-6 py-4 font-bold text-gray-800 text-sm">
                                    Section {sIdx + 1}: {sec.title}
                                </div>
                                <div className="flex flex-col">
                                    {secLessons.map((les, lIdx) => {
                                        const isActive = les._id === lessonId;
                                        const isCompleted = completedLessonIds.includes(les._id);
                                        const isLessonBookmarked = bookmarkedLessonIds.includes(les._id);

                                        return (
                                            <Link 
                                                key={les._id} 
                                                to={`/learn/${courseId}/${les._id}`}
                                                className={`px-6 py-3 text-sm transition-colors border-l-4 ${isActive ? 'bg-blue-50 border-blue-600 text-blue-700 font-medium' : 'border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
                                            >
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="flex items-start gap-2">
                                                        <span className="text-gray-400 font-mono mt-0.5">{lIdx + 1}.</span>
                                                        <span>{les.title}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1 shrink-0">
                                                        {isLessonBookmarked && (
                                                            <span title="Bookmarked" className="text-amber-500 text-xs">🔖</span>
                                                        )}
                                                        {isCompleted && (
                                                            <span className="text-green-500 font-bold">✓</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </Link>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto p-6 md:p-10">
                {!activeLesson ? (
                    <div className="flex flex-col items-center justify-center h-full text-center max-w-md mx-auto">
                        <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4">
                            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Select a lesson</h3>
                        <p className="text-gray-500">Choose a lesson from the curriculum sidebar to continue your learning journey.</p>
                    </div>
                ) : (
                    <div className="max-w-4xl mx-auto">
                        {/* Tab bar */}
                        <div className="flex items-center gap-1 mb-6 border-b border-gray-200 overflow-x-auto">
                            <button
                                onClick={() => setActiveTab('lesson')}
                                className={`px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors whitespace-nowrap ${
                                    activeTab === 'lesson'
                                        ? 'border-blue-600 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                Lesson Content
                            </button>
                            <button
                                onClick={() => setActiveTab('notes')}
                                className={`px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                                    activeTab === 'notes'
                                        ? 'border-blue-600 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                                </svg>
                                Notes
                            </button>
                            <button
                                onClick={() => setActiveTab('discussion')}
                                className={`px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                                    activeTab === 'discussion'
                                        ? 'border-blue-600 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                                </svg>
                                Discussion
                            </button>
                            <button
                                onClick={() => setActiveTab('announcements')}
                                className={`px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                                    activeTab === 'announcements'
                                        ? 'border-blue-600 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 110-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.461a20.845 20.845 0 01-1.44-4.282m3.102.069a18.03 18.03 0 01-.59-4.59c0-1.586.205-3.124.59-4.59m0 9.18a23.848 23.848 0 018.835 2.535M10.34 6.66a23.847 23.847 0 008.835-2.535m0 0A23.74 23.74 0 0018.795 3m.38 1.125a23.91 23.91 0 011.014 5.395m-1.014 8.855c-.118.38-.245.754-.38 1.125m.38-1.125a23.91 23.91 0 001.014-5.395m0-3.46c.495.413.811 1.035.811 1.73 0 .695-.316 1.317-.811 1.73m0-3.46a24.347 24.347 0 010 3.46" />
                                </svg>
                                Announcements
                            </button>
                        </div>

                        {/* Notes tab */}
                        {activeTab === 'notes' && (
                            <LessonNotes
                                courseId={courseId!}
                                lessonId={lessonId!}
                                lessonTitle={activeLesson.title}
                                onNavigateLesson={(targetId) => navigate(`/learn/${courseId}/${targetId}`)}
                            />
                        )}

                        {/* Discussion tab */}
                        {activeTab === 'discussion' && (
                            <LessonDiscussion
                                lessonId={lessonId!}
                                courseInstructorId={course?.instructor?._id || course?.instructor}
                            />
                        )}

                        {/* Announcements tab */}
                        {activeTab === 'announcements' && (
                            <CourseAnnouncements courseId={courseId!} />
                        )}

                        {/* Lesson Content tab */}
                        {activeTab === 'lesson' && (
                        <div className="border border-gray-200 bg-white shadow-sm rounded-2xl overflow-hidden">
                            <div className="p-6 md:p-8 bg-gray-900 text-white flex flex-wrap justify-between items-center gap-4">
                                <div>
                                    <span className="text-xs text-blue-400 font-semibold tracking-wider uppercase">
                                        Lesson {lessonIndex + 1}
                                    </span>
                                    <h1 className="text-2xl font-bold">{activeLesson.title}</h1>
                                </div>

                                <div className="flex items-center gap-3">
                                    {/* Bookmark Toggle Button */}
                                    <button
                                        onClick={handleToggleBookmark}
                                        disabled={togglingBookmark}
                                        title={isBookmarked ? 'Remove bookmark' : 'Bookmark this lesson'}
                                        className={`px-3.5 py-2 rounded-xl border transition-all flex items-center gap-1.5 text-xs font-semibold ${
                                            isBookmarked
                                                ? 'bg-amber-500/20 border-amber-400 text-amber-300 hover:bg-amber-500/30'
                                                : 'bg-white/10 border-white/20 text-gray-200 hover:bg-white/20'
                                        }`}
                                    >
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            viewBox="0 0 24 24"
                                            fill={isBookmarked ? 'currentColor' : 'none'}
                                            stroke="currentColor"
                                            strokeWidth={isBookmarked ? 0 : 2}
                                            className="w-4 h-4 text-amber-400"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z"
                                            />
                                        </svg>
                                        <span>{isBookmarked ? 'Bookmarked' : 'Bookmark'}</span>
                                    </button>

                                    <button
                                        onClick={handleProgress}
                                        disabled={!quizPassed && activeLesson.type === 'quiz'}
                                        className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
                                    >
                                        Mark as Complete
                                    </button>
                                </div>
                            </div>
                        
                            <div className="p-6 md:p-8 space-y-8">
                                {activeItems.length === 0 ? (
                                    <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-xl">
                                        <p className="text-gray-500">No content available for this lesson yet.</p>
                                    </div>
                                ) : (
                                    activeItems.map((item) => {
                                        const content = item.content || {};

                                        if (item.type === 'video') {
                                            const url = content.url || '';
                                            return (
                                                <div key={item._id} className="item-content">
                                                    <div className="aspect-video bg-black rounded-xl overflow-hidden mb-4 relative drop-shadow-md">
                                                        <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                                                            {url.includes('youtube.com') || url.includes('youtu.be') ? (
                                                                <iframe
                                                                    className="w-full h-full"
                                                                    src={url.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')}
                                                                    title="Video player"
                                                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                                    allowFullScreen>
                                                                </iframe>
                                                            ) : (
                                                                <video controls className="w-full h-full">
                                                                    <source src={url} />
                                                                </video>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        } else if (item.type === 'pdf') {
                                            const url = content.url || '';
                                            return (
                                                <div key={item._id} className="item-content">
                                                    <div className="bg-gray-50 border border-gray-200 rounded-xl overflow-hidden">
                                                        <div className="flex items-center gap-3 px-5 py-3 border-b border-gray-200 bg-white">
                                                            <span className="text-red-500 text-xl">📄</span>
                                                            <span className="font-semibold text-gray-700 text-sm">PDF Resource</span>
                                                            <a href={url} target="_blank" rel="noopener noreferrer" className="ml-auto text-sm text-blue-600 hover:underline font-medium">Open in new tab ↗</a>
                                                        </div>
                                                        <iframe src={url} className="w-full" style={{ height: '600px' }} title="PDF viewer" />
                                                    </div>
                                                </div>
                                            );
                                        } else if (item.type === 'link') {
                                            const url = content.url || '';
                                            return (
                                                <div key={item._id} className="item-content">
                                                    <a
                                                        href={url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex items-center gap-4 bg-blue-50 border border-blue-200 rounded-xl p-5 hover:bg-blue-100 transition-colors group"
                                                    >
                                                        <div className="w-10 h-10 bg-blue-600 text-white rounded-lg flex items-center justify-center shrink-0 text-lg group-hover:bg-blue-700 transition-colors">
                                                            🔗
                                                        </div>
                                                        <div className="overflow-hidden">
                                                            <p className="font-semibold text-blue-700 text-sm">External Resource</p>
                                                            <p className="text-blue-500 text-xs truncate">{url}</p>
                                                        </div>
                                                        <span className="ml-auto text-blue-400 text-lg shrink-0">↗</span>
                                                    </a>
                                                </div>
                                            );
                                        } else {
                                            return (
                                                <div key={item._id} className="item-content">
                                                    <div className="prose max-w-none text-gray-700 bg-gray-50 p-6 rounded-xl border border-gray-100 whitespace-pre-wrap">
                                                        {content.text}
                                                    </div>
                                                </div>
                                            );
                                        }
                                    })
                                )}

                                {/* Quiz - renders only if lesson has a quiz */}
                                <LessonQuiz
                                    lessonId={lessonId!}
                                    onQuizPassed={() => setQuizPassed(true)}
                                />

                                {/* Navigation Buttons */}
                                <div className="flex justify-between mt-10 pt-6 border-t border-gray-100">
                                    {prevLesson ? (
                                        <button
                                            onClick={() => navigate(`/learn/${courseId}/${prevLesson._id}`)}
                                            className="flex items-center gap-2 text-gray-600 hover:text-blue-600 font-medium transition-colors"
                                        >
                                            ← Previous Lesson
                                        </button>
                                    ) : <div />}

                                    {nextLesson && (
                                        <button
                                            onClick={() => navigate(`/learn/${courseId}/${nextLesson._id}`)}
                                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-bold shadow-md hover:shadow-lg transition-all"
                                        >
                                            Next Lesson →
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                        )}
                    </div>
                )}

            </div>
        </div>
    );
}

export default LessonViewer;
