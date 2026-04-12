import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { toast } from 'react-toastify';

function LessonViewer() {
    const { courseId, lessonId } = useParams();
    const navigate = useNavigate();
    
    const [course, setCourse] = useState<any>(null);
    const [sections, setSections] = useState<any[]>([]);
    const [lessons, setLessons] = useState<any[]>([]);
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCourse = async () => {
            try {
                const res = await api.get(`/courses/${courseId}`);
                const c = res.data.course;
                setCourse(c);
                setSections(c.sections || []);
                setLessons(c.lessons || []);
                setItems(c.lessonItems || []);

                // If no lessonId provided, redirect to the very first lesson
                if (!lessonId && c.lessons && c.lessons.length > 0) {
                    navigate(`/learn/${courseId}/${c.lessons[0]._id}`, { replace: true });
                }
            } catch (err) {
                toast.error('Failed to load course content');
            } finally {
                setLoading(false);
            }
        };

        fetchCourse();
    }, [courseId, lessonId, navigate]);

    const activeLesson = lessons.find(l => l._id === lessonId);
    const activeItems = activeLesson ? items.filter(i => i.lesson === activeLesson._id) : [];

    const handleProgress = async () => {
        try {
            await api.post(`/lessons/${lessonId}/progress`, { completed: true });
            toast.success('Progress saved!');
        } catch(err) {
            toast.error('Failed to save progress');
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
                    <h2 className="text-lg font-bold text-gray-900 leading-tight">{course.title}</h2>
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
                                        return (
                                            <Link 
                                                key={les._id} 
                                                to={`/learn/${courseId}/${les._id}`}
                                                className={`px-6 py-3 text-sm transition-colors border-l-4 ${isActive ? 'bg-blue-50 border-blue-600 text-blue-700 font-medium' : 'border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
                                            >
                                                <div className="flex items-start gap-2">
                                                    <span className="text-gray-400 font-mono mt-0.5">{lIdx + 1}.</span>
                                                    <span>{les.title}</span>
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
                    <div className="max-w-4xl mx-auto border border-gray-200 bg-white shadow-sm rounded-2xl overflow-hidden">
                        <div className="p-6 md:p-8 bg-gray-900 text-white flex justify-between items-center">
                            <h1 className="text-2xl font-bold">{activeLesson.title}</h1>
                            <button onClick={handleProgress} className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
                                Mark as Complete
                            </button>
                        </div>
                        
                        <div className="p-6 md:p-8 space-y-8">
                            {activeItems.length === 0 ? (
                                <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-xl">
                                    <p className="text-gray-500">No content available for this lesson yet.</p>
                                </div>
                            ) : (
                                activeItems.map((item, idx) => (
                                    <div key={item._id} className="item-content">
                                        {item.type === 'video' ? (
                                            <div className="aspect-video bg-black rounded-xl overflow-hidden mb-4 relative drop-shadow-md">
                                                {/* Simulated video player wrapper */}
                                                <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                                                    {item.content.includes('youtube.com') || item.content.includes('youtu.be') ? (
                                                        <iframe 
                                                            className="w-full h-full" 
                                                            src={item.content.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')} 
                                                            title="Video player" 
                                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                                            allowFullScreen>
                                                        </iframe>
                                                    ) : (
                                                        <div className="text-center text-gray-300">
                                                            <svg className="w-16 h-16 mx-auto text-white/50 mb-2" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                                                            <p className="text-sm font-mono break-all px-4">{item.content}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="prose max-w-none text-gray-700 bg-gray-50 p-6 rounded-xl border border-gray-100">
                                                {item.content}
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default LessonViewer;
