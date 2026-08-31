import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { toast } from 'react-toastify';
import { LessonQuiz } from '@/components/LessonQuiz';
import { CourseAnnouncements } from '@/features/student/components/CourseAnnouncements';
import { LessonDiscussion } from '@/features/student/components/LessonDiscussion';
import { LessonNotes } from '@/features/student/components/LessonNotes';
import CourseAssignmentsTab from '@/features/student/components/CourseAssignmentsTab';
import {
    fetchLessonBookmarkStatus,
    toggleLessonBookmark,
    fetchCourseBookmarks,
} from '@/features/student/api/bookmarks';
import { MarkdownRenderer } from '@components/common';
import {
    AcademicCapIcon,
    BookmarkIcon,
    CheckBadgeIcon,
    CheckIcon,
    DocumentTextIcon,
    LinkIcon,
    ArrowLeftIcon,
    ArrowRightIcon,
    StarIcon,
    XMarkIcon,
    Bars3Icon,
} from '@heroicons/react/20/solid';

function getEmbedVideoUrl(rawUrl: string): string {
    if (!rawUrl) return '';
    try {
        const parsed = new URL(rawUrl);
        if (parsed.hostname.includes('youtube.com')) {
            const videoId = parsed.searchParams.get('v');
            if (videoId) return `https://www.youtube.com/embed/${videoId}`;
            if (parsed.pathname.startsWith('/embed/')) return rawUrl;
        } else if (parsed.hostname === 'youtu.be') {
            const videoId = parsed.pathname.slice(1).split('?')[0];
            if (videoId) return `https://www.youtube.com/embed/${videoId}`;
        } else if (parsed.hostname.includes('vimeo.com')) {
            const videoId = parsed.pathname.replace(/\D/g, '');
            if (videoId) return `https://player.vimeo.com/video/${videoId}`;
        }
    } catch {
        // Fallback for relative or non-URL string
    }
    return rawUrl;
}

interface ViewerLessonItem {
    _id: string;
    lesson: string;
    type: 'video' | 'pdf' | 'link' | 'text' | string;
    content: {
        text?: string;
        url?: string;
    };
    order?: number;
}

interface ViewerLesson {
    _id: string;
    title: string;
    durationMinutes?: number;
    order?: number;
    section?: string;
    type?: string;
}

interface ViewerSection {
    _id: string;
    title: string;
    order?: number;
}

interface ViewerCourse {
    _id: string;
    title: string;
    instructor?: { _id: string; name: string } | string;
    sections?: ViewerSection[];
    lessons?: ViewerLesson[];
    lessonItems?: ViewerLessonItem[];
}

function LessonViewer() {
    const { courseId, lessonId } = useParams();
    const navigate = useNavigate();
    
    const [course, setCourse] = useState<ViewerCourse | null>(null);
    const [sections, setSections] = useState<ViewerSection[]>([]);
    const [lessons, setLessons] = useState<ViewerLesson[]>([]);
    const [items, setItems] = useState<ViewerLessonItem[]>([]);
    const [completedLessonIds, setCompletedLessonIds] = useState<string[]>([]);
    const [bookmarkedLessonIds, setBookmarkedLessonIds] = useState<string[]>([]);
    const [isBookmarked, setIsBookmarked] = useState(false);
    const [togglingBookmark, setTogglingBookmark] = useState(false);
    const [progressPercentage, setProgressPercentage] = useState<number>(0);
    const [quizPassed, setQuizPassed] = useState(false);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'lesson' | 'notes' | 'discussion' | 'announcements' | 'assignments'>('lesson');
    const [showCompletionModal, setShowCompletionModal] = useState(false);
    const [showMobileSidebar, setShowMobileSidebar] = useState(false);

    // Fetch course structure only once per course visit
    useEffect(() => {
        const fetchCourse = async () => {
            setLoading(true);
            try {
                const courseRes = await api.get<{ course: ViewerCourse }>(`/courses/${courseId}`);
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
            setBookmarkedLessonIds(
                bookmarks.map((b) => (typeof b.lesson === 'object' && b.lesson?._id ? b.lesson._id : String(b.lesson)))
            );
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

    const remainingLessons = lessons.filter(l => !completedLessonIds.includes(l._id));
    const remainingMinutes = remainingLessons.reduce((acc, l) => acc + (l.durationMinutes || 10), 0);

    const handleProgress = async () => {
        try {
            await api.post(`/lessons/${lessonId}/progress`, { completed: true });
            
            const progRes = await api.get(`/me/courses/${courseId}/progress`);
            const p = progRes.data;
            setCompletedLessonIds(p.completedLessonIds || []);
            setProgressPercentage(p.progressPercentage || 0);

            if (p.isCompleted || p.progressPercentage === 100) {
                setShowCompletionModal(true);
            } else {
                toast.success('Lesson marked as completed.');
                if (nextLesson) {
                    navigate(`/learn/${courseId}/${nextLesson._id}`);
                }
            }
        } catch (error: any) {
            toast.error(error?.response?.data?.message || 'Failed to save progress');
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
                toast.success('Lesson bookmarked');
            } else {
                setBookmarkedLessonIds((prev) => prev.filter((id) => id !== lessonId));
                toast.info('Bookmark removed');
            }
        } catch (error: any) {
            toast.error(error?.response?.data?.message || 'Failed to update bookmark');
        } finally {
            setTogglingBookmark(false);
        }
    };

    if (loading) return <div className="text-center py-20 text-xs text-slate-500 dark:text-slate-400">Loading lesson...</div>;
    if (!course) return <div className="text-center py-20 text-xs text-rose-500">Course not found</div>;

    return (
        <div className="flex flex-col md:flex-row h-[calc(100vh-64px)] overflow-hidden bg-slate-50 dark:bg-slate-900">
            {/* Mobile Header / Toggle Bar */}
            <div className="md:hidden flex items-center justify-between p-3 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                <button
                    onClick={() => setShowMobileSidebar(!showMobileSidebar)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-3 py-1.5 rounded-lg border border-blue-200 dark:border-blue-800 cursor-pointer"
                >
                    {showMobileSidebar ? <XMarkIcon className="w-4 h-4" /> : <Bars3Icon className="w-4 h-4" />}
                    <span>Curriculum ({progressPercentage}%)</span>
                </button>
                <Link to={`/courses/${courseId}`} className="text-xs text-slate-500 dark:text-slate-400 hover:underline flex items-center gap-1">
                    <ArrowLeftIcon className="w-3 h-3" />
                    <span>Course Info</span>
                </Link>
            </div>

            {/* Sidebar (Curriculum) */}
            <div className={`w-full md:w-80 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 overflow-y-auto shrink-0 ${showMobileSidebar ? 'block absolute inset-0 z-40 md:relative' : 'hidden md:block'}`}>
                <div className="p-4 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between mb-2">
                        <Link to={`/courses/${courseId}`} className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
                            <ArrowLeftIcon className="w-3 h-3" />
                            <span>Course Overview</span>
                        </Link>
                        {showMobileSidebar && (
                            <button onClick={() => setShowMobileSidebar(false)} className="md:hidden text-slate-400 p-1 cursor-pointer">
                                <XMarkIcon className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white leading-snug mb-2.5 line-clamp-2">{course.title}</h2>
                    
                    {/* Progress Bar UI */}
                    <div className="text-xs text-slate-500 dark:text-slate-400 mb-1 flex justify-between">
                        <span>{completedLessonIds.length} of {lessons.length} lessons</span>
                        <span className="font-semibold text-blue-600 dark:text-blue-400">{progressPercentage}%</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 mb-1.5 overflow-hidden">
                        <div className="bg-blue-600 h-1.5 rounded-full transition-all duration-300" style={{ width: `${progressPercentage}%` }}></div>
                    </div>
                    {remainingMinutes > 0 && (
                        <p className="text-[10px] text-slate-400">~{remainingMinutes} min remaining</p>
                    )}
                </div>
                
                <div className="flex flex-col">
                    {sections.map((sec, sIdx) => {
                        const secLessons = lessons.filter(l => l.section === sec._id);
                        return (
                            <div key={sec._id} className="border-b border-slate-100 dark:border-slate-800">
                                <div className="bg-slate-50 dark:bg-slate-850 px-4 py-2.5 font-semibold text-slate-700 dark:text-slate-300 text-xs">
                                    Section {sIdx + 1}: {sec.title.replace(/^Section\s*\d+\s*:\s*/i, '')}
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
                                                onClick={() => setShowMobileSidebar(false)}
                                                className={`px-4 py-2.5 text-xs transition-colors border-l-2 ${
                                                    isActive 
                                                        ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-600 text-blue-700 dark:text-blue-300 font-semibold' 
                                                        : 'border-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
                                                }`}
                                            >
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="flex items-start gap-2">
                                                        <span className="text-slate-400 font-mono text-[11px] mt-0.5">{lIdx + 1}.</span>
                                                        <span className="line-clamp-2">{les.title}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 shrink-0">
                                                        {les.durationMinutes && (
                                                            <span className="text-[10px] text-slate-400">{les.durationMinutes}m</span>
                                                        )}
                                                        {isLessonBookmarked && (
                                                            <BookmarkIcon className="w-3.5 h-3.5 text-amber-500" />
                                                        )}
                                                        {isCompleted && (
                                                            <CheckIcon className="w-3.5 h-3.5 text-emerald-600" />
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
            <div className="flex-1 overflow-y-auto p-6 md:p-8">
                {!activeLesson ? (
                    <div className="flex flex-col items-center justify-center h-full text-center max-w-md mx-auto">
                        <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-3 text-slate-400">
                            <AcademicCapIcon className="w-6 h-6" />
                        </div>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">Select a lesson</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Choose a lesson from the curriculum sidebar to continue your learning.</p>
                    </div>
                ) : (
                    <div className="max-w-4xl mx-auto">
                        {/* Tab bar */}
                        <div className="flex items-center gap-1 mb-6 border-b border-slate-200 dark:border-slate-700 overflow-x-auto">
                            <button
                                onClick={() => setActiveTab('lesson')}
                                className={`px-4 py-2.5 text-xs font-semibold border-b-2 -mb-px transition-colors whitespace-nowrap cursor-pointer ${
                                    activeTab === 'lesson'
                                        ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                                        : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                }`}
                            >
                                Lesson Content
                            </button>
                            <button
                                onClick={() => setActiveTab('notes')}
                                className={`px-4 py-2.5 text-xs font-semibold border-b-2 -mb-px transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                                    activeTab === 'notes'
                                        ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                                        : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                }`}
                            >
                                Notes
                            </button>
                            <button
                                onClick={() => setActiveTab('discussion')}
                                className={`px-4 py-2.5 text-xs font-semibold border-b-2 -mb-px transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                                    activeTab === 'discussion'
                                        ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                                        : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                }`}
                            >
                                Discussion
                            </button>
                            <button
                                onClick={() => setActiveTab('announcements')}
                                className={`px-4 py-2.5 text-xs font-semibold border-b-2 -mb-px transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                                    activeTab === 'announcements'
                                        ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                                        : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                }`}
                            >
                                Announcements
                            </button>
                            <button
                                onClick={() => setActiveTab('assignments')}
                                className={`px-4 py-2.5 text-xs font-semibold border-b-2 -mb-px transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                                    activeTab === 'assignments'
                                        ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                                        : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                }`}
                            >
                                Assignments & Projects
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
                                courseInstructorId={typeof course?.instructor === 'object' ? course.instructor._id : course?.instructor}
                            />
                        )}

                        {/* Announcements tab */}
                        {activeTab === 'announcements' && (
                            <CourseAnnouncements courseId={courseId!} />
                        )}

                        {/* Assignments tab */}
                        {activeTab === 'assignments' && (
                            <CourseAssignmentsTab courseId={courseId!} />
                        )}

                        {/* Lesson Content tab */}
                        {activeTab === 'lesson' && (
                        <div className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs rounded-xl overflow-hidden transition-colors">
                            <div className="p-6 md:p-8 bg-slate-900 text-white flex flex-wrap justify-between items-center gap-4">
                                <div>
                                    <span className="text-xs text-blue-400 font-semibold tracking-wider uppercase">
                                        Lesson {lessonIndex + 1}
                                    </span>
                                    <h1 className="text-xl font-bold">{activeLesson.title}</h1>
                                </div>

                                <div className="flex items-center gap-3">
                                    {/* Bookmark Toggle Button */}
                                    <button
                                        onClick={handleToggleBookmark}
                                        disabled={togglingBookmark}
                                        title={isBookmarked ? 'Remove bookmark' : 'Bookmark this lesson'}
                                        className={`px-3 py-1.5 rounded-lg border transition-colors flex items-center gap-1.5 text-xs font-semibold cursor-pointer ${
                                            isBookmarked
                                                ? 'bg-amber-500/20 border-amber-400 text-amber-300 hover:bg-amber-500/30'
                                                : 'bg-white/10 border-white/20 text-slate-200 hover:bg-white/20'
                                        }`}
                                    >
                                        <BookmarkIcon className="w-3.5 h-3.5 text-amber-400" />
                                        <span>{isBookmarked ? 'Bookmarked' : 'Bookmark'}</span>
                                    </button>

                                    {completedLessonIds.includes(activeLesson._id) ? (
                                        <div className="flex items-center gap-2">
                                            <span className="bg-emerald-500/20 border border-emerald-400 text-emerald-300 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5">
                                                <CheckIcon className="w-3.5 h-3.5 text-emerald-400" />
                                                <span>Completed</span>
                                            </span>
                                            <button
                                                onClick={handleProgress}
                                                className="bg-white/10 hover:bg-white/20 text-slate-200 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                                                title="Mark again to refresh progress"
                                            >
                                                Update
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={handleProgress}
                                            disabled={!quizPassed && activeLesson.type === 'quiz'}
                                            className="bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs cursor-pointer"
                                        >
                                            Mark as Complete
                                        </button>
                                    )}
                                </div>
                            </div>
                        
                            <div className="p-6 md:p-8 space-y-6">
                                {activeItems.length === 0 ? (
                                    <div className="text-center py-10 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                                        <p className="text-xs text-slate-500 dark:text-slate-400">No content available for this lesson yet.</p>
                                    </div>
                                ) : (
                                    activeItems.map((item) => {
                                        const content = item.content || {};

                                        if (item.type === 'video') {
                                            const rawUrl = content.url || '';
                                            const embedUrl = getEmbedVideoUrl(rawUrl);
                                            return (
                                                <div key={item._id} className="item-content">
                                                    <div className="aspect-video bg-black rounded-xl overflow-hidden mb-4 relative drop-shadow-md">
                                                        <div className="absolute inset-0 flex items-center justify-center bg-slate-800">
                                                            {embedUrl.includes('youtube.com') || embedUrl.includes('player.vimeo.com') ? (
                                                                <iframe
                                                                    className="w-full h-full"
                                                                    src={embedUrl}
                                                                    title="Video player"
                                                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                                    allowFullScreen>
                                                                </iframe>
                                                            ) : (
                                                                <video controls className="w-full h-full">
                                                                    <source src={rawUrl} />
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
                                                    <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                                                        <div className="flex items-center gap-2.5 px-4 py-2.5 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                                                            <DocumentTextIcon className="w-4 h-4 text-rose-500" />
                                                            <span className="font-semibold text-slate-700 dark:text-slate-300 text-xs">PDF Resource</span>
                                                            <a href={url} target="_blank" rel="noopener noreferrer" className="ml-auto text-xs text-blue-600 hover:underline font-medium">Open in new tab ↗</a>
                                                        </div>
                                                        <iframe src={url} className="w-full h-[65vh] min-h-[400px] border-0" title="PDF viewer" />
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
                                                        className="flex items-center gap-3.5 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 rounded-xl p-4 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors group"
                                                    >
                                                        <div className="w-9 h-9 bg-blue-600 text-white rounded-lg flex items-center justify-center shrink-0 group-hover:bg-blue-700 transition-colors">
                                                            <LinkIcon className="w-4 h-4" />
                                                        </div>
                                                        <div className="overflow-hidden">
                                                            <p className="font-semibold text-blue-700 text-xs">External Resource</p>
                                                            <p className="text-blue-500 text-[11px] truncate">{url}</p>
                                                        </div>
                                                        <span className="ml-auto text-blue-400 text-sm shrink-0">↗</span>
                                                    </a>
                                                </div>
                                            );
                                        } else {
                                            return (
                                                <div key={item._id} className="item-content">
                                                    <div className="bg-white dark:bg-slate-800/90 p-5 md:p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
                                                        <MarkdownRenderer content={content.text || ''} />
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
                                <div className="flex justify-between items-center mt-10 pt-6 border-t border-slate-100 dark:border-slate-800">
                                    {prevLesson ? (
                                        <button
                                            onClick={() => navigate(`/learn/${courseId}/${prevLesson._id}`)}
                                            className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 font-semibold text-xs transition-colors cursor-pointer"
                                        >
                                            <ArrowLeftIcon className="w-3.5 h-3.5" />
                                            <span>Previous Lesson</span>
                                        </button>
                                    ) : <div />}

                                    {nextLesson && (
                                        <button
                                            onClick={() => navigate(`/learn/${courseId}/${nextLesson._id}`)}
                                            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-semibold shadow-2xs transition-colors text-xs flex items-center gap-1.5 cursor-pointer"
                                        >
                                            <span>Next Lesson</span>
                                            <ArrowRightIcon className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                        )}
                    </div>
                )}

            </div>

            {/* Course Completion Modal Overlay */}
            {showCompletionModal && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-xl p-6 sm:p-8 max-w-md w-full text-center shadow-xl border border-slate-200 dark:border-slate-800 space-y-4">
                        <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto">
                            <CheckBadgeIcon className="w-8 h-8" />
                        </div>
                        <div className="space-y-1">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                                Course Completed!
                            </h2>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                You've mastered <strong className="text-slate-900 dark:text-white">{course?.title}</strong>. Your verifiable certificate has been issued.
                            </p>
                        </div>
                        <div className="space-y-2 pt-2">
                            <Link
                                to="/certificates"
                                className="inline-flex items-center justify-center gap-1.5 w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors shadow-2xs text-xs"
                            >
                                <AcademicCapIcon className="w-4 h-4" />
                                <span>View & Download Certificate</span>
                            </Link>
                            <Link
                                to={`/courses/${courseId}`}
                                className="inline-flex items-center justify-center gap-1.5 w-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold py-2 px-4 rounded-lg transition-colors text-xs"
                            >
                                <StarIcon className="w-4 h-4 text-amber-500" />
                                <span>Leave a Course Review</span>
                            </Link>
                            <button
                                type="button"
                                onClick={() => setShowCompletionModal(false)}
                                className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 mt-2 font-medium cursor-pointer"
                            >
                                Close & Keep Exploring
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default LessonViewer;
