import { useState } from 'react';
import { api } from '@/lib/api';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { QuizEditorModal } from '../components/QuizEditorModal';
import { BulkLessonUploadModal } from '../components/BulkLessonUploadModal';
import { FileUpload } from '@components/common';

const LEVEL_OPTIONS = [
    { label: 'Beginner', value: 'beginner' },
    { label: 'Intermediate', value: 'intermediate' },
    { label: 'Advanced', value: 'advanced' },
];

function CreateCourse() {
    const navigate = useNavigate();

    // Workflow state
    const [step, setStep] = useState<number>(1);
    const [courseId, setCourseId] = useState<string | null>(null);

    // Course details state
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [level, setLevel] = useState('beginner');
    const [tags, setTags] = useState<string[]>([]);
    const [tagInput, setTagInput] = useState('');
    const [price, setPrice] = useState<number | ''>(0);
    const [thumbnail, setThumbnail] = useState<string | null>(null);
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
    const [bulkUploadSectionId, setBulkUploadSectionId] = useState<string | null>(null);

    const handleAddTag = () => {
        const trimmed = tagInput.trim().replace(/^#/, '');
        if (trimmed && !tags.includes(trimmed)) {
            setTags([...tags, trimmed]);
            setTagInput('');
        }
    };

    const handleRemoveTag = (tagToRemove: string) => {
        setTags(tags.filter((t) => t !== tagToRemove));
    };

    const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            handleAddTag();
        }
    };

    const handleCreateCourse = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreatingCourse(true);
        try {
            const payload = {
                title,
                description,
                price: Number(price),
                level,
                tags,
                thumbnailUrl: thumbnail || 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&h=600&fit=crop',
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
            const res = await api.post(`/courses/${courseId}/sections`, {
                title: newSectionTitle,
                order: sections.length + 1,
            });
            setSections([...sections, { ...res.data.section, lessons: [] }]);
            setNewSectionTitle('');
            toast.success('Section added');
        } catch {
            toast.error('Failed to add section');
        }
    };

    const handleAddLesson = async (e: React.FormEvent, sectionId: string) => {
        e.preventDefault();
        try {
            const sec = sections.find((s) => s._id === sectionId);
            const res = await api.post(`/sections/${sectionId}/lessons`, {
                title: newLessonTitle,
                durationMinutes: Number(newLessonDuration),
                order: sec.lessons.length + 1,
            });
            const updatedSection = {
                ...sec,
                lessons: [...sec.lessons, { ...res.data.lesson, items: [] }],
            };
            setSections(sections.map((s) => (s._id === sectionId ? updatedSection : s)));
            setNewLessonTitle('');
            setActiveSectionId(null);
            toast.success('Lesson added');
        } catch {
            toast.error('Failed to add lesson');
        }
    };

    const handleAddItem = async (e: React.FormEvent, sectionId: string, lessonId: string) => {
        e.preventDefault();
        try {
            const sec = sections.find((s) => s._id === sectionId);
            const lesson = sec.lessons.find((l: any) => l._id === lessonId);

            let content: Record<string, string>;
            if (newItemType === 'video' || newItemType === 'link' || newItemType === 'pdf') {
                content = { url: newItemContent };
            } else {
                content = { text: newItemContent };
            }

            const res = await api.post(`/lessons/${lessonId}/items`, {
                type: newItemType,
                content,
                order: (lesson.items?.length || 0) + 1,
            });

            const createdItem = res.data.lessonItem || res.data.item;
            const updatedItems = createdItem
                ? [...(lesson.items || []), createdItem]
                : [...(lesson.items || [])];
            const updatedLesson = { ...lesson, items: updatedItems };
            const updatedSection = {
                ...sec,
                lessons: sec.lessons.map((l: any) => (l._id === lessonId ? updatedLesson : l)),
            };

            setSections(sections.map((s) => (s._id === sectionId ? updatedSection : s)));
            setNewItemContent('');
            setActiveLessonId(null);
            toast.success('Item added to lesson');
        } catch {
            toast.error('Failed to add item');
        }
    };

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
                        <button
                            onClick={() => navigate('/instructor/courses')}
                            className="text-gray-500 hover:text-gray-700 font-medium"
                        >
                            Save as Draft
                        </button>
                        <button
                            onClick={handlePublish}
                            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
                            disabled={sections.length === 0}
                        >
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
                <div className="bg-white p-6 md:p-8 rounded-xl border border-gray-200 shadow-sm">
                    <h2 className="text-xl font-bold mb-6">Course Essentials</h2>
                    <form onSubmit={handleCreateCourse} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                            <input
                                type="text"
                                required
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="e.g. Master ReactJS from scratch"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                            <textarea
                                required
                                rows={4}
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Course details..."
                            ></textarea>
                        </div>

                        {/* Level & Tags Row */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Difficulty Level</label>
                                <select
                                    value={level}
                                    onChange={(e) => setLevel(e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    {LEVEL_OPTIONS.map((opt) => (
                                        <option key={opt.value} value={opt.value}>
                                            {opt.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Course Tags</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={tagInput}
                                        onChange={(e) => setTagInput(e.target.value)}
                                        onKeyDown={handleTagKeyDown}
                                        placeholder="e.g. React, JavaScript (press Enter)"
                                        className="flex-1 border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleAddTag}
                                        className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
                                    >
                                        Add Tag
                                    </button>
                                </div>
                                {tags.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 mt-2.5">
                                        {tags.map((t) => (
                                            <span
                                                key={t}
                                                className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100"
                                            >
                                                #{t}
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveTag(t)}
                                                    className="text-blue-500 hover:text-red-500 ml-0.5"
                                                >
                                                    ×
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex gap-6 flex-wrap">
                            <div className="w-48">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Price ($)</label>
                                <input
                                    type="number"
                                    required
                                    min="0"
                                    value={price}
                                    onChange={(e) => setPrice(Number(e.target.value))}
                                    className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div className="flex-1 min-w-[200px]">
                                <FileUpload
                                    label="Course Thumbnail"
                                    accept="image/jpeg, image/png, image/webp"
                                    maxSizeMB={5}
                                    onUploadSuccess={(url) => setThumbnail(import.meta.env.VITE_API_BASE_URL + url)}
                                />
                                {thumbnail && (
                                    <img
                                        src={thumbnail}
                                        alt="Preview"
                                        className="mt-2 h-20 w-32 object-cover rounded border border-gray-200"
                                    />
                                )}
                            </div>
                        </div>

                        <div className="pt-4 flex justify-end">
                            <button
                                type="submit"
                                disabled={creatingCourse}
                                className="bg-gray-900 text-white px-8 py-3 rounded-lg font-semibold flex items-center justify-center min-w-[150px] disabled:opacity-50 shadow-xs"
                            >
                                {creatingCourse ? 'Saving...' : 'Save & Continue'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {step === 2 && (
                <div className="space-y-6">
                    {/* Add section block */}
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                        <h2 className="text-lg font-bold mb-4">Add Curriculum Section</h2>
                        <form onSubmit={handleAddSection} className="flex gap-4">
                            <input
                                type="text"
                                required
                                value={newSectionTitle}
                                onChange={(e) => setNewSectionTitle(e.target.value)}
                                placeholder="e.g. Introduction & Fundamentals"
                                className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <button
                                type="submit"
                                className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium text-sm hover:bg-blue-700"
                            >
                                Add Section
                            </button>
                        </form>
                    </div>

                    {/* Render existing sections */}
                    <div className="space-y-4">
                        {sections.map((sec, sIdx) => (
                            <div key={sec._id} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                                    <h3 className="font-bold text-gray-800 text-sm">
                                        Section {sIdx + 1}: {sec.title}
                                    </h3>
                                    <div className="flex items-center gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setBulkUploadSectionId(sec._id)}
                                            className="text-xs bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-3 py-1.5 rounded-lg font-medium transition-colors border border-indigo-200"
                                        >
                                            ⚡ Bulk Add Lessons
                                        </button>
                                        <button
                                            onClick={() => setActiveSectionId(activeSectionId === sec._id ? null : sec._id)}
                                            className="text-sm font-medium text-blue-600 hover:text-blue-800"
                                        >
                                            {activeSectionId === sec._id ? 'Cancel' : '+ Add Lesson'}
                                        </button>
                                    </div>
                                </div>

                                <div className="p-6">
                                    {/* Lessons list */}
                                    <div className="space-y-3 mb-4">
                                        {sec.lessons.map((les: any, lIdx: number) => (
                                            <div key={les._id} className="p-4 border border-gray-100 rounded-lg bg-gray-50/50">
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="font-semibold text-sm text-gray-700">
                                                        Lesson {lIdx + 1}: {les.title} ({les.durationMinutes} mins)
                                                    </span>
                                                    <div className="space-x-3">
                                                        <button
                                                            onClick={() => setActiveLessonId(activeLessonId === les._id ? null : les._id)}
                                                            className="text-xs bg-white border border-gray-200 px-3 py-1.5 rounded hover:bg-gray-50 font-medium"
                                                        >
                                                            {activeLessonId === les._id ? 'Cancel Item' : '+ Add Content'}
                                                        </button>
                                                        <button
                                                            onClick={() => setQuizLessonId(les._id)}
                                                            className="text-xs bg-purple-50 text-purple-700 border border-purple-200 px-3 py-1.5 rounded hover:bg-purple-100 font-medium"
                                                        >
                                                            ⚡ Quiz
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Lesson items preview */}
                                                {les.items && les.items.length > 0 && (
                                                    <div className="mt-2 pl-4 border-l-2 border-blue-200 space-y-1">
                                                        {les.items.map((item: any) => (
                                                            <div key={item._id} className="text-xs text-gray-600 flex items-center gap-2">
                                                                <span className="uppercase font-mono text-[10px] bg-gray-200 px-1.5 py-0.5 rounded">
                                                                    {item.type}
                                                                </span>
                                                                <span className="truncate">
                                                                    {item.type === 'text' ? item.content.text : item.content.url}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}

                                                {/* Add item inline form */}
                                                {activeLessonId === les._id && (
                                                    <form onSubmit={(e) => handleAddItem(e, sec._id, les._id)} className="mt-4 pt-3 border-t border-gray-200 space-y-3">
                                                        <div className="flex gap-4">
                                                            <select
                                                                value={newItemType}
                                                                onChange={(e) => setNewItemType(e.target.value)}
                                                                className="border border-gray-300 rounded px-3 py-1.5 text-xs bg-white"
                                                            >
                                                                <option value="video">Video URL</option>
                                                                <option value="pdf">PDF URL</option>
                                                                <option value="link">External Link</option>
                                                                <option value="text">Text Article</option>
                                                            </select>
                                                            <input
                                                                type="text"
                                                                required
                                                                placeholder={newItemType === 'text' ? 'Article content...' : 'Resource URL...'}
                                                                value={newItemContent}
                                                                onChange={(e) => setNewItemContent(e.target.value)}
                                                                className="flex-1 border border-gray-300 rounded px-3 py-1.5 text-xs"
                                                            />
                                                            <button
                                                                type="submit"
                                                                className="bg-gray-800 text-white text-xs px-4 py-1.5 rounded font-medium hover:bg-gray-900"
                                                            >
                                                                Save Item
                                                            </button>
                                                        </div>
                                                    </form>
                                                )}
                                            </div>
                                        ))}
                                    </div>

                                    {/* Add Lesson form */}
                                    {activeSectionId === sec._id && (
                                        <form onSubmit={(e) => handleAddLesson(e, sec._id)} className="p-4 border-2 border-dashed border-gray-200 rounded-lg flex gap-4 items-center">
                                            <input
                                                type="text"
                                                required
                                                placeholder="Lesson Title..."
                                                value={newLessonTitle}
                                                onChange={(e) => setNewLessonTitle(e.target.value)}
                                                className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm"
                                            />
                                            <input
                                                type="number"
                                                required
                                                min="1"
                                                placeholder="Mins"
                                                value={newLessonDuration}
                                                onChange={(e) => setNewLessonDuration(Number(e.target.value))}
                                                className="w-20 border border-gray-300 rounded px-3 py-2 text-sm"
                                            />
                                            <button
                                                type="submit"
                                                className="bg-blue-600 text-white text-sm px-4 py-2 rounded font-medium hover:bg-blue-700"
                                            >
                                                Save Lesson
                                            </button>
                                        </form>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Quiz Editor Modal */}
            {quizLessonId && (
                <QuizEditorModal lessonId={quizLessonId} onClose={() => setQuizLessonId(null)} />
            )}

            {/* Bulk Lesson Upload Modal */}
            {bulkUploadSectionId && (
                <BulkLessonUploadModal
                    sectionId={bulkUploadSectionId}
                    isOpen={Boolean(bulkUploadSectionId)}
                    onClose={() => setBulkUploadSectionId(null)}
                    onSuccess={(newLessons) => {
                        setSections(
                            sections.map((sec) =>
                                sec._id === bulkUploadSectionId
                                    ? { ...sec, lessons: [...sec.lessons, ...newLessons.map(l => ({ ...l, items: [] }))] }
                                    : sec
                            )
                        );
                    }}
                />
            )}
        </div>
    );
}

export default CreateCourse;
