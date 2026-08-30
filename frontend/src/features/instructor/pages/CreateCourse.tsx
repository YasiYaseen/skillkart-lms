import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { QuizEditorModal } from '../components/QuizEditorModal';
import { BulkLessonUploadModal } from '../components/BulkLessonUploadModal';
import { Button, FileUpload } from '@/components/common';
import { useCurrency } from '@/context/CurrencyContext';

export interface CourseLessonItem {
    _id: string;
    type: string;
    content: {
        text?: string;
        url?: string;
    };
    order: number;
}

export interface CourseLesson {
    _id: string;
    title: string;
    durationMinutes: number;
    order: number;
    items?: CourseLessonItem[];
}

export interface CourseSection {
    _id: string;
    title: string;
    order: number;
    lessons: CourseLesson[];
}

const LEVEL_OPTIONS = [
    { label: 'Beginner', value: 'beginner' },
    { label: 'Intermediate', value: 'intermediate' },
    { label: 'Advanced', value: 'advanced' },
];

function CreateCourse() {
    const navigate = useNavigate();
    const { currency, symbol } = useCurrency();

    // Workflow state
    const [step, setStep] = useState<number>(1);
    const [courseId, setCourseId] = useState<string | null>(null);

    // Course details state
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState<string>('');
    const [availableCategories, setAvailableCategories] = useState<Array<{ id: string; name: string; icon: string; slug: string }>>([]);
    const [level, setLevel] = useState('beginner');
    const [tags, setTags] = useState<string[]>([]);
    const [tagInput, setTagInput] = useState('');
    const [whatYouWillLearn, setWhatYouWillLearn] = useState<string[]>([]);
    const [learnInput, setLearnInput] = useState('');
    const [prerequisites, setPrerequisites] = useState<string[]>([]);
    const [prereqInput, setPrereqInput] = useState('');
    const [price, setPrice] = useState<number | ''>(0);
    const [thumbnail, setThumbnail] = useState<string | null>(null);
    const [creatingCourse, setCreatingCourse] = useState(false);

    useEffect(() => {
        api.get<{ categories: Array<{ id: string; name: string; icon: string; slug: string }> }>('/categories')
            .then((res) => {
                setAvailableCategories(res.data.categories || []);
            })
            .catch(() => {});
    }, []);

    // Curriculum state
    const [sections, setSections] = useState<CourseSection[]>([]);
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

    const handleAddLearnItem = () => {
        const trimmed = learnInput.trim();
        if (trimmed && !whatYouWillLearn.includes(trimmed)) {
            setWhatYouWillLearn([...whatYouWillLearn, trimmed]);
            setLearnInput('');
        }
    };

    const handleRemoveLearnItem = (itemToRemove: string) => {
        setWhatYouWillLearn(whatYouWillLearn.filter((item) => item !== itemToRemove));
    };

    const handleAddPrereqItem = () => {
        const trimmed = prereqInput.trim();
        if (trimmed && !prerequisites.includes(trimmed)) {
            setPrerequisites([...prerequisites, trimmed]);
            setPrereqInput('');
        }
    };

    const handleRemovePrereqItem = (itemToRemove: string) => {
        setPrerequisites(prerequisites.filter((item) => item !== itemToRemove));
    };

    const handleCreateCourse = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreatingCourse(true);
        try {
            const payload = {
                title,
                description,
                category: category || undefined,
                price: Number(price),
                level,
                tags,
                whatYouWillLearn,
                prerequisites,
                thumbnailUrl: thumbnail || 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&h=600&fit=crop',
            };
            const res = await api.post('/courses', payload);
            setCourseId(res.data.course._id);
            setStep(2);
            toast.success('Course created! Now add curriculum.');
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to create course';
            toast.error(msg);
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

    const handleDeleteSection = async (sectionId: string) => {
        try {
            await api.delete(`/sections/${sectionId}`);
            setSections(sections.filter((s) => s._id !== sectionId));
            toast.success('Section deleted');
        } catch {
            toast.error('Failed to delete section');
        }
    };

    const handleMoveSection = (index: number, direction: 'up' | 'down') => {
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= sections.length) return;
        const updated = [...sections];
        const temp = updated[index];
        updated[index] = updated[targetIndex];
        updated[targetIndex] = temp;
        setSections(updated);
    };

    const handleAddLesson = async (e: React.FormEvent, sectionId: string) => {
        e.preventDefault();
        try {
            const sec = sections.find((s) => s._id === sectionId);
            if (!sec) return;
            const res = await api.post(`/sections/${sectionId}/lessons`, {
                title: newLessonTitle,
                durationMinutes: Number(newLessonDuration),
                order: sec.lessons.length + 1,
            });
            const updatedSection: CourseSection = {
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

    const handleDeleteLesson = async (sectionId: string, lessonId: string) => {
        try {
            await api.delete(`/lessons/${lessonId}`);
            setSections(
                sections.map((s) =>
                    s._id === sectionId
                        ? { ...s, lessons: s.lessons.filter((l) => l._id !== lessonId) }
                        : s
                )
            );
            toast.success('Lesson deleted');
        } catch {
            toast.error('Failed to delete lesson');
        }
    };

    const handleMoveLesson = (sectionId: string, index: number, direction: 'up' | 'down') => {
        const sec = sections.find((s) => s._id === sectionId);
        if (!sec) return;
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= sec.lessons.length) return;
        const updatedLessons = [...sec.lessons];
        const temp = updatedLessons[index];
        updatedLessons[index] = updatedLessons[targetIndex];
        updatedLessons[targetIndex] = temp;
        setSections(sections.map((s) => (s._id === sectionId ? { ...s, lessons: updatedLessons } : s)));
    };

    const handleAddItem = async (e: React.FormEvent, sectionId: string, lessonId: string) => {
        e.preventDefault();
        try {
            const sec = sections.find((s) => s._id === sectionId);
            if (!sec) return;
            const lesson = sec.lessons.find((l) => l._id === lessonId);
            if (!lesson) return;

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
            const updatedLesson: CourseLesson = { ...lesson, items: updatedItems };
            const updatedSection: CourseSection = {
                ...sec,
                lessons: sec.lessons.map((l) => (l._id === lessonId ? updatedLesson : l)),
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
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Publish failed';
            toast.error(msg);
        }
    };

    return (
        <div className="max-w-4xl">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create New Course</h1>
                {step === 2 && (
                    <div className="space-x-4">
                        <button
                            onClick={() => navigate('/instructor/courses')}
                            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 font-medium"
                        >
                            Save as Draft
                        </button>
                        <button
                            onClick={handlePublish}
                            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 shadow-xs"
                            disabled={sections.length === 0}
                        >
                            Publish Course
                        </button>
                    </div>
                )}
            </div>

            {/* Stepper progress */}
            <div className="flex gap-4 mb-8">
                <div className={`flex-1 h-2 rounded-full ${step >= 1 ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-800'}`}></div>
                <div className={`flex-1 h-2 rounded-full ${step >= 2 ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-800'}`}></div>
            </div>

            {step === 1 && (
                <div className="bg-white dark:bg-gray-900 p-6 md:p-8 rounded-xl border border-gray-200 dark:border-gray-800 shadow-xs">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Course Essentials</h2>
                    <form onSubmit={handleCreateCourse} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Title</label>
                            <input
                                type="text"
                                required
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="e.g. Master ReactJS from scratch"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</label>
                            <textarea
                                required
                                rows={4}
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Course details..."
                            ></textarea>
                        </div>

                        {/* Category Selector */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Primary Category / Learning Track
                            </label>
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">Select a Category Track (Optional / Auto-inferred from tags)</option>
                                {availableCategories.map((c) => (
                                    <option key={c.id || c.slug} value={c.id || c.slug}>
                                        {c.icon} {c.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Level & Tags Row */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Difficulty Level</label>
                                <select
                                    value={level}
                                    onChange={(e) => setLevel(e.target.value)}
                                    className="w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    {LEVEL_OPTIONS.map((opt) => (
                                        <option key={opt.value} value={opt.value} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                                            {opt.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Course Tags</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={tagInput}
                                        onChange={(e) => setTagInput(e.target.value)}
                                        onKeyDown={handleTagKeyDown}
                                        placeholder="e.g. React, JavaScript (press Enter)"
                                        className="flex-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleAddTag}
                                        className="px-4 py-2.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg text-sm font-medium transition-colors border border-gray-200 dark:border-gray-700"
                                    >
                                        Add Tag
                                    </button>
                                </div>
                                {tags.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 mt-2.5">
                                        {tags.map((t) => (
                                            <span
                                                key={t}
                                                className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-900/50"
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

                        {/* What You'll Learn */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                What You'll Learn <span className="text-xs text-gray-500 dark:text-gray-400 font-normal">(key outcomes / skills)</span>
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={learnInput}
                                    onChange={(e) => setLearnInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            handleAddLearnItem();
                                        }
                                    }}
                                    placeholder="e.g. Build fullstack applications with React and Node"
                                    className="flex-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <button
                                    type="button"
                                    onClick={handleAddLearnItem}
                                    className="px-4 py-2.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg text-sm font-medium transition-colors border border-gray-200 dark:border-gray-700"
                                >
                                    + Add Outcome
                                </button>
                            </div>
                            {whatYouWillLearn.length > 0 && (
                                <ul className="mt-3 space-y-1.5">
                                    {whatYouWillLearn.map((item, idx) => (
                                        <li key={idx} className="flex items-center justify-between text-xs bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 px-3 py-2 rounded-lg border border-emerald-100 dark:border-emerald-800">
                                            <span className="flex items-center gap-2">
                                                <span className="text-emerald-600 dark:text-emerald-400 font-bold">✓</span>
                                                <span>{item}</span>
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveLearnItem(item)}
                                                className="text-emerald-700 dark:text-emerald-400 hover:text-red-600 font-bold ml-2"
                                            >
                                                ×
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        {/* Prerequisites */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                Course Prerequisites <span className="text-xs text-gray-500 dark:text-gray-400 font-normal">(knowledge needed)</span>
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={prereqInput}
                                    onChange={(e) => setPrereqInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            handleAddPrereqItem();
                                        }
                                    }}
                                    placeholder="e.g. Basic understanding of JavaScript and HTML"
                                    className="flex-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <button
                                    type="button"
                                    onClick={handleAddPrereqItem}
                                    className="px-4 py-2.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg text-sm font-medium transition-colors border border-gray-200 dark:border-gray-700"
                                >
                                    + Add Prereq
                                </button>
                            </div>
                            {prerequisites.length > 0 && (
                                <ul className="mt-3 space-y-1.5">
                                    {prerequisites.map((item, idx) => (
                                        <li key={idx} className="flex items-center justify-between text-xs bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700">
                                            <span className="flex items-center gap-2">
                                                <span className="text-blue-500 font-bold">•</span>
                                                <span>{item}</span>
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => handleRemovePrereqItem(item)}
                                                className="text-gray-500 dark:text-gray-400 hover:text-red-600 font-bold ml-2"
                                            >
                                                ×
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        {/* Price & Thumbnail Row */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Price ({symbol} {currency})</label>
                                <input
                                    type="number"
                                    required
                                    min="0"
                                    value={price}
                                    onChange={(e) => setPrice(Number(e.target.value))}
                                    className="w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                                        className="mt-2 h-20 w-32 object-cover rounded border border-gray-200 dark:border-gray-700"
                                    />
                                )}
                            </div>
                        </div>

                        <div className="pt-4 flex justify-end">
                            <Button type="submit" size="lg" disabled={creatingCourse}>
                                {creatingCourse ? 'Creating Course...' : 'Next: Build Curriculum →'}
                            </Button>
                        </div>
                    </form>
                </div>
            )}

            {step === 2 && (
                <div className="space-y-6">
                    {/* Add section block */}
                    <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-xs">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Add Curriculum Section</h2>
                        <form onSubmit={handleAddSection} className="flex gap-4">
                            <input
                                type="text"
                                required
                                value={newSectionTitle}
                                onChange={(e) => setNewSectionTitle(e.target.value)}
                                placeholder="e.g. Introduction & Fundamentals"
                                className="flex-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <button
                                type="submit"
                                className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium text-sm hover:bg-blue-700 shadow-xs transition-colors"
                            >
                                Add Section
                            </button>
                        </form>
                    </div>

                    {/* Render existing sections */}
                    <div className="space-y-4">
                        {sections.map((sec, sIdx) => (
                            <div key={sec._id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-xs">
                                <div className="bg-gray-50 dark:bg-gray-800/80 px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <div className="flex flex-col gap-0.5">
                                            <button
                                                type="button"
                                                disabled={sIdx === 0}
                                                onClick={() => handleMoveSection(sIdx, 'up')}
                                                className="text-[10px] text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 disabled:opacity-20 leading-none"
                                                title="Move Section Up"
                                            >
                                                ▲
                                            </button>
                                            <button
                                                type="button"
                                                disabled={sIdx === sections.length - 1}
                                                onClick={() => handleMoveSection(sIdx, 'down')}
                                                className="text-[10px] text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 disabled:opacity-20 leading-none"
                                                title="Move Section Down"
                                            >
                                                ▼
                                            </button>
                                        </div>
                                        <h3 className="font-bold text-gray-800 dark:text-gray-100 text-sm">
                                            Section {sIdx + 1}: {sec.title}
                                        </h3>
                                    </div>
                                    <div className="flex items-center gap-2.5">
                                        <button
                                            type="button"
                                            onClick={() => setBulkUploadSectionId(sec._id)}
                                            className="text-xs bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50 px-3 py-1.5 rounded-lg font-medium transition-colors border border-blue-200 dark:border-blue-800 shadow-2xs"
                                        >
                                            ⚡ Bulk Add Lessons
                                        </button>
                                        <button
                                            onClick={() => setActiveSectionId(activeSectionId === sec._id ? null : sec._id)}
                                            className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-700 px-3 py-1.5 rounded-lg"
                                        >
                                            {activeSectionId === sec._id ? 'Cancel' : '+ Add Lesson'}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleDeleteSection(sec._id)}
                                            className="text-xs text-red-500 hover:text-red-700 p-1.5 hover:bg-red-50 dark:hover:bg-red-950/40 rounded"
                                            title="Delete Section"
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </div>

                                <div className="p-6">
                                    {/* Lessons list */}
                                    <div className="space-y-3 mb-4">
                                        {sec.lessons.map((les: CourseLesson, lIdx: number) => (
                                            <div key={les._id} className="p-4 border border-gray-100 dark:border-gray-800 rounded-lg bg-gray-50/50 dark:bg-gray-800/50">
                                                <div className="flex justify-between items-center mb-2">
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex flex-col gap-0.5">
                                                            <button
                                                                type="button"
                                                                disabled={lIdx === 0}
                                                                onClick={() => handleMoveLesson(sec._id, lIdx, 'up')}
                                                                className="text-[10px] text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 disabled:opacity-20 leading-none"
                                                                title="Move Lesson Up"
                                                            >
                                                                ▲
                                                            </button>
                                                            <button
                                                                type="button"
                                                                disabled={lIdx === sec.lessons.length - 1}
                                                                onClick={() => handleMoveLesson(sec._id, lIdx, 'down')}
                                                                className="text-[10px] text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 disabled:opacity-20 leading-none"
                                                                title="Move Lesson Down"
                                                            >
                                                                ▼
                                                            </button>
                                                        </div>
                                                        <span className="font-semibold text-sm text-gray-700 dark:text-gray-200">
                                                            Lesson {lIdx + 1}: {les.title} ({les.durationMinutes} mins)
                                                        </span>
                                                    </div>
                                                    <div className="space-x-2 flex items-center">
                                                        <button
                                                            onClick={() => setActiveLessonId(activeLessonId === les._id ? null : les._id)}
                                                            className="text-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 px-3 py-1.5 rounded hover:bg-gray-50 dark:hover:bg-gray-700 font-medium"
                                                        >
                                                            {activeLessonId === les._id ? 'Cancel Item' : '+ Add Content'}
                                                        </button>
                                                        <button
                                                            onClick={() => setQuizLessonId(les._id)}
                                                            className="text-xs bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 px-3 py-1.5 rounded hover:bg-blue-100 dark:hover:bg-blue-900/50 font-medium"
                                                        >
                                                            ⚡ Quiz
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleDeleteLesson(sec._id, les._id)}
                                                            className="text-xs text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 dark:hover:bg-red-950/40"
                                                            title="Delete Lesson"
                                                        >
                                                            ✕
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Lesson items preview */}
                                                {les.items && les.items.length > 0 && (
                                                    <div className="mt-2 pl-4 border-l-2 border-blue-500 dark:border-blue-400 space-y-1">
                                                        {les.items.map((item: CourseLessonItem) => (
                                                            <div key={item._id} className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-2">
                                                                <span className="uppercase font-mono text-[10px] bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-1.5 py-0.5 rounded">
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
                                                    <form onSubmit={(e) => handleAddItem(e, sec._id, les._id)} className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700 space-y-3">
                                                        <div className="space-y-3">
                                                            <div className="flex items-center gap-3">
                                                                <select
                                                                    value={newItemType}
                                                                    onChange={(e) => setNewItemType(e.target.value)}
                                                                    className="border border-gray-300 dark:border-gray-700 rounded px-3 py-1.5 text-xs bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                                                >
                                                                    <option value="video">Video URL</option>
                                                                    <option value="pdf">PDF URL</option>
                                                                    <option value="link">External Link</option>
                                                                    <option value="text">Text Article (Markdown)</option>
                                                                </select>
                                                                <button
                                                                    type="submit"
                                                                    className="bg-gray-800 dark:bg-gray-700 text-white text-xs px-4 py-1.5 rounded font-medium hover:bg-gray-900 dark:hover:bg-gray-600 ml-auto"
                                                                >
                                                                    Save Item
                                                                </button>
                                                            </div>
                                                            {newItemType === 'text' ? (
                                                                <textarea
                                                                    required
                                                                    rows={4}
                                                                    placeholder="Write lesson notes, markdown, or article content..."
                                                                    value={newItemContent}
                                                                    onChange={(e) => setNewItemContent(e.target.value)}
                                                                    className="w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 border border-gray-300 dark:border-gray-700 rounded-lg p-3 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                                                                />
                                                            ) : (
                                                                <input
                                                                    type="url"
                                                                    required
                                                                    placeholder={newItemType === 'pdf' ? 'https://.../document.pdf' : 'https://youtube.com/... or https://...'}
                                                                    value={newItemContent}
                                                                    onChange={(e) => setNewItemContent(e.target.value)}
                                                                    className="w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                                />
                                                            )}
                                                        </div>
                                                    </form>
                                                )}
                                            </div>
                                        ))}
                                    </div>

                                    {/* Add Lesson form */}
                                    {activeSectionId === sec._id && (
                                        <form onSubmit={(e) => handleAddLesson(e, sec._id)} className="p-4 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg flex gap-4 items-center bg-gray-50/50 dark:bg-gray-800/30">
                                            <input
                                                type="text"
                                                required
                                                placeholder="Lesson Title..."
                                                value={newLessonTitle}
                                                onChange={(e) => setNewLessonTitle(e.target.value)}
                                                className="flex-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 border border-gray-300 dark:border-gray-700 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                            <input
                                                type="number"
                                                required
                                                min="1"
                                                placeholder="Mins"
                                                value={newLessonDuration}
                                                onChange={(e) => setNewLessonDuration(Number(e.target.value))}
                                                className="w-20 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 border border-gray-300 dark:border-gray-700 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                            <button
                                                type="submit"
                                                className="bg-blue-600 text-white text-sm px-4 py-2 rounded font-medium hover:bg-blue-700 shadow-xs"
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
                <QuizEditorModal
                    isOpen={Boolean(quizLessonId)}
                    lessonId={quizLessonId}
                    onClose={() => setQuizLessonId(null)}
                />
            )}

            {/* Bulk Lesson Upload Modal */}
            {bulkUploadSectionId && (
                <BulkLessonUploadModal
                    sectionId={bulkUploadSectionId}
                    isOpen={Boolean(bulkUploadSectionId)}
                    onClose={() => setBulkUploadSectionId(null)}
                    onSuccess={async () => {
                        if (courseId) {
                            try {
                                const res = await api.get<{ sections: CourseSection[] }>(`/courses/${courseId}/sections`);
                                setSections(res.data.sections || []);
                            } catch {
                                // Ignore refresh error
                            }
                        }
                    }}
                />
            )}
        </div>
    );
}

export default CreateCourse;
