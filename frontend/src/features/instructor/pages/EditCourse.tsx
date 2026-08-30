import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { toast } from 'react-toastify';
import { FileUpload } from '@components/common';
import CourseFAQEditor from '../components/CourseFAQEditor';

const LEVEL_OPTIONS = [
    { label: 'Beginner', value: 'beginner' },
    { label: 'Intermediate', value: 'intermediate' },
    { label: 'Advanced', value: 'advanced' },
];

/**
 * EditCourse Page
 * Allows instructors to update course details (title, description, level, tags, price, thumbnail)
 */
function EditCourse() {
    const { courseId } = useParams<{ courseId: string }>();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [level, setLevel] = useState('beginner');
    const [tags, setTags] = useState<string[]>([]);
    const [tagInput, setTagInput] = useState('');
    const [isPaid, setIsPaid] = useState(false);
    const [price, setPrice] = useState<number | ''>('');
    const [thumbnailUrl, setThumbnailUrl] = useState('');

    useEffect(() => {
        if (!courseId) return;
        api.get(`/courses/${courseId}`)
            .then((res) => {
                const c = res.data.course;
                setTitle(c.title || '');
                setDescription(c.description || '');
                setLevel(c.level || 'beginner');
                setTags(c.tags || []);
                setIsPaid(c.isPaid || false);
                setPrice(c.price ?? '');
                setThumbnailUrl(c.thumbnailUrl || '');
            })
            .catch(() => {
                toast.error('Failed to load course');
                navigate('/instructor/courses');
            })
            .finally(() => setLoading(false));
    }, [courseId, navigate]);

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!courseId) return;

        setSaving(true);
        try {
            await api.patch(`/courses/${courseId}`, {
                title,
                description,
                level,
                tags,
                isPaid,
                price: isPaid ? Number(price) : 0,
                thumbnailUrl: thumbnailUrl || undefined,
            });
            toast.success('Course updated successfully!');
            navigate('/instructor/courses');
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to update course';
            toast.error(msg);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="text-gray-500">Loading course...</div>
            </div>
        );
    }

    return (
        <div className="max-w-2xl">
            {/* Header */}
            <div className="flex items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/instructor/courses')}
                        className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
                        title="Back to courses"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Edit Course</h1>
                        <p className="text-sm text-gray-500 mt-0.5">Update your course details, pricing, and FAQs</p>
                    </div>
                </div>
                {courseId && (
                    <a
                        href={`/courses/${courseId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-300 rounded-lg transition-colors border border-indigo-200 dark:border-indigo-800"
                    >
                        <span>Preview Course</span>
                        <span>↗</span>
                    </a>
                )}
            </div>

            <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 space-y-6">

                {/* Title */}
                <div>
                    <label htmlFor="edit-title" className="block text-sm font-medium text-gray-700 mb-2">
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
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g. Master ReactJS from scratch"
                    />
                </div>

                {/* Description */}
                <div>
                    <label htmlFor="edit-description" className="block text-sm font-medium text-gray-700 mb-2">
                        Description <span className="text-red-500">*</span>
                    </label>
                    <textarea
                        id="edit-description"
                        required
                        minLength={20}
                        rows={5}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Describe what students will learn..."
                    />
                </div>

                {/* Level */}
                <div>
                    <label htmlFor="edit-level" className="block text-sm font-medium text-gray-700 mb-2">
                        Level <span className="text-red-500">*</span>
                    </label>
                    <select
                        id="edit-level"
                        value={level}
                        onChange={(e) => setLevel(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        {LEVEL_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Tags */}
                <div>
                    <label htmlFor="edit-tags" className="block text-sm font-medium text-gray-700 mb-2">
                        Course Tags
                    </label>
                    <div className="flex gap-2">
                        <input
                            id="edit-tags"
                            type="text"
                            value={tagInput}
                            onChange={(e) => setTagInput(e.target.value)}
                            onKeyDown={handleTagKeyDown}
                            placeholder="e.g. React, TypeScript (press Enter to add)"
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
                        <div className="flex flex-wrap gap-1.5 mt-3">
                            {tags.map((t) => (
                                <span
                                    key={t}
                                    className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100"
                                >
                                    #{t}
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveTag(t)}
                                        className="text-blue-500 hover:text-red-500 ml-0.5 text-sm leading-none"
                                        title="Remove tag"
                                    >
                                        ×
                                    </button>
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                {/* Pricing */}
                <div className="border border-gray-100 rounded-lg p-4 space-y-4 bg-gray-50">
                    <div className="flex items-center gap-3">
                        <input
                            id="edit-ispaid"
                            type="checkbox"
                            checked={isPaid}
                            onChange={(e) => setIsPaid(e.target.checked)}
                            className="w-4 h-4 text-blue-600 rounded"
                        />
                        <label htmlFor="edit-ispaid" className="text-sm font-medium text-gray-700 cursor-pointer">
                            This is a paid course
                        </label>
                    </div>

                    {isPaid && (
                        <div>
                            <label htmlFor="edit-price" className="block text-sm font-medium text-gray-700 mb-2">
                                Price (USD) <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">$</span>
                                <input
                                    id="edit-price"
                                    type="number"
                                    min="1"
                                    step="0.01"
                                    required={isPaid}
                                    value={price}
                                    onChange={(e) => setPrice(Number(e.target.value))}
                                    className="w-full border border-gray-300 rounded-lg pl-8 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="29.99"
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Thumbnail */}
                <div>
                    <label htmlFor="edit-thumbnail" className="block text-sm font-medium text-gray-700 mb-2">
                        Thumbnail URL <span className="text-gray-400 font-normal">(optional)</span>
                    </label>
                    <FileUpload 
                        label="" 
                        accept="image/jpeg, image/png, image/webp" 
                        maxSizeMB={5}
                        onUploadSuccess={(url) => setThumbnailUrl(import.meta.env.VITE_API_BASE_URL + url)} 
                    />
                    {thumbnailUrl && (
                        <div className="mt-3 rounded-lg overflow-hidden border border-gray-200 aspect-video max-w-xs">
                            <img
                                src={thumbnailUrl}
                                alt="Thumbnail preview"
                                className="w-full h-full object-cover"
                                onError={(e) => (e.currentTarget.style.display = 'none')}
                            />
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-4 pt-2">
                    <button
                        type="submit"
                        disabled={saving}
                        id="save-course-btn"
                        className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-xs"
                    >
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button
                        type="button"
                        onClick={() => navigate('/instructor/courses')}
                        className="text-gray-500 hover:text-gray-700 text-sm font-medium transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            </form>

            {/* Course FAQ Management */}
            <div className="mt-10 pt-8 border-t border-gray-200">
                <CourseFAQEditor courseId={courseId!} />
            </div>
        </div>
    );
}

export default EditCourse;
