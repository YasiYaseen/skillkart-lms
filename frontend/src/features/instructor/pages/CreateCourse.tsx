import { useState } from 'react';
import { api } from '@/lib/api';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { QuizEditorModal } from '../components/QuizEditorModal';
import { FileUpload } from '@components/common';

function CreateCourse() {
    const navigate = useNavigate();

    // Workflow state
    const [step, setStep] = useState<number>(1);
    const [courseId, setCourseId] = useState<string | null>(null);

    // Course details state
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState<number | ''>(0);
    const [thumbnail, setThumbnail] = useState<string | null>(null); // To store placeholder URL
    const [creatingCourse, setCreatingCourse] = useState(false);

    // Curriculum state
    const [sections, setSections] = useState<any[]>([]);
    const [newSectionTitle, setNewSectionTitle] = useState('');
    const [activeSectionId, setActiveSectionId] = useState<string | null>(null);

    // Lesson state
    const [newLessonTitle, setNewLessonTitle] = useState('');
    const [newLessonDuration, setNewLessonDuration] = useState<number>(10);

    // Lesson Item State
    const [newItemType, setNewItemType] = useState('video');
    const [newItemContent, setNewItemContent] = useState('');
    const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
    const [quizLessonId, setQuizLessonId] = useState<string | null>(null);

    const handleCreateCourse = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreatingCourse(true);
        try {
            const payload = {
                title,
                description,
                price: Number(price),
                level: 'beginner',
                thumbnailUrl: thumbnail || 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&h=600&fit=crop'
            };
            const res = await api.post('/courses', payload);
            setCourseId(res.data.course._id);
            setStep(2);
            toast.success('Course created! Now add curriculum.');
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to create course');
        } finally {
            setCreatingCourse(false);
        }
    };

    const handleAddSection = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!courseId) return;
        try {
            const res = await api.post(`/courses/${courseId}/sections`, { title: newSectionTitle, order: sections.length + 1 });
            setSections([...sections, { ...res.data.section, lessons: [] }]);
            setNewSectionTitle('');
            toast.success('Section added');
        } catch (err) {
            toast.error('Failed to add section');
        }
    };

    const handleAddLesson = async (e: React.FormEvent, sectionId: string) => {
        e.preventDefault();
        try {
            const sec = sections.find(s => s._id === sectionId);
            const res = await api.post(`/sections/${sectionId}/lessons`, {
                title: newLessonTitle,
                durationMinutes: Number(newLessonDuration),
                order: sec.lessons.length + 1
            });
            const updatedSection = { ...sec, lessons: [...sec.lessons, { ...res.data.lesson, items: [] }] };
            setSections(sections.map(s => s._id === sectionId ? updatedSection : s));
            setNewLessonTitle('');
            setActiveSectionId(null);
            toast.success('Lesson added');
        } catch (err) {
            toast.error('Failed to add lesson');
        }
    };

    const handleAddItem = async (e: React.FormEvent, sectionId: string, lessonId: string) => {
        e.preventDefault();
        try {
            const sec = sections.find(s => s._id === sectionId);
            const lesson = sec.lessons.find((l: any) => l._id === lessonId);

            // Build content object by type
            let content: Record<string, string>;
            if (newItemType === 'video') {
                content = { url: newItemContent };
            } else if (newItemType === 'link') {
                content = { url: newItemContent };
            } else if (newItemType === 'pdf') {
                content = { url: newItemContent };
            } else {
                content = { text: newItemContent };
            }

            const res = await api.post(`/lessons/${lessonId}/items`, {
                type: newItemType,
                content,
                order: (lesson.items?.length || 0) + 1
            });
            
            // update items locally
            const updatedItems = [...(lesson.items || []), res.data.item];
            const updatedLesson = { ...lesson, items: updatedItems };
            const updatedSection = { ...sec, lessons: sec.lessons.map((l: any) => l._id === lessonId ? updatedLesson : l) };

            setSections(sections.map(s => s._id === sectionId ? updatedSection : s));
            setNewItemContent('');
            setActiveLessonId(null);
            toast.success('Item added to lesson');
        } catch (err) {
            toast.error('Failed to add item');
        }
    }

    const handlePublish = async () => {
        if (!courseId) return;
        try {
            await api.patch(`/courses/${courseId}/publish`);
            toast.success('Course Published Successfully!');
            navigate('/instructor/courses');
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Publish failed');
        }
    };

    return (
        <div className="max-w-4xl">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Create New Course</h1>
                {step === 2 && (
                    <div className="space-x-4">
                        <button onClick={() => navigate('/instructor/courses')} className="text-gray-500 hover:text-gray-700">Save as Draft</button>
                        <button onClick={handlePublish} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50" disabled={sections.length === 0}>
                            Publish Course
                        </button>
                    </div>
                )}
            </div>

            {/* Stepper progress */}
            <div className="flex gap-4 mb-8">
                <div className={`flex-1 h-2 rounded-full ${step >= 1 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
                <div className={`flex-1 h-2 rounded-full ${step >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
            </div>

            {step === 1 && (
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <h2 className="text-xl font-bold mb-6">Course Essentials</h2>
                    <form onSubmit={handleCreateCourse} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                            <input type="text" required value={title} onChange={e => setTitle(e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-3" placeholder="e.g. Master ReactJS from scratch" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                            <textarea required rows={4} value={description} onChange={e => setDescription(e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-3" placeholder="Course details..."></textarea>
                        </div>
                        <div className="flex gap-6 flex-wrap">
                            <div className="w-48">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Price ($)</label>
                                <input type="number" required min="0" value={price} onChange={e => setPrice(Number(e.target.value))} className="w-full border border-gray-300 rounded-lg px-4 py-3" />
                            </div>
                            <div className="flex-1 min-w-[200px]">
                                <FileUpload 
                                    label="Course Thumbnail" 
                                    accept="image/jpeg, image/png, image/webp" 
                                    maxSizeMB={5}
                                    onUploadSuccess={(url) => setThumbnail(import.meta.env.VITE_API_BASE_URL + url)} 
                                />
                                {thumbnail && <img src={thumbnail} alt="Preview" className="mt-2 h-20 w-32 object-cover rounded border border-gray-200" />}
                            </div>
                        </div>
                        <div className="pt-4 flex justify-end">
                            <button type="submit" disabled={creatingCourse} className="bg-gray-900 text-white px-8 py-3 rounded-lg font-semibold flex items-center justify-center min-w-[150px] disabled:opacity-50">
                                {creatingCourse ? 'Saving...' : 'Save & Continue'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {step === 2 && (
                <div className="space-y-6">
                    <h2 className="text-xl font-bold text-gray-900">Curriculum</h2>
                    
                    {/* Render sections */}
                    <div className="space-y-4">
                        {sections.map((sec, sIdx) => (
                            <div key={sec._id} className="bg-white border border-gray-200 shadow-sm rounded-xl overflow-hidden">
                                <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                                    <h3 className="font-bold text-gray-800">Section {sIdx + 1}: {sec.title}</h3>
                                    <button onClick={() => setActiveSectionId(activeSectionId === sec._id ? null : sec._id)} className="text-blue-600 text-sm font-medium hover:text-blue-800">
                                        + Add Lesson
                                    </button>
                                </div>
                                
                                <div className="px-6 py-4 space-y-3">
                                    {sec.lessons?.map((les: any, lIdx: number) => (
                                        <div key={les._id} className="border border-gray-100 rounded-lg p-3 bg-gray-50 flex flex-col gap-2">
                                            <div className="flex justify-between items-center">
                                                <div className="font-medium text-gray-700 text-sm flex gap-2"><span className="text-gray-400">{lIdx + 1}.</span> {les.title} ({les.durationMinutes} min)</div>
                                                <div className="flex gap-3 items-center">
                                                    <button onClick={() => setQuizLessonId(les._id)} className="text-xs font-semibold text-purple-600">Manage Quiz</button>
                                                    <button onClick={() => setActiveLessonId(activeLessonId === les._id ? null : les._id)} className="text-xs font-semibold text-blue-600">Add Content</button>
                                                </div>
                                            </div>

                                            {/* Render Items */}
                                            {les.items?.length > 0 && (
                                                <div className="pl-6 space-y-2 mt-2 border-t border-gray-200 pt-2 text-xs">
                                                    {les.items.map((it: any) => (
                                                        <div key={it._id} className="text-gray-500 bg-white p-2 rounded border border-gray-200 flex justify-between items-center gap-2">
                                                            <span className="font-semibold uppercase text-gray-400 shrink-0">[{it.type}]</span>
                                                            <span className="truncate text-gray-600">{it.content?.url || it.content?.text || '—'}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {activeLessonId === les._id && (
                                                <form onSubmit={(e) => handleAddItem(e, sec._id, les._id)} className="mt-3 bg-white p-3 border border-gray-200 rounded space-y-2">
                                                    <div className="flex gap-2">
                                                        <select required className="border border-gray-300 rounded p-2 text-sm" value={newItemType} onChange={e => { setNewItemType(e.target.value); setNewItemContent(''); }}>
                                                            <option value="video">🎬 Video URL</option>
                                                            <option value="text">📝 Text / Notes</option>
                                                            <option value="link">🔗 External Link</option>
                                                            <option value="pdf">📄 PDF URL</option>
                                                        </select>
                                                        {newItemType === 'pdf' ? (
                                                            <div className="flex-1">
                                                                <FileUpload 
                                                                    label="Upload PDF"
                                                                    accept="application/pdf"
                                                                    maxSizeMB={15}
                                                                    onUploadSuccess={(url) => setNewItemContent(import.meta.env.VITE_API_BASE_URL + url)}
                                                                />
                                                                {newItemContent && <p className="text-xs text-green-600 mt-1">File uploaded successfully.</p>}
                                                            </div>
                                                        ) : (
                                                            <input
                                                                required
                                                                type={['video','link'].includes(newItemType) ? 'url' : 'text'}
                                                                placeholder={
                                                                    newItemType === 'video' ? 'YouTube / video URL...' :
                                                                    newItemType === 'link'  ? 'https://...' :
                                                                    'Write lesson notes or description...'
                                                                }
                                                                value={newItemContent}
                                                                onChange={e => setNewItemContent(e.target.value)}
                                                                className="flex-1 border border-gray-300 p-2 text-sm rounded"
                                                            />
                                                        )}
                                                    </div>
                                                    <div className="flex justify-end gap-2">
                                                        <button type="button" onClick={() => setActiveLessonId(null)} className="text-gray-500 text-sm px-3 py-1.5 hover:text-gray-700">Cancel</button>
                                                        <button type="submit" className="bg-blue-600 text-white text-sm px-4 py-1.5 rounded font-medium">Add Item</button>
                                                    </div>
                                                </form>
                                            )}
                                        </div>
                                    ))}
                                    
                                    {/* Add Lesson form */}
                                    {activeSectionId === sec._id && (
                                        <form onSubmit={(e) => handleAddLesson(e, sec._id)} className="flex gap-2 items-center mt-2 border-2 border-dashed border-gray-200 p-4 rounded-lg bg-white">
                                            <input required type="text" placeholder="Lesson Title" value={newLessonTitle} onChange={e => setNewLessonTitle(e.target.value)} className="flex-1 border border-gray-300 p-2 rounded-lg text-sm" />
                                            <input required type="number" placeholder="Duration (min)" min="1" value={newLessonDuration} onChange={e => setNewLessonDuration(Number(e.target.value))} className="w-32 border border-gray-300 p-2 rounded-lg text-sm" />
                                            <button type="submit" className="bg-gray-800 text-white px-4 py-2 rounded-lg text-sm font-medium">Add</button>
                                            <button type="button" onClick={() => setActiveSectionId(null)} className="text-gray-500 hover:text-gray-700 px-2">Cancel</button>
                                        </form>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Add Section form */}
                    <form onSubmit={handleAddSection} className="bg-white border-2 border-dashed border-gray-300 p-6 rounded-xl flex gap-4 items-center">
                        <input required type="text" placeholder="Enter new section title..." value={newSectionTitle} onChange={e => setNewSectionTitle(e.target.value)} className="flex-1 border border-gray-300 px-4 py-3 rounded-lg" />
                        <button type="submit" className="bg-gray-900 text-white px-6 py-3 font-semibold rounded-lg hover:bg-gray-800">Add Section</button>
                    </form>
                </div>
            )}

            <QuizEditorModal 
                isOpen={!!quizLessonId} 
                onClose={() => setQuizLessonId(null)} 
                lessonId={quizLessonId} 
            />
        </div>
    );
}

export default CreateCourse;
