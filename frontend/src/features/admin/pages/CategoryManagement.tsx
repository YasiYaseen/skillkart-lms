import { useState, useEffect, useMemo } from 'react';
import { api } from '@/lib/api';
import { toast } from 'react-toastify';

export interface AdminCategory {
    _id: string;
    name: string;
    slug: string;
    icon: string;
    description: string;
    gradient?: string;
    tagQuery?: string;
    tags: string[];
    order: number;
    isActive: boolean;
    courseCount?: number;
    publishedCount?: number;
    createdAt?: string;
}

const GRADIENT_PRESETS = [
    { label: 'Blue Sky', value: 'from-blue-600/15 via-sky-600/10 to-indigo-900/5 border-blue-500/20 text-blue-600 dark:text-blue-400' },
    { label: 'Emerald Mint', value: 'from-emerald-600/15 via-teal-600/10 to-emerald-900/5 border-emerald-500/20 text-emerald-600 dark:text-emerald-400' },
    { label: 'Rose Pink', value: 'from-rose-600/15 via-pink-600/10 to-rose-900/5 border-rose-500/20 text-rose-600 dark:text-rose-400' },
    { label: 'Purple Violet', value: 'from-purple-600/15 via-violet-600/10 to-purple-900/5 border-purple-500/20 text-purple-600 dark:text-purple-400' },
    { label: 'Amber Gold', value: 'from-amber-600/15 via-orange-600/10 to-amber-900/5 border-amber-500/20 text-amber-600 dark:text-amber-400' },
    { label: 'Cyan Ocean', value: 'from-cyan-600/15 via-blue-600/10 to-cyan-900/5 border-cyan-500/20 text-cyan-600 dark:text-cyan-400' },
    { label: 'Warm Orange', value: 'from-orange-600/15 via-amber-600/10 to-red-900/5 border-orange-500/20 text-orange-600 dark:text-orange-400' },
    { label: 'Indigo Royal', value: 'from-indigo-600/15 via-purple-600/10 to-indigo-900/5 border-indigo-500/20 text-indigo-600 dark:text-indigo-400' },
];

export function CategoryManagement() {
    const [categories, setCategories] = useState<AdminCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<AdminCategory | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        icon: '📚',
        description: '',
        gradient: GRADIENT_PRESETS[0].value,
        tagQuery: '',
        tagsString: '',
        order: 0,
        isActive: true,
    });
    const [saving, setSaving] = useState(false);

    const fetchCategories = async () => {
        try {
            setLoading(true);
            const res = await api.get<{ categories: AdminCategory[] }>('/categories/admin/all');
            setCategories(res.data.categories || []);
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to load categories';
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    const handleOpenCreate = () => {
        setEditingCategory(null);
        setFormData({
            name: '',
            slug: '',
            icon: '📚',
            description: '',
            gradient: GRADIENT_PRESETS[0].value,
            tagQuery: '',
            tagsString: '',
            order: categories.length + 1,
            isActive: true,
        });
        setModalOpen(true);
    };

    const handleOpenEdit = (cat: AdminCategory) => {
        setEditingCategory(cat);
        setFormData({
            name: cat.name,
            slug: cat.slug,
            icon: cat.icon || '📚',
            description: cat.description || '',
            gradient: cat.gradient || GRADIENT_PRESETS[0].value,
            tagQuery: cat.tagQuery || cat.name,
            tagsString: (cat.tags || []).join(', '),
            order: cat.order || 0,
            isActive: cat.isActive !== false,
        });
        setModalOpen(true);
    };

    const handleNameChange = (name: string) => {
        const autoSlug = name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');

        setFormData((prev) => ({
            ...prev,
            name,
            slug: editingCategory ? prev.slug : autoSlug,
            tagQuery: editingCategory ? prev.tagQuery : name,
        }));
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setSaving(true);
            const tags = formData.tagsString
                .split(',')
                .map((t) => t.trim())
                .filter(Boolean);

            const payload = {
                name: formData.name.trim(),
                slug: formData.slug.trim().toLowerCase(),
                icon: formData.icon.trim(),
                description: formData.description.trim(),
                gradient: formData.gradient,
                tagQuery: formData.tagQuery.trim(),
                tags,
                order: Number(formData.order) || 0,
                isActive: formData.isActive,
            };

            if (editingCategory) {
                await api.put(`/categories/admin/${editingCategory._id}`, payload);
                toast.success(`Category "${payload.name}" updated successfully!`);
            } else {
                await api.post('/categories/admin', payload);
                toast.success(`Category "${payload.name}" created successfully!`);
            }

            setModalOpen(false);
            fetchCategories();
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to save category';
            toast.error(msg);
        } finally {
            setSaving(false);
        }
    };

    const handleToggleStatus = async (cat: AdminCategory) => {
        try {
            const updatedStatus = !cat.isActive;
            await api.put(`/categories/admin/${cat._id}`, { isActive: updatedStatus });
            toast.success(`Category "${cat.name}" is now ${updatedStatus ? 'Active' : 'Inactive'}`);
            setCategories((prev) =>
                prev.map((c) => (c._id === cat._id ? { ...c, isActive: updatedStatus } : c))
            );
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to update status';
            toast.error(msg);
        }
    };

    const handleDelete = async (cat: AdminCategory) => {
        if (!window.confirm(`Are you sure you want to delete the category "${cat.name}"?`)) {
            return;
        }

        try {
            await api.delete(`/categories/admin/${cat._id}`);
            toast.success(`Category "${cat.name}" deleted successfully!`);
            setCategories((prev) => prev.filter((c) => c._id !== cat._id));
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to delete category';
            toast.error(msg);
        }
    };

    const filteredCategories = useMemo(() => {
        if (!searchQuery.trim()) return categories;
        const q = searchQuery.toLowerCase();
        return categories.filter(
            (c) =>
                c.name.toLowerCase().includes(q) ||
                c.slug.toLowerCase().includes(q) ||
                (c.description && c.description.toLowerCase().includes(q))
        );
    }, [categories, searchQuery]);

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2.5">
                        <span>🏷️</span>
                        <span>Category & Skill Tracks Management</span>
                    </h1>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Configure learning categories, icons, search affinities, and visual themes shown across Learner Home & Course Discovery.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={handleOpenCreate}
                        className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-blue-500/20 flex items-center gap-2 cursor-pointer"
                    >
                        <span>+ Add Category</span>
                    </button>
                </div>
            </div>

            {/* Filter bar */}
            <div className="flex items-center justify-between gap-4 bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-2xs">
                <div className="relative w-full sm:w-80">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search categories or slugs..."
                        className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="absolute left-3 top-2.5 text-gray-400 text-xs">🔍</span>
                </div>

                <div className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                    Total: {categories.length} Categories ({categories.filter((c) => c.isActive).length} Active)
                </div>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-2xs">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/40 text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                <th className="py-3.5 px-4 w-12 text-center">#</th>
                                <th className="py-3.5 px-4">Category</th>
                                <th className="py-3.5 px-4">Slug & Tag Affinities</th>
                                <th className="py-3.5 px-4">Description</th>
                                <th className="py-3.5 px-4 text-center">Courses</th>
                                <th className="py-3.5 px-4 text-center">Status</th>
                                <th className="py-3.5 px-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-xs">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="text-center py-12 text-gray-400">
                                        Loading categories...
                                    </td>
                                </tr>
                            ) : filteredCategories.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="text-center py-12 text-gray-400">
                                        No categories found. Click "+ Add Category" to create one.
                                    </td>
                                </tr>
                            ) : (
                                filteredCategories.map((cat) => (
                                    <tr key={cat._id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                                        <td className="py-3.5 px-4 text-center font-mono font-bold text-gray-400">
                                            {cat.order}
                                        </td>
                                        <td className="py-3.5 px-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-lg shrink-0 shadow-2xs">
                                                    {cat.icon}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-900 dark:text-white text-sm">{cat.name}</p>
                                                    <span className="text-[10px] text-gray-400 font-mono">ID: {cat._id.slice(-6)}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-3.5 px-4">
                                            <div className="space-y-1">
                                                <span className="inline-block px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-mono text-[11px]">
                                                    /{cat.slug}
                                                </span>
                                                {cat.tags && cat.tags.length > 0 && (
                                                    <p className="text-[10px] text-gray-400 line-clamp-1">
                                                        Tags: {cat.tags.slice(0, 4).join(', ')} {cat.tags.length > 4 && `+${cat.tags.length - 4}`}
                                                    </p>
                                                )}
                                            </div>
                                        </td>
                                        <td className="py-3.5 px-4 max-w-xs">
                                            <p className="text-gray-600 dark:text-gray-300 line-clamp-2 text-xs">
                                                {cat.description || 'No description provided.'}
                                            </p>
                                        </td>
                                        <td className="py-3.5 px-4 text-center">
                                            <a
                                                href={`/courses?category=${cat.slug}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold font-mono text-xs hover:bg-blue-100 dark:hover:bg-blue-900/80 transition-colors border border-blue-200 dark:border-blue-800"
                                                title="Drill down to courses in this category"
                                            >
                                                <span>{cat.courseCount ?? 0}</span>
                                                <span className="text-[10px] opacity-70">↗</span>
                                            </a>
                                        </td>
                                        <td className="py-3.5 px-4 text-center">
                                            <button
                                                onClick={() => handleToggleStatus(cat)}
                                                className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-colors cursor-pointer ${
                                                    cat.isActive
                                                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                                                        : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                                                }`}
                                            >
                                                {cat.isActive ? 'Active' : 'Inactive'}
                                            </button>
                                        </td>
                                        <td className="py-3.5 px-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleOpenEdit(cat)}
                                                    className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-blue-900/40 text-gray-700 dark:text-gray-300 hover:text-blue-600 text-xs font-semibold transition-colors cursor-pointer"
                                                    title="Edit Category"
                                                >
                                                    ✏️ Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(cat)}
                                                    className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-rose-50 dark:hover:bg-rose-900/40 text-gray-700 dark:text-gray-300 hover:text-rose-600 text-xs font-semibold transition-colors cursor-pointer"
                                                    title="Delete Category"
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal for Create / Edit */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-150 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <span>{formData.icon}</span>
                                <span>{editingCategory ? 'Edit Category' : 'Create New Category'}</span>
                            </h3>
                            <button
                                onClick={() => setModalOpen(false)}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-sm p-1"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="space-y-4 text-xs">
                            <div className="grid grid-cols-4 gap-3">
                                <div className="col-span-1">
                                    <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                                        Icon / Emoji
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.icon}
                                        onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                                        className="w-full text-center text-lg p-2 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white"
                                        placeholder="💼"
                                        required
                                    />
                                </div>
                                <div className="col-span-3">
                                    <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                                        Category Name
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => handleNameChange(e.target.value)}
                                        className="w-full p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white font-medium"
                                        placeholder="e.g. Business & Leadership"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                                        URL Slug
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.slug}
                                        onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                                        className="w-full p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white font-mono"
                                        placeholder="business-leadership"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                                        Display Order
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.order}
                                        onChange={(e) => setFormData({ ...formData, order: Number(e.target.value) })}
                                        className="w-full p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white"
                                        placeholder="1"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                                    Description
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white h-20 resize-none"
                                    placeholder="Brief summary of skills, tools, and courses in this track..."
                                />
                            </div>

                            <div>
                                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                                    Associated Tags / Keywords (comma separated)
                                </label>
                                <input
                                    type="text"
                                    value={formData.tagsString}
                                    onChange={(e) => setFormData({ ...formData, tagsString: e.target.value })}
                                    className="w-full p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white"
                                    placeholder="business, leadership, management, startup, agile"
                                />
                            </div>

                            <div>
                                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                                    Visual Gradient Card Theme
                                </label>
                                <select
                                    value={formData.gradient}
                                    onChange={(e) => setFormData({ ...formData, gradient: e.target.value })}
                                    className="w-full p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white"
                                >
                                    {GRADIENT_PRESETS.map((g) => (
                                        <option key={g.label} value={g.value}>
                                            {g.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex items-center gap-2 pt-2">
                                <input
                                    type="checkbox"
                                    id="isActive"
                                    checked={formData.isActive}
                                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                    className="w-4 h-4 text-blue-600 rounded-md"
                                />
                                <label htmlFor="isActive" className="font-semibold text-gray-700 dark:text-gray-300 cursor-pointer">
                                    Active (visible on learner discovery feed and catalog)
                                </label>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                                <button
                                    type="button"
                                    onClick={() => setModalOpen(false)}
                                    className="px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all shadow-md shadow-blue-500/20 disabled:opacity-50"
                                >
                                    {saving ? 'Saving...' : editingCategory ? 'Save Changes' : 'Create Category'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default CategoryManagement;
