import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { QuizEditorModal } from '../components/QuizEditorModal';
import { Button, FileUpload } from '@/components/common';
import { useCurrency } from '@/context/CurrencyContext';
import { getErrorMessage } from '@/utils/errorUtils';
import { resolveMediaUrl } from '@/utils/mediaUtils';
import { TrashIcon, AcademicCapIcon, ClockIcon, PlusIcon } from '@heroicons/react/20/solid';

export interface DraftLessonItem {
    id: string;
    type: 'video' | 'pdf' | 'text' | 'link';
    content: string;
}

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

export const CreateCourse = () => {
    const navigate = useNavigate();
    const { symbol, currency } = useCurrency();
    const [step, setStep] = useState(1);
    const [courseId, setCourseId] = useState<string | null>(null);

    // Form states
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('');
    const [price, setPrice] = useState<number | string>(0);
    const [level, setLevel] = useState('beginner');
    const [tags, setTags] = useState<string[]>([]);
    const [tagInput, setTagInput] = useState('');
    const [whatYouWillLearn, setWhatYouWillLearn] = useState<string[]>([]);
    const [learnInput, setLearnInput] = useState('');
    const [prerequisites, setPrerequisites] = useState<string[]>([]);
    const [prereqInput, setPrereqInput] = useState('');
    const [thumbnail, setThumbnail] = useState('');
    const [creatingCourse, setCreatingCourse] = useState(false);

    // Curriculum states
    const [sections, setSections] = useState<CourseSection[]>([]);
    const [newSectionTitle, setNewSectionTitle] = useState('');
    const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
    const [newLessonTitle, setNewLessonTitle] = useState('');
    const [newLessonDuration, setNewLessonDuration] = useState('10');
    const [draftItems, setDraftItems] = useState<DraftLessonItem[]>([
        { id: '1', type: 'video', content: '' },
    ]);
    const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
    const [newItemType, setNewItemType] = useState('text');
    const [newItemContent, setNewItemContent] = useState('');

    // Quiz state
    const [quizLessonId, setQuizLessonId] = useState<string | null>(null);

    // Categories
    const [availableCategories, setAvailableCategories] = useState<Array<{ id: string; name: string; slug: string; icon: string }>>([]);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await api.get('/categories');
                setAvailableCategories(res.data.categories || []);
            } catch {
                // Ignore fallback
            }
        };
        fetchCategories();
    }, []);

    const handleAddTag = () => {
        if (!tagInput.trim()) return;
        const formatted = tagInput.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
        if (formatted && !tags.includes(formatted)) {
            setTags([...tags, formatted]);
        }
        setTagInput('');
    };

    const handleRemoveTag = (tagToRemove: string) => {
        setTags(tags.filter((t) => t !== tagToRemove));
    };

    const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAddTag();
        }
    };

    const handleAddLearnItem = () => {
        if (!learnInput.trim()) return;
        if (!whatYouWillLearn.includes(learnInput.trim())) {
            setWhatYouWillLearn([...whatYouWillLearn, learnInput.trim()]);
        }
        setLearnInput('');
    };

    const handleRemoveLearnItem = (itemToRemove: string) => {
        setWhatYouWillLearn(whatYouWillLearn.filter((item) => item !== itemToRemove));
    };

    const handleAddPrereqItem = () => {
        if (!prereqInput.trim()) return;
        if (!prerequisites.includes(prereqInput.trim())) {
            setPrerequisites([...prerequisites, prereqInput.trim()]);
        }
        setPrereqInput('');
    };

    const handleRemovePrereqItem = (itemToRemove: string) => {
        setPrerequisites(prerequisites.filter((item) => item !== itemToRemove));
    };

    const handleCreateCourse = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreatingCourse(true);
        try {
            const numPrice = Number(price) || 0;
            const payload = {
                title,
                description,
                category: category || undefined,
                price: numPrice,
                isPaid: numPrice > 0,
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
            toast.error(getErrorMessage(err, 'Failed to create course'));
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
        } catch (err: unknown) {
            toast.error(getErrorMessage(err, 'Failed to add section'));
        }
    };

    const handleDeleteSection = async (sectionId: string) => {
        try {
            await api.delete(`/sections/${sectionId}`);
            setSections(sections.filter((s) => s._id !== sectionId));
            toast.success('Section deleted');
        } catch (err: unknown) {
            toast.error(getErrorMessage(err, 'Failed to delete section'));
        }
    };

    const handleMoveSection = async (index: number, direction: 'up' | 'down') => {
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= sections.length || !courseId) return;
        const previousSections = [...sections];
        const updated = [...sections];
        const temp = updated[index];
        updated[index] = updated[targetIndex];
        updated[targetIndex] = temp;
        setSections(updated);

        try {
            const sectionIds = updated.map((s) => s._id);
            await api.patch(`/courses/${courseId}/sections/reorder`, { sectionIds });
        } catch (err) {
            setSections(previousSections);
            toast.error(getErrorMessage(err, 'Failed to update section order'));
        }
    };

    const handleAddLesson = async (e: React.FormEvent, sectionId: string, addAnother = false) => {
        e.preventDefault();
        const trimmedTitle = newLessonTitle.trim();
        if (!trimmedTitle) {
            toast.error('Please enter a lesson title');
            return;
        }

        try {
            const sec = sections.find((s) => s._id === sectionId);
            if (!sec) return;
            const res = await api.post(`/sections/${sectionId}/lessons`, {
                title: trimmedTitle,
                durationMinutes: Number(newLessonDuration) || 10,
                order: sec.lessons.length + 1,
            });

            const createdLesson = res.data.lesson;
            const items: CourseLessonItem[] = [];

            // Attach all valid draft items
            const validDraftItems = draftItems.filter((it) => it.content.trim());
            for (let i = 0; i < validDraftItems.length; i++) {
                const draft = validDraftItems[i];
                try {
                    const contentPayload =
                        draft.type === 'text'
                            ? { text: draft.content.trim() }
                            : { url: draft.content.trim() };

                    const itemRes = await api.post(`/lessons/${createdLesson._id}/items`, {
                        type: draft.type,
                        content: contentPayload,
                        order: i + 1,
                    });
                    const item = itemRes.data.lessonItem || itemRes.data.item;
                    if (item) items.push(item);
                } catch {
                    toast.error(`Attached ${items.length} items, but failed on item ${i + 1}`);
                }
            }

            const updatedSection: CourseSection = {
                ...sec,
                lessons: [...sec.lessons, { ...createdLesson, items }],
            };
            setSections(sections.map((s) => (s._id === sectionId ? updatedSection : s)));
            setNewLessonTitle('');
            setNewLessonDuration('10');
            setDraftItems([{ id: String(Date.now()), type: 'video', content: '' }]);
            if (!addAnother) {
                setActiveSectionId(null);
            }
            toast.success(
                items.length > 0
                    ? `Lesson saved with ${items.length} content item${items.length > 1 ? 's' : ''}!`
                    : 'Lesson added'
            );
        } catch {
            toast.error('Failed to add lesson');
        }
    };

    const handleDeleteItem = async (sectionId: string, lessonId: string, itemId: string) => {
        try {
            await api.delete(`/lessons/${lessonId}/items/${itemId}`);
            setSections((prev) =>
                prev.map((sec) => {
                    if (sec._id !== sectionId) return sec;
                    return {
                        ...sec,
                        lessons: sec.lessons.map((les) => {
                            if (les._id !== lessonId) return les;
                            return {
                                ...les,
                                items: (les.items || []).filter((it) => it._id !== itemId),
                            };
                        }),
                    };
                })
            );
            toast.success('Content item removed');
        } catch {
            toast.error('Failed to remove content item');
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

    const handleMoveLesson = async (sectionId: string, index: number, direction: 'up' | 'down') => {
        const sec = sections.find((s) => s._id === sectionId);
        if (!sec) return;
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= sec.lessons.length) return;
        const previousLessons = [...sec.lessons];
        const updatedLessons = [...sec.lessons];
        const temp = updatedLessons[index];
        updatedLessons[index] = updatedLessons[targetIndex];
        updatedLessons[targetIndex] = temp;
        setSections(sections.map((s) => (s._id === sectionId ? { ...s, lessons: updatedLessons } : s)));

        try {
            const lessonIds = updatedLessons.map((l) => l._id);
            await api.patch(`/sections/${sectionId}/lessons/reorder`, { lessonIds });
        } catch (err) {
            setSections(sections.map((s) => (s._id === sectionId ? { ...s, lessons: previousLessons } : s)));
            toast.error(getErrorMessage(err, 'Failed to update lesson order'));
        }
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
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Title <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                required
                                minLength={3}
                                maxLength={140}
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="e.g. Master ReactJS from scratch"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Description <span className="text-red-500">*</span> <span className="text-xs text-gray-400 font-normal">(min 20 chars)</span>
                            </label>
                            <textarea
                                required
                                minLength={20}
                                rows={4}
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Comprehensive course overview, outcomes, and objectives..."
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
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Price ({symbol} {currency}) <span className="text-red-500">*</span>
                                </label>
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
                                    maxSizeMB={10}
                                    onUploadSuccess={(url) => setThumbnail(url)}
                                />
                                {thumbnail && (
                                    <img
                                        src={resolveMediaUrl(thumbnail)}
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
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => setActiveSectionId(activeSectionId === sec._id ? null : sec._id)}
                                            className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-700 px-2.5 py-1.5 rounded-lg cursor-pointer"
                                        >
                                            {activeSectionId === sec._id ? 'Cancel' : '+ Add Lesson'}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleDeleteSection(sec._id)}
                                            className="text-xs text-rose-500 hover:text-rose-700 p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg cursor-pointer"
                                            title="Delete Section"
                                        >
                                            <TrashIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                <div className="p-6">
                                    {/* Lessons list */}
                                    <div className="space-y-3 mb-4">
                                        {sec.lessons.map((les: CourseLesson, lIdx: number) => (
                                            <div key={les._id} className="p-4 border border-slate-100 dark:border-slate-800 rounded-lg bg-slate-50/50 dark:bg-slate-800/50">
                                                <div className="flex justify-between items-center mb-2">
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex flex-col gap-0.5">
                                                            <button
                                                                type="button"
                                                                disabled={lIdx === 0}
                                                                onClick={() => handleMoveLesson(sec._id, lIdx, 'up')}
                                                                className="text-[10px] text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 disabled:opacity-20 leading-none cursor-pointer"
                                                                title="Move Lesson Up"
                                                            >
                                                                ▲
                                                            </button>
                                                            <button
                                                                type="button"
                                                                disabled={lIdx === sec.lessons.length - 1}
                                                                onClick={() => handleMoveLesson(sec._id, lIdx, 'down')}
                                                                className="text-[10px] text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 disabled:opacity-20 leading-none cursor-pointer"
                                                                title="Move Lesson Down"
                                                            >
                                                                ▼
                                                            </button>
                                                        </div>
                                                        <span className="font-semibold text-xs text-slate-700 dark:text-slate-200">
                                                            Lesson {lIdx + 1}: {les.title} ({les.durationMinutes} mins)
                                                        </span>
                                                    </div>
                                                    <div className="space-x-1.5 flex items-center">
                                                        <button
                                                            onClick={() => setActiveLessonId(activeLessonId === les._id ? null : les._id)}
                                                            className="text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 px-2.5 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 font-medium cursor-pointer"
                                                        >
                                                            {activeLessonId === les._id ? 'Cancel Item' : '+ Add Content'}
                                                        </button>
                                                        <button
                                                            onClick={() => setQuizLessonId(les._id)}
                                                            className="text-xs bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 px-2.5 py-1.5 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 font-medium flex items-center gap-1 cursor-pointer"
                                                        >
                                                            <AcademicCapIcon className="w-3.5 h-3.5" />
                                                            <span>Quiz</span>
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleDeleteLesson(sec._id, les._id)}
                                                            className="text-xs text-rose-500 hover:text-rose-700 p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                                                            title="Delete Lesson"
                                                        >
                                                            <TrashIcon className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Lesson items preview */}
                                                {les.items && les.items.length > 0 && (
                                                    <div className="mt-2 pl-3 border-l-2 border-blue-500 dark:border-blue-400 space-y-1.5">
                                                        {les.items.map((item: CourseLessonItem) => (
                                                            <div key={item._id} className="text-xs text-gray-600 dark:text-gray-400 flex items-center justify-between group py-1 px-2 rounded-lg bg-white/70 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800">
                                                                <div className="flex items-center gap-2 truncate min-w-0">
                                                                    <span className="uppercase font-mono text-[10px] bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-semibold px-1.5 py-0.5 rounded shrink-0">
                                                                        {item.type}
                                                                    </span>
                                                                    <span className="truncate">
                                                                        {item.type === 'text' ? item.content.text : item.content.url}
                                                                    </span>
                                                                </div>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleDeleteItem(sec._id, les._id, item._id)}
                                                                    className="text-gray-400 hover:text-rose-600 p-1 transition-colors cursor-pointer shrink-0 ml-2"
                                                                    title="Delete this content item"
                                                                >
                                                                    <TrashIcon className="w-3.5 h-3.5" />
                                                                </button>
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
                                                                    className="bg-gray-800 dark:bg-gray-700 text-white text-xs px-4 py-1.5 rounded font-medium hover:bg-gray-900 dark:hover:bg-gray-600 ml-auto cursor-pointer"
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
                                        <div className="p-4.5 bg-blue-50/40 dark:bg-blue-950/20 rounded-xl border border-blue-200 dark:border-blue-800/60 space-y-4">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-bold text-blue-900 dark:text-blue-200 uppercase tracking-wider">
                                                    New Lesson
                                                </span>
                                                <span className="text-[11px] text-gray-500 dark:text-gray-400">
                                                    Title, duration, and optional content in one step
                                                </span>
                                            </div>

                                            {/* Row 1: Title and Duration */}
                                            <div className="flex flex-wrap sm:flex-nowrap gap-3 items-center">
                                                <input
                                                    type="text"
                                                    required
                                                    placeholder="Lesson title (e.g. Introduction & Setup)..."
                                                    value={newLessonTitle}
                                                    onChange={(e) => setNewLessonTitle(e.target.value)}
                                                    className="flex-1 min-w-[220px] bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                />
                                                <div className="flex items-center gap-1.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-1.5 shrink-0">
                                                    <ClockIcon className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                                                    <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Duration:</span>
                                                    <input
                                                        type="number"
                                                        required
                                                        min="1"
                                                        max="600"
                                                        placeholder="10"
                                                        value={newLessonDuration}
                                                        onChange={(e) => setNewLessonDuration(e.target.value)}
                                                        className="w-12 bg-transparent text-gray-900 dark:text-white text-sm font-medium focus:outline-none text-center"
                                                    />
                                                    <span className="text-xs text-gray-500 dark:text-gray-400">mins</span>
                                                </div>
                                            </div>

                                            {/* Row 2: Content Items (Support 1 or multiple attachments!) */}
                                            <div className="space-y-3 pt-2 border-t border-blue-100 dark:border-blue-900/40">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                                                        Lesson Content ({draftItems.filter((i) => i.content.trim()).length} attached)
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setDraftItems((prev) => [
                                                                ...prev,
                                                                { id: String(Date.now()), type: 'video', content: '' },
                                                            ])
                                                        }
                                                        className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 font-semibold flex items-center gap-1 cursor-pointer"
                                                    >
                                                        <PlusIcon className="w-3.5 h-3.5" />
                                                        <span>+ Add Another Content</span>
                                                    </button>
                                                </div>

                                                <div className="space-y-2.5">
                                                    {draftItems.map((item, idx) => (
                                                        <div
                                                            key={item.id}
                                                            className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 space-y-2 shadow-2xs"
                                                        >
                                                            <div className="flex items-center justify-between gap-2">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-[11px] font-mono text-gray-400 font-bold">
                                                                        #{idx + 1}
                                                                    </span>
                                                                    <select
                                                                        value={item.type}
                                                                        onChange={(e) => {
                                                                            const newType = e.target.value as DraftLessonItem['type'];
                                                                            setDraftItems((prev) =>
                                                                                prev.map((it) =>
                                                                                    it.id === item.id ? { ...it, type: newType } : it
                                                                                )
                                                                            );
                                                                        }}
                                                                        className="border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1 text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-white cursor-pointer"
                                                                    >
                                                                        <option value="video">🎥 Video URL</option>
                                                                        <option value="pdf">📄 PDF Document</option>
                                                                        <option value="link">🔗 External Link</option>
                                                                        <option value="text">📝 Article / Notes</option>
                                                                    </select>
                                                                </div>

                                                                {draftItems.length > 1 && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                            setDraftItems((prev) => prev.filter((it) => it.id !== item.id))
                                                                        }
                                                                        className="text-gray-400 hover:text-rose-500 p-1 rounded transition-colors cursor-pointer"
                                                                        title="Remove this content item"
                                                                    >
                                                                        <TrashIcon className="w-3.5 h-3.5" />
                                                                    </button>
                                                                )}
                                                            </div>

                                                            {item.type === 'text' ? (
                                                                <textarea
                                                                    rows={2}
                                                                    placeholder="Write article notes or markdown content..."
                                                                    value={item.content}
                                                                    onChange={(e) => {
                                                                        const val = e.target.value;
                                                                        setDraftItems((prev) =>
                                                                            prev.map((it) =>
                                                                                it.id === item.id ? { ...it, content: val } : it
                                                                            )
                                                                        );
                                                                    }}
                                                                    className="w-full bg-slate-50 dark:bg-gray-900 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 border border-gray-200 dark:border-gray-700 rounded-md p-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                                                                />
                                                            ) : (
                                                                <input
                                                                    type="url"
                                                                    placeholder={
                                                                        item.type === 'video'
                                                                            ? 'Paste video URL (YouTube, Vimeo, etc.)...'
                                                                            : item.type === 'pdf'
                                                                            ? 'Paste PDF URL (https://.../document.pdf)...'
                                                                            : 'Paste external link URL (https://...)...'
                                                                    }
                                                                    value={item.content}
                                                                    onChange={(e) => {
                                                                        const val = e.target.value;
                                                                        setDraftItems((prev) =>
                                                                            prev.map((it) =>
                                                                                it.id === item.id ? { ...it, content: val } : it
                                                                            )
                                                                        );
                                                                    }}
                                                                    className="w-full bg-slate-50 dark:bg-gray-900 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 border border-gray-200 dark:border-gray-700 rounded-md px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                                />
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Row 3: Action Buttons */}
                                            <div className="flex items-center justify-between pt-1">
                                                <span className="text-[11px] text-gray-400 dark:text-gray-500">
                                                    {draftItems.filter((i) => i.content.trim()).length === 0
                                                        ? 'Leave blank to create an outline lesson (content can be added later)'
                                                        : `Will create lesson with ${draftItems.filter((i) => i.content.trim()).length} attached item(s)`}
                                                </span>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => setActiveSectionId(null)}
                                                        className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition cursor-pointer"
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button
                                                        type="button"
                                                        disabled={!newLessonTitle.trim()}
                                                        onClick={(e) => handleAddLesson(e, sec._id, true)}
                                                        className="bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50 border border-blue-200 dark:border-blue-800 text-xs px-3.5 py-1.5 rounded-lg font-medium transition disabled:opacity-50 cursor-pointer shadow-2xs"
                                                    >
                                                        Save & Add Next
                                                    </button>
                                                    <button
                                                        type="button"
                                                        disabled={!newLessonTitle.trim()}
                                                        onClick={(e) => handleAddLesson(e, sec._id, false)}
                                                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-4 py-1.5 rounded-lg font-semibold transition disabled:opacity-50 cursor-pointer shadow-xs"
                                                    >
                                                        Save Lesson
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
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
        </div>
    );
}

export default CreateCourse;
