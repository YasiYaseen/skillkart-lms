import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { FileUpload } from '@components/common';
import CourseFAQEditor from '../components/CourseFAQEditor';
import { QuizEditorModal } from '../components/QuizEditorModal';
import { BulkLessonUploadModal } from '../components/BulkLessonUploadModal';
import { useCurrency } from '@/context/CurrencyContext';
import { getErrorMessage } from '@/utils/errorUtils';
import {
    ClipboardDocumentListIcon,
    BookOpenIcon,
    QuestionMarkCircleIcon,
    PencilSquareIcon,
    ArrowUpTrayIcon,
    AcademicCapIcon,
    TrashIcon,
} from '@heroicons/react/20/solid';

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

interface RawCourseData {
    _id: string;
    title: string;
    description: string;
    level: string;
    tags: string[];
    whatYouWillLearn?: string[];
    prerequisites?: string[];
    isPaid: boolean;
    price: number | null;
    thumbnailUrl?: string;
    status: string;
    isApproved?: boolean;
    isActive?: boolean;
    sections?: Array<{
        _id: string;
        title: string;
        order: number;
    }>;
    lessons?: Array<{
        _id: string;
        title: string;
        section: string;
        order: number;
        durationMinutes: number;
    }>;
    lessonItems?: Array<{
        _id: string;
        lesson: string;
        type: string;
        content: { text?: string; url?: string };
        order: number;
    }>;
}

const LEVEL_OPTIONS = [
    { label: 'Beginner', value: 'beginner' },
    { label: 'Intermediate', value: 'intermediate' },
    { label: 'Advanced', value: 'advanced' },
];

function EditCourse() {
    const { courseId } = useParams<{ courseId: string }>();
    const navigate = useNavigate();
    const { currency, symbol } = useCurrency();

    const [activeTab, setActiveTab] = useState<'details' | 'curriculum' | 'faqs'>('details');

    const [loading, setLoading] = useState(true);
    const [savingDetails, setSavingDetails] = useState(false);

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
    const [isPaid, setIsPaid] = useState(false);
    const [price, setPrice] = useState<number | ''>('');
    const [thumbnailUrl, setThumbnailUrl] = useState('');
    const [courseStatus, setCourseStatus] = useState('draft');
    const [isApproved, setIsApproved] = useState<boolean | undefined>(undefined);

    useEffect(() => {
        api.get<{ categories: Array<{ id: string; name: string; icon: string; slug: string }> }>('/categories')
            .then((res) => {
                setAvailableCategories(res.data.categories || []);
            })
            .catch(() => {});
    }, []);

    const [sections, setSections] = useState<CourseSection[]>([]);
    const [newSectionTitle, setNewSectionTitle] = useState('');
    const [addingSection, setAddingSection] = useState(false);
    const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
    const [editingSectionTitle, setEditingSectionTitle] = useState('');

    const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
    const [newLessonTitle, setNewLessonTitle] = useState('');
    const [newLessonDuration, setNewLessonDuration] = useState<number>(10);
    const [addingLesson, setAddingLesson] = useState(false);

    const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
    const [editingLessonTitle, setEditingLessonTitle] = useState('');
    const [editingLessonDuration, setEditingLessonDuration] = useState<number>(10);

    const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
    const [newItemType, setNewItemType] = useState<'video' | 'pdf' | 'text' | 'link'>('video');
    const [newItemContent, setNewItemContent] = useState('');
    const [addingItem, setAddingItem] = useState(false);

    const [quizLessonId, setQuizLessonId] = useState<string | null>(null);
    const [bulkUploadSectionId, setBulkUploadSectionId] = useState<string | null>(null);
    const [bulkUploadSectionTitle, setBulkUploadSectionTitle] = useState('');

    const fetchCourseData = useCallback(async () => {
        if (!courseId) return;
        try {
            const res = await api.get<{ course: RawCourseData & { category?: { _id?: string; slug?: string } | string } }>(`/courses/${courseId}`);
            const c = res.data.course;

            setTitle(c.title || '');
            setDescription(c.description || '');
            const catVal = c.category
                ? typeof c.category === 'object'
                    ? c.category._id || c.category.slug || ''
                    : c.category
                : '';
            setCategory(catVal);
            setLevel(c.level || 'beginner');
            setTags(c.tags || []);
            setWhatYouWillLearn(c.whatYouWillLearn || []);
            setPrerequisites(c.prerequisites || []);
            setIsPaid(c.isPaid || false);
            setPrice(c.price ?? '');
            setThumbnailUrl(c.thumbnailUrl || '');
            setCourseStatus(c.status || 'draft');
            setIsApproved(c.isApproved);

            const rawSections = c.sections || [];
            const rawLessons = c.lessons || [];
            const rawItems = c.lessonItems || [];

            const structuredSections: CourseSection[] = rawSections.map((sec) => {
                const secLessons = rawLessons
                    .filter((l) => l.section === sec._id)
                    .sort((a, b) => (a.order || 0) - (b.order || 0))
                    .map((l) => {
                        const lItems = rawItems
                            .filter((item) => item.lesson === l._id)
                            .sort((a, b) => (a.order || 0) - (b.order || 0));
                        return {
                            _id: l._id,
                            title: l.title,
                            durationMinutes: l.durationMinutes || 0,
                            order: l.order || 0,
                            items: lItems,
                        };
                    });

                return {
                    _id: sec._id,
                    title: sec.title,
                    order: sec.order || 0,
                    lessons: secLessons,
                };
            }).sort((a, b) => (a.order || 0) - (b.order || 0));

            setSections(structuredSections);
        } catch {
            toast.error('Failed to load course');
            navigate('/instructor/courses');
        } finally {
            setLoading(false);
        }
    }, [courseId, navigate]);

    useEffect(() => {
        fetchCourseData();
    }, [fetchCourseData]);

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

    const handleSaveDetails = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!courseId) return;

        setSavingDetails(true);
        try {
            await api.patch(`/courses/${courseId}`, {
                title,
                description,
                category: category || undefined,
                level,
                tags,
                whatYouWillLearn,
                prerequisites,
                isPaid,
                price: isPaid ? Number(price) : 0,
                thumbnailUrl: thumbnailUrl || undefined,
            });
            toast.success('Course details updated successfully!');
        } catch (err: unknown) {
            toast.error(getErrorMessage(err, 'Failed to update course'));
        } finally {
            setSavingDetails(false);
        }
    };

    const handleAddSection = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!courseId || !newSectionTitle.trim()) return;
        setAddingSection(true);
        try {
            const res = await api.post(`/courses/${courseId}/sections`, {
                title: newSectionTitle.trim(),
                order: sections.length + 1,
            });
            setSections([...sections, { ...res.data.section, lessons: [] }]);
            setNewSectionTitle('');
            toast.success('Section added successfully');
        } catch (err: unknown) {
            toast.error(getErrorMessage(err, 'Failed to add section'));
        } finally {
            setAddingSection(false);
        }
    };

    const handleUpdateSectionTitle = async (sectionId: string) => {
        if (!editingSectionTitle.trim()) return;
        try {
            await api.patch(`/sections/${sectionId}`, {
                title: editingSectionTitle.trim(),
            });
            setSections(sections.map((s) => (s._id === sectionId ? { ...s, title: editingSectionTitle.trim() } : s)));
            setEditingSectionId(null);
            toast.success('Section updated');
        } catch {
            toast.error('Failed to update section');
        }
    };

    const handleDeleteSection = async (sectionId: string) => {
        if (!window.confirm('Are you sure you want to delete this section and all of its lessons?')) return;
        try {
            await api.delete(`/sections/${sectionId}`);
            setSections(sections.filter((s) => s._id !== sectionId));
            toast.success('Section deleted');
        } catch {
            toast.error('Failed to delete section');
        }
    };

    const handleAddLesson = async (e: React.FormEvent, sectionId: string) => {
        e.preventDefault();
        if (!newLessonTitle.trim()) return;
        setAddingLesson(true);
        try {
            const sec = sections.find((s) => s._id === sectionId);
            if (!sec) return;
            const res = await api.post(`/sections/${sectionId}/lessons`, {
                title: newLessonTitle.trim(),
                durationMinutes: Number(newLessonDuration) || 10,
                order: sec.lessons.length + 1,
            });
            const updatedSection: CourseSection = {
                ...sec,
                lessons: [...sec.lessons, { ...res.data.lesson, items: [] }],
            };
            setSections(sections.map((s) => (s._id === sectionId ? updatedSection : s)));
            setNewLessonTitle('');
            setNewLessonDuration(10);
            setActiveSectionId(null);
            toast.success('Lesson added');
        } catch {
            toast.error('Failed to add lesson');
        } finally {
            setAddingLesson(false);
        }
    };

    const handleUpdateLesson = async (sectionId: string, lessonId: string) => {
        if (!editingLessonTitle.trim()) return;
        try {
            await api.patch(`/lessons/${lessonId}`, {
                title: editingLessonTitle.trim(),
                durationMinutes: Number(editingLessonDuration) || 10,
            });
            setSections(
                sections.map((s) =>
                    s._id === sectionId
                        ? {
                              ...s,
                              lessons: s.lessons.map((l) =>
                                  l._id === lessonId
                                      ? { ...l, title: editingLessonTitle.trim(), durationMinutes: Number(editingLessonDuration) || 10 }
                                      : l
                              ),
                          }
                        : s
                )
            );
            setEditingLessonId(null);
            toast.success('Lesson updated');
        } catch {
            toast.error('Failed to update lesson');
        }
    };

    const handleDeleteLesson = async (sectionId: string, lessonId: string) => {
        if (!window.confirm('Delete this lesson?')) return;
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

    const handleAddItem = async (e: React.FormEvent, sectionId: string, lessonId: string) => {
        e.preventDefault();
        if (!newItemContent.trim()) {
            toast.warning('Content URL or text is required');
            return;
        }
        setAddingItem(true);
        try {
            const sec = sections.find((s) => s._id === sectionId);
            if (!sec) return;
            const lesson = sec.lessons.find((l) => l._id === lessonId);
            if (!lesson) return;

            let content: Record<string, string>;
            if (newItemType === 'video' || newItemType === 'link' || newItemType === 'pdf') {
                content = { url: newItemContent.trim() };
            } else {
                content = { text: newItemContent.trim() };
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
            toast.success('Content item added');
        } catch {
            toast.error('Failed to add content item');
        } finally {
            setAddingItem(false);
        }
    };

    const totalLectures = sections.reduce((acc, s) => acc + s.lessons.length, 0);
    const totalDurationMinutes = sections.reduce(
        (acc, s) => acc + s.lessons.reduce((lAcc, l) => lAcc + (l.durationMinutes || 0), 0),
        0
    );

    if (loading) {
        return (
            <div className="py-20 flex flex-col items-center justify-center space-y-3">
                <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Loading course editor...</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/instructor/courses')}
                        className="p-2 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors"
                        title="Back to courses"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Edit Course</h1>
                            <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold capitalize ${
                                courseStatus === 'published'
                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
                                    : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
                            }`}>
                                {courseStatus}
                            </span>
                            {isApproved !== undefined && (
                                <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                                    isApproved
                                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                                        : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                                }`}>
                                    {isApproved ? 'Approved' : 'Rejected'}
                                </span>
                            )}
                        </div>
                        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                            Manage course landing info, curriculum sections, lessons, assessments, and FAQs.
                        </p>
                    </div>
                </div>

                {courseId && (
                    <a
                        href={`/courses/${courseId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:text-blue-300 rounded-xl transition-colors border border-blue-200 dark:border-blue-800 self-start sm:self-auto shadow-2xs"
                    >
                        <span>Preview Course</span>
                        <span>↗</span>
                    </a>
                )}
            </div>

            <div className="flex items-center gap-2 border-b border-gray-200 dark:border-gray-800 pb-1">
                <button
                    type="button"
                    onClick={() => setActiveTab('details')}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                        activeTab === 'details'
                            ? 'bg-blue-600 text-white shadow-2xs'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                >
                    <ClipboardDocumentListIcon className="w-4 h-4" />
                    <span>Course Details</span>
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab('curriculum')}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                        activeTab === 'curriculum'
                            ? 'bg-blue-600 text-white shadow-2xs'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                >
                    <BookOpenIcon className="w-4 h-4" />
                    <span>Curriculum & Content</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-md ${
                        activeTab === 'curriculum' ? 'bg-blue-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                    }`}>
                        {sections.length} sec • {totalLectures} lessons
                    </span>
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab('faqs')}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                        activeTab === 'faqs'
                            ? 'bg-blue-600 text-white shadow-2xs'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                >
                    <QuestionMarkCircleIcon className="w-4 h-4" />
                    <span>FAQs & Support</span>
                </button>
            </div>

            {activeTab === 'details' && (
                <form onSubmit={handleSaveDetails} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xs p-6 md:p-8 space-y-6">
                    <div>
                        <label htmlFor="edit-title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Course Title <span className="text-red-500">*</span>
                        </label>
                        <input
                            id="edit-title"
                            type="text"
                            required
                            minLength={3}
                            maxLength={140}
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm"
                            placeholder="e.g. Complete React & TypeScript Bootcamp"
                        />
                    </div>

                    <div>
                        <label htmlFor="edit-description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Course Description <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            id="edit-description"
                            required
                            minLength={20}
                            rows={5}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm"
                            placeholder="Describe what students will learn in this course..."
                        />
                    </div>

                    <div>
                        <label htmlFor="edit-category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Primary Category / Learning Track
                        </label>
                        <select
                            id="edit-category"
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm"
                        >
                            <option value="">Select a Category Track (Optional / Auto-inferred)</option>
                            {availableCategories.map((c) => (
                                <option key={c.id || c.slug} value={c.id || c.slug}>
                                    {c.icon} {c.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Difficulty Level
                        </label>
                        <div className="grid grid-cols-3 gap-3">
                            {LEVEL_OPTIONS.map((opt) => (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => setLevel(opt.value)}
                                    className={`py-2.5 px-4 rounded-xl text-sm font-medium border text-center transition-all ${
                                        level === opt.value
                                            ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-semibold shadow-xs'
                                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-700 dark:text-gray-300'
                                    }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label htmlFor="edit-tags" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Tags & Topics
                        </label>
                        <div className="flex gap-2 mb-2">
                            <input
                                id="edit-tags"
                                type="text"
                                value={tagInput}
                                onChange={(e) => setTagInput(e.target.value)}
                                onKeyDown={handleTagKeyDown}
                                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm"
                                placeholder="Add a tag and press Enter"
                            />
                            <button
                                type="button"
                                onClick={handleAddTag}
                                className="px-4 py-2.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-xl text-sm font-medium transition-colors"
                            >
                                Add Tag
                            </button>
                        </div>
                        {tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                                {tags.map((tag) => (
                                    <span
                                        key={tag}
                                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs font-semibold rounded-full border border-indigo-100 dark:border-indigo-800"
                                    >
                                        #{tag}
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveTag(tag)}
                                            className="hover:text-indigo-900 dark:hover:text-indigo-100 font-bold"
                                        >
                                            ×
                                        </button>
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* What You'll Learn */}
                    <div>
                        <label htmlFor="edit-learn-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                            What You'll Learn <span className="text-xs text-gray-500 dark:text-gray-400 font-normal">(key outcomes / skills)</span>
                        </label>
                        <div className="flex gap-2">
                            <input
                                id="edit-learn-input"
                                type="text"
                                value={learnInput}
                                onChange={(e) => setLearnInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleAddLearnItem();
                                    }
                                }}
                                placeholder="e.g. Build production-ready fullstack applications"
                                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm"
                            />
                            <button
                                type="button"
                                onClick={handleAddLearnItem}
                                className="px-4 py-2.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-xl text-sm font-medium transition-colors"
                            >
                                + Add Outcome
                            </button>
                        </div>
                        {whatYouWillLearn.length > 0 && (
                            <ul className="mt-3 space-y-1.5">
                                {whatYouWillLearn.map((item, idx) => (
                                    <li key={idx} className="flex items-center justify-between text-xs bg-emerald-50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-300 px-3.5 py-2 rounded-xl border border-emerald-200 dark:border-emerald-800">
                                        <span className="flex items-center gap-2">
                                            <span className="text-emerald-600 font-bold">✓</span>
                                            <span>{item}</span>
                                        </span>
                                        <button
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
                        <label htmlFor="edit-prereq-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                            Prerequisites / Requirements <span className="text-xs text-gray-500 dark:text-gray-400 font-normal">(what students need to know before starting)</span>
                        </label>
                        <div className="flex gap-2">
                            <input
                                id="edit-prereq-input"
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
                                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm"
                            />
                            <button
                                type="button"
                                onClick={handleAddPrereqItem}
                                className="px-4 py-2.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-xl text-sm font-medium transition-colors"
                            >
                                + Add Requirement
                            </button>
                        </div>
                        {prerequisites.length > 0 && (
                            <ul className="mt-3 space-y-1.5">
                                {prerequisites.map((item, idx) => (
                                    <li key={idx} className="flex items-center justify-between text-xs bg-gray-50 dark:bg-gray-700/50 text-gray-800 dark:text-gray-300 px-3.5 py-2 rounded-xl border border-gray-200 dark:border-gray-600">
                                        <span className="flex items-center gap-2">
                                            <span className="text-gray-400">•</span>
                                            <span>{item}</span>
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => handleRemovePrereqItem(item)}
                                            className="text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 font-bold ml-2"
                                        >
                                            ×
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-700 space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Pricing Model</h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Offer your course for free or charge a one-time price</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={isPaid}
                                    onChange={(e) => setIsPaid(e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                                <span className="ml-3 text-xs font-semibold text-gray-900 dark:text-white">
                                    {isPaid ? 'Paid Course' : 'Free Course'}
                                </span>
                            </label>
                        </div>

                        {isPaid && (
                            <div>
                                <label htmlFor="edit-price" className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                                    Price ({symbol} {currency}) <span className="text-red-500">*</span>
                                </label>
                                <div className="relative rounded-xl shadow-xs">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                        <span className="text-gray-500 dark:text-gray-400 text-sm">{symbol}</span>
                                    </div>
                                    <input
                                        id="edit-price"
                                        type="number"
                                        min="1"
                                        max="999"
                                        step="0.01"
                                        required={isPaid}
                                        value={price}
                                        onChange={(e) => setPrice(e.target.value === '' ? '' : Number(e.target.value))}
                                        className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm font-semibold"
                                        placeholder="29.99"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Course Thumbnail
                        </label>
                        {thumbnailUrl && (
                            <div className="mb-4 relative w-48 aspect-video rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-xs">
                                <img src={thumbnailUrl} alt="Thumbnail preview" className="w-full h-full object-cover" />
                                <button
                                    type="button"
                                    onClick={() => setThumbnailUrl('')}
                                    className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-700"
                                >
                                    ×
                                </button>
                            </div>
                        )}
                        <FileUpload
                            accept="image/*"
                            onUploadSuccess={(url) => setThumbnailUrl(url)}
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <button
                            type="button"
                            onClick={() => navigate('/instructor/courses')}
                            className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={savingDetails}
                            className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-xs transition-colors disabled:opacity-50"
                        >
                            {savingDetails ? 'Saving Changes...' : 'Save Course Details'}
                        </button>
                    </div>
                </form>
            )}

            {activeTab === 'curriculum' && (
                <div className="space-y-6">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Curriculum Structure</h2>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                {sections.length} Section{sections.length !== 1 ? 's' : ''} • {totalLectures} Lesson{totalLectures !== 1 ? 's' : ''} • {totalDurationMinutes} mins total duration
                            </p>
                        </div>
                    </div>

                    <form onSubmit={handleAddSection} className="bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 rounded-2xl p-5 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                        <input
                            type="text"
                            placeholder="Enter new section title (e.g. Introduction & Fundamentals)..."
                            value={newSectionTitle}
                            onChange={(e) => setNewSectionTitle(e.target.value)}
                            required
                            className="flex-1 px-4 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        />
                        <button
                            type="submit"
                            disabled={addingSection || !newSectionTitle.trim()}
                            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors disabled:opacity-50 shrink-0 shadow-xs"
                        >
                            {addingSection ? 'Adding...' : '+ Add Section'}
                        </button>
                    </form>

                    <div className="space-y-6">
                        {sections.map((section, sIdx) => {
                            const sectionDuration = section.lessons.reduce((acc, l) => acc + (l.durationMinutes || 0), 0);
                            return (
                                <div key={section._id} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xs overflow-hidden">
                                    <div className="p-4 sm:p-5 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                        <div className="flex items-center gap-3">
                                            <span className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                                                {sIdx + 1}
                                            </span>
                                            {editingSectionId === section._id ? (
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="text"
                                                        value={editingSectionTitle}
                                                        onChange={(e) => setEditingSectionTitle(e.target.value)}
                                                        className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => handleUpdateSectionTitle(section._id)}
                                                        className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-indigo-600 text-white"
                                                    >
                                                        Save
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setEditingSectionId(null)}
                                                        className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            ) : (
                                                <div>
                                                    <h3 className="font-bold text-gray-900 dark:text-white text-base">
                                                        {section.title}
                                                    </h3>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                                        {section.lessons.length} lesson{section.lessons.length !== 1 ? 's' : ''} • {sectionDuration} mins
                                                    </p>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-2 self-end sm:self-auto">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setEditingSectionId(section._id);
                                                    setEditingSectionTitle(section.title);
                                                }}
                                                className="text-xs font-medium px-2 py-1.5 rounded-md text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center gap-1 cursor-pointer"
                                                title="Rename section"
                                            >
                                                <PencilSquareIcon className="w-3.5 h-3.5" />
                                                <span>Rename</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setBulkUploadSectionId(section._id);
                                                    setBulkUploadSectionTitle(section.title);
                                                }}
                                                className="text-xs font-semibold px-2.5 py-1.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors flex items-center gap-1 border border-blue-200 dark:border-blue-800 shadow-2xs cursor-pointer"
                                                title="Bulk add lessons via CSV or table"
                                            >
                                                <ArrowUpTrayIcon className="w-3.5 h-3.5" />
                                                <span>Bulk Upload</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setActiveSectionId(activeSectionId === section._id ? null : section._id)}
                                                className="text-xs font-semibold px-2.5 py-1.5 rounded-md bg-blue-600 text-white hover:bg-blue-500 transition-colors cursor-pointer shadow-2xs"
                                            >
                                                + Add Lesson
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleDeleteSection(section._id)}
                                                className="text-xs font-medium p-1.5 rounded-md text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                                                title="Delete section"
                                            >
                                                <TrashIcon className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>

                                    {activeSectionId === section._id && (
                                        <form onSubmit={(e) => handleAddLesson(e, section._id)} className="p-4 bg-blue-50/40 dark:bg-blue-950/20 border-b border-blue-100 dark:border-blue-900/40 flex flex-wrap items-center gap-3">
                                            <input
                                                type="text"
                                                placeholder="Lesson title..."
                                                value={newLessonTitle}
                                                onChange={(e) => setNewLessonTitle(e.target.value)}
                                                required
                                                className="flex-1 min-w-[200px] px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                            />
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-xs text-slate-500 dark:text-slate-400">Duration (mins):</span>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    max="300"
                                                    value={newLessonDuration}
                                                    onChange={(e) => setNewLessonDuration(Number(e.target.value))}
                                                    className="w-20 px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                                />
                                            </div>
                                            <button
                                                type="submit"
                                                disabled={addingLesson || !newLessonTitle.trim()}
                                                className="px-3.5 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-500 disabled:opacity-50 shadow-2xs cursor-pointer"
                                            >
                                                {addingLesson ? 'Adding...' : 'Save Lesson'}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setActiveSectionId(null)}
                                                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
                                            >
                                                Cancel
                                            </button>
                                        </form>
                                    )}

                                    <div className="divide-y divide-slate-100 dark:divide-slate-700/60">
                                        {section.lessons.map((lesson, lIdx) => (
                                            <div key={lesson._id} className="p-3.5 hover:bg-slate-50/50 dark:hover:bg-slate-700/20 transition-colors space-y-2.5">
                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                                    <div className="flex items-center gap-2.5">
                                                        <span className="text-xs text-slate-400 font-mono">
                                                            {sIdx + 1}.{lIdx + 1}
                                                        </span>
                                                        {editingLessonId === lesson._id ? (
                                                            <div className="flex items-center gap-2">
                                                                <input
                                                                    type="text"
                                                                    value={editingLessonTitle}
                                                                    onChange={(e) => setEditingLessonTitle(e.target.value)}
                                                                    className="px-2.5 py-1 text-xs rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                                                />
                                                                <input
                                                                    type="number"
                                                                    min="1"
                                                                    value={editingLessonDuration}
                                                                    onChange={(e) => setEditingLessonDuration(Number(e.target.value))}
                                                                    className="w-16 px-2 py-1 text-xs rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                                                />
                                                                <span className="text-xs text-slate-400">m</span>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleUpdateLesson(section._id, lesson._id)}
                                                                    className="text-xs font-semibold px-2 py-1 rounded bg-blue-600 text-white cursor-pointer"
                                                                >
                                                                    Save
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setEditingLessonId(null)}
                                                                    className="text-xs font-semibold px-2 py-1 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer"
                                                                >
                                                                    Cancel
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                                                                    {lesson.title}
                                                                </span>
                                                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 font-mono">
                                                                    {lesson.durationMinutes} mins
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="flex items-center gap-1.5 self-end sm:self-auto">
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setEditingLessonId(lesson._id);
                                                                setEditingLessonTitle(lesson.title);
                                                                setEditingLessonDuration(lesson.durationMinutes);
                                                            }}
                                                            className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-medium px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-1 cursor-pointer"
                                                            title="Edit lesson details"
                                                        >
                                                            <PencilSquareIcon className="w-3.5 h-3.5" />
                                                            <span>Edit</span>
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => setQuizLessonId(lesson._id)}
                                                            className="text-xs font-semibold px-2 py-1 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors flex items-center gap-1 border border-blue-200 dark:border-blue-800 cursor-pointer"
                                                            title="Add or edit assessment quiz"
                                                        >
                                                            <AcademicCapIcon className="w-3.5 h-3.5" />
                                                            <span>Quiz</span>
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => setActiveLessonId(activeLessonId === lesson._id ? null : lesson._id)}
                                                            className="text-xs font-semibold px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition-colors cursor-pointer"
                                                        >
                                                            + Content
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleDeleteLesson(section._id, lesson._id)}
                                                            className="text-xs text-rose-500 hover:text-rose-700 font-medium p-1 rounded hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer"
                                                            title="Delete lesson"
                                                        >
                                                            <TrashIcon className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                </div>

                                                {lesson.items && lesson.items.length > 0 && (
                                                    <div className="pl-6 space-y-1.5">
                                                        {lesson.items.map((item) => (
                                                            <div key={item._id} className="flex items-center justify-between text-xs py-1.5 px-3 rounded-lg bg-gray-50 dark:bg-gray-900/40 border border-gray-100 dark:border-gray-700/60">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="font-semibold uppercase text-[10px] px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                                                                        {item.type}
                                                                    </span>
                                                                    <span className="text-gray-700 dark:text-gray-300 truncate max-w-sm">
                                                                        {item.content.url || item.content.text || 'Attached item'}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}

                                                {activeLessonId === lesson._id && (
                                                    <form onSubmit={(e) => handleAddItem(e, section._id, lesson._id)} className="p-3.5 bg-blue-50/40 dark:bg-blue-950/20 rounded-xl border border-blue-100 dark:border-blue-900/40 space-y-3">
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Item Type:</span>
                                                            {(['video', 'pdf', 'text', 'link'] as const).map((t) => (
                                                                <label key={t} className="flex items-center gap-1.5 text-xs text-gray-700 dark:text-gray-300 cursor-pointer capitalize">
                                                                    <input
                                                                        type="radio"
                                                                        name={`itemType-${lesson._id}`}
                                                                        value={t}
                                                                        checked={newItemType === t}
                                                                        onChange={() => setNewItemType(t)}
                                                                        className="accent-indigo-600"
                                                                    />
                                                                    <span>{t}</span>
                                                                </label>
                                                            ))}
                                                        </div>

                                                        {newItemType === 'video' && (
                                                            <div className="space-y-2">
                                                                <input
                                                                    type="url"
                                                                    placeholder="Enter YouTube, Vimeo, or video URL..."
                                                                    value={newItemContent}
                                                                    onChange={(e) => setNewItemContent(e.target.value)}
                                                                    className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                                                />
                                                                <p className="text-[11px] text-gray-500 dark:text-gray-400">Or upload video file directly:</p>
                                                                <FileUpload
                                                                    accept="video/*"
                                                                    onUploadSuccess={(url) => setNewItemContent(url)}
                                                                />
                                                            </div>
                                                        )}

                                                        {newItemType === 'pdf' && (
                                                            <div className="space-y-2">
                                                                <input
                                                                    type="url"
                                                                    placeholder="Enter PDF or document URL..."
                                                                    value={newItemContent}
                                                                    onChange={(e) => setNewItemContent(e.target.value)}
                                                                    className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                                                />
                                                                <FileUpload
                                                                    accept=".pdf,.doc,.docx"
                                                                    onUploadSuccess={(url) => setNewItemContent(url)}
                                                                />
                                                            </div>
                                                        )}

                                                        {newItemType === 'text' && (
                                                            <textarea
                                                                placeholder="Enter markdown lesson notes or text..."
                                                                rows={3}
                                                                value={newItemContent}
                                                                onChange={(e) => setNewItemContent(e.target.value)}
                                                                className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                                            />
                                                        )}

                                                        {newItemType === 'link' && (
                                                            <input
                                                                type="url"
                                                                placeholder="Enter resource or reference URL..."
                                                                value={newItemContent}
                                                                onChange={(e) => setNewItemContent(e.target.value)}
                                                                className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                                            />
                                                        )}

                                                        <div className="flex justify-end gap-2">
                                                            <button
                                                                type="button"
                                                                onClick={() => setActiveLessonId(null)}
                                                                className="px-3 py-1.5 rounded-lg text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                                                            >
                                                                Cancel
                                                            </button>
                                                            <button
                                                                type="submit"
                                                                disabled={addingItem || !newItemContent.trim()}
                                                                className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold disabled:opacity-50"
                                                            >
                                                                {addingItem ? 'Adding...' : 'Attach Item'}
                                                            </button>
                                                        </div>
                                                    </form>
                                                )}
                                            </div>
                                        ))}

                                        {section.lessons.length === 0 && (
                                            <div className="p-6 text-center text-xs text-slate-400 dark:text-slate-500 italic">
                                                No lessons in this section yet. Click &ldquo;+ Add Lesson&rdquo; or &ldquo;Bulk Upload&rdquo; above.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}

                        {sections.length === 0 && (
                            <div className="p-12 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                                <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-2">
                                    <BookOpenIcon className="w-6 h-6" />
                                </div>
                                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">No Curriculum Sections</h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-sm mx-auto">
                                    Start building your course by adding your first section above.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'faqs' && courseId && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xs p-6 md:p-8">
                    <CourseFAQEditor courseId={courseId} />
                </div>
            )}

            <QuizEditorModal
                isOpen={Boolean(quizLessonId)}
                onClose={() => setQuizLessonId(null)}
                lessonId={quizLessonId}
            />

            {bulkUploadSectionId && (
                <BulkLessonUploadModal
                    isOpen={Boolean(bulkUploadSectionId)}
                    onClose={() => setBulkUploadSectionId(null)}
                    sectionId={bulkUploadSectionId}
                    sectionTitle={bulkUploadSectionTitle}
                    onSuccess={() => {
                        fetchCourseData();
                        setBulkUploadSectionId(null);
                    }}
                />
            )}
        </div>
    );
}

export default EditCourse;
