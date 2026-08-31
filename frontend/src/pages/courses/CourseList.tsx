import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { SearchBar, CourseCard, Button, Course } from '../../components/common';
import { api } from '@/lib/api';
import { useAuth } from '@/features/auth/AuthContext';
import CourseRecommendations from '@/components/course/CourseRecommendations';
import RecentlyViewedCourses from '@/components/course/RecentlyViewedCourses';
import {
    FolderIcon,
    GlobeAltIcon,
    TagIcon,
    StarIcon,
    SignalIcon,
    CurrencyDollarIcon,
    ClockIcon,
    MagnifyingGlassIcon,
    FunnelIcon,
    AdjustmentsHorizontalIcon,
    Squares2X2Icon,
    ListBulletIcon,
    XMarkIcon,
    CheckIcon,
} from '@heroicons/react/20/solid';

const LEVEL_OPTIONS = [
    { label: 'All Levels', value: '' },
    { label: 'Beginner', value: 'beginner' },
    { label: 'Intermediate', value: 'intermediate' },
    { label: 'Advanced', value: 'advanced' },
];

const PRICE_OPTIONS = [
    { label: 'All Prices', value: '' },
    { label: 'Free Only', value: 'free' },
    { label: 'Under $20', value: 'under-20' },
    { label: 'Under $50', value: 'under-50' },
    { label: 'Paid', value: 'paid' },
];

const RATING_OPTIONS = [
    { label: 'All Ratings', value: '' },
    { label: '4.5 ★ & above', value: '4.5' },
    { label: '4.0 ★ & above', value: '4.0' },
    { label: '3.5 ★ & above', value: '3.5' },
];

const DURATION_OPTIONS = [
    { label: 'Any Duration', value: '' },
    { label: 'Short (< 2 hrs)', value: 'short' },
    { label: 'Medium (2–5 hrs)', value: 'medium' },
    { label: 'Long (5+ hrs)', value: 'long' },
];

const SORT_OPTIONS = [
    { label: 'Most Popular', value: 'popular' },
    { label: 'Newest Releases', value: 'latest' },
    { label: 'Highest Rated', value: 'highest-rated' },
    { label: 'Price: Low to High', value: 'price-low' },
    { label: 'Price: High to Low', value: 'price-high' },
];

interface RawApiCourse {
    _id: string;
    title: string;
    instructor?: { name?: string };
    thumbnailUrl?: string;
    tags?: string[];
    averageRating?: number;
    reviewCount?: number;
    price?: number;
    level?: string;
    enrollmentCount?: number;
    durationMinutes?: number;
    totalLessons?: number;
}

interface CategoryInfo {
    id: string;
    name: string;
    slug: string;
    icon: string;
    description?: string;
    tags: string[];
    courseCount?: number;
}

function CourseCardSkeleton() {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden shadow-xs animate-pulse">
            <div className="aspect-video bg-gray-200 dark:bg-gray-700 w-full" />
            <div className="p-5 space-y-3">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                <div className="h-3 bg-gray-100 dark:bg-gray-700/60 rounded w-1/3" />
                <div className="flex gap-1.5 pt-1">
                    <div className="h-4 bg-gray-100 dark:bg-gray-700/60 rounded w-12" />
                    <div className="h-4 bg-gray-100 dark:bg-gray-700/60 rounded w-14" />
                </div>
                <div className="pt-3 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20" />
                    <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-14" />
                </div>
            </div>
        </div>
    );
}

/**
 * CourseList Page
 * Advanced, UX-Friendly LMS Discovery Experience:
 * - Collapsible / Mobile-Drawer Filter Sidebar
 * - Hierarchical Categories $\rightarrow$ Contextual Sub-Topics
 * - Searchable "Browse All 100+ Skills" Modal
 * - Personalized User Interests Strip
 * - Multi-criteria Filtering (Level, Price, Rating, Duration, Sort)
 * - Grid / List View Modes
 */
function CourseList() {
    const [searchParams, setSearchParams] = useSearchParams();
    const { user } = useAuth();

    // Query states
    const [searchQuery, setSearchQuery] = useState(
        searchParams.get('search') || searchParams.get('q') || ''
    );
    const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
    const [selectedTag, setSelectedTag] = useState(searchParams.get('tag') || '');
    const [level, setLevel] = useState(searchParams.get('level') || '');
    const [priceTier, setPriceTier] = useState(searchParams.get('price') || '');
    const [minRating, setMinRating] = useState(searchParams.get('rating') || '');
    const [durationTier, setDurationTier] = useState(searchParams.get('duration') || '');
    const [sort, setSort] = useState(searchParams.get('sort') || 'popular');

    // UI View states
    const [showSidebar, setShowSidebar] = useState(true);
    const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [allSkillsModalOpen, setAllSkillsModalOpen] = useState(false);
    const [skillSearchTerm, setSkillSearchTerm] = useState('');

    // Data states
    const [courses, setCourses] = useState<Course[]>([]);
    const [availableCategories, setAvailableCategories] = useState<CategoryInfo[]>([]);
    const [availableTags, setAvailableTags] = useState<string[]>([]);
    const [allPlatformTags, setAllPlatformTags] = useState<string[]>([]);
    const [activeCategoryInfo, setActiveCategoryInfo] = useState<CategoryInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [visibleCount, setVisibleCount] = useState(9);

    // Fetch categories with live stats
    useEffect(() => {
        api.get<{ categories: CategoryInfo[] }>('/categories')
            .then((res) => {
                setAvailableCategories(res.data.categories || []);
            })
            .catch(() => {});
    }, []);

    // Sync state with URL params
    const updateQueryParams = useCallback((
        newSearch: string,
        newCat: string,
        newTag: string,
        newLevel: string,
        newPrice: string,
        newRating: string,
        newDuration: string,
        newSort: string
    ) => {
        const nextParams: Record<string, string> = {};
        if (newSearch) nextParams.search = newSearch;
        if (newCat) nextParams.category = newCat;
        if (newTag) nextParams.tag = newTag;
        if (newLevel) nextParams.level = newLevel;
        if (newPrice) nextParams.price = newPrice;
        if (newRating) nextParams.rating = newRating;
        if (newDuration) nextParams.duration = newDuration;
        if (newSort && newSort !== 'popular') nextParams.sort = newSort;
        setSearchParams(nextParams, { replace: true });
    }, [setSearchParams]);

    const fetchCourses = useCallback(async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (searchQuery) params.set('q', searchQuery);
            if (selectedCategory) params.set('category', selectedCategory);
            if (selectedTag) params.set('tag', selectedTag);
            if (level) params.set('level', level);
            if (priceTier) params.set('priceTier', priceTier);
            if (minRating) params.set('minRating', minRating);
            if (durationTier) params.set('durationTier', durationTier);
            if (sort) params.set('sort', sort);

            const res = await api.get(`/courses?${params.toString()}`);
            const data = res.data;
            const mappedCourses = (data.courses || []).map((c: RawApiCourse) => ({
                id: c._id,
                title: c.title,
                instructor: c.instructor?.name || 'Unknown Instructor',
                thumbnail: c.thumbnailUrl || 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400&h=300&fit=crop',
                tags: c.tags || [],
                rating: c.averageRating || 0,
                reviewCount: c.reviewCount || 0,
                price: c.price || 0,
                level: c.level || 'beginner',
                enrollmentCount: c.enrollmentCount || 0,
                durationMinutes: c.durationMinutes || 0,
                totalLessons: c.totalLessons || 0,
            }));
            setCourses(mappedCourses);

            if (data.tags && Array.isArray(data.tags)) {
                setAvailableTags(data.tags);
            }
            if (data.allPlatformTags && Array.isArray(data.allPlatformTags)) {
                setAllPlatformTags(data.allPlatformTags);
            }
            if (data.categoryInfo) {
                setActiveCategoryInfo(data.categoryInfo);
            } else {
                setActiveCategoryInfo(null);
            }
        } catch (err) {
            console.error('Failed to fetch courses:', err);
        } finally {
            setLoading(false);
        }
    }, [searchQuery, selectedCategory, selectedTag, level, priceTier, minRating, durationTier, sort]);

    useEffect(() => {
        fetchCourses();
        setVisibleCount(9);
    }, [fetchCourses]);

    const displayedCourses = courses.slice(0, visibleCount);
    const hasMore = visibleCount < courses.length;

    const handleLoadMore = () => {
        setVisibleCount((prev) => prev + 6);
    };

    // Filter handlers
    const handleCategorySelect = (catSlug: string) => {
        const nextCat = selectedCategory === catSlug ? '' : catSlug;
        setSelectedCategory(nextCat);
        setSelectedTag(''); // Reset tag on category switch
        setVisibleCount(9);
        updateQueryParams(searchQuery, nextCat, '', level, priceTier, minRating, durationTier, sort);
    };

    const handleTagSelect = (tag: string) => {
        const nextTag = selectedTag === tag ? '' : tag;
        setSelectedTag(nextTag);
        setVisibleCount(9);
        updateQueryParams(searchQuery, selectedCategory, nextTag, level, priceTier, minRating, durationTier, sort);
        if (allSkillsModalOpen) setAllSkillsModalOpen(false);
    };

    const handleLevelSelect = (lvl: string) => {
        const next = level === lvl ? '' : lvl;
        setLevel(next);
        setVisibleCount(9);
        updateQueryParams(searchQuery, selectedCategory, selectedTag, next, priceTier, minRating, durationTier, sort);
    };

    const handlePriceSelect = (pr: string) => {
        const next = priceTier === pr ? '' : pr;
        setPriceTier(next);
        setVisibleCount(9);
        updateQueryParams(searchQuery, selectedCategory, selectedTag, level, next, minRating, durationTier, sort);
    };

    const handleRatingSelect = (r: string) => {
        const next = minRating === r ? '' : r;
        setMinRating(next);
        setVisibleCount(9);
        updateQueryParams(searchQuery, selectedCategory, selectedTag, level, priceTier, next, durationTier, sort);
    };

    const handleDurationSelect = (d: string) => {
        const next = durationTier === d ? '' : d;
        setDurationTier(next);
        setVisibleCount(9);
        updateQueryParams(searchQuery, selectedCategory, selectedTag, level, priceTier, minRating, next, sort);
    };

    const handleSortChange = (newSort: string) => {
        setSort(newSort);
        setVisibleCount(9);
        updateQueryParams(searchQuery, selectedCategory, selectedTag, level, priceTier, minRating, durationTier, newSort);
    };

    const handleSearch = (query: string) => {
        setSearchQuery(query);
        setVisibleCount(9);
        updateQueryParams(query, selectedCategory, selectedTag, level, priceTier, minRating, durationTier, sort);
    };

    const handleClearAll = () => {
        setSelectedCategory('');
        setSelectedTag('');
        setLevel('');
        setPriceTier('');
        setMinRating('');
        setDurationTier('');
        setSort('popular');
        setSearchQuery('');
        setSearchParams({}, { replace: true });
    };

    // User's preferred interests
    const userInterests = useMemo(() => {
        return (user?.interests || []).filter(Boolean);
    }, [user]);

    // Active Category Doc
    const activeCat = useMemo(() => {
        if (!selectedCategory) return null;
        return (
            availableCategories.find(
                (c) => c.slug === selectedCategory || c.id === selectedCategory
            ) || activeCategoryInfo
        );
    }, [selectedCategory, availableCategories, activeCategoryInfo]);

    // Filter count calculation
    const activeFilterCount = [
        selectedCategory,
        selectedTag,
        level,
        priceTier,
        minRating,
        durationTier,
        searchQuery,
    ].filter(Boolean).length;

    // Filtered skills for modal search
    const filteredPlatformSkills = useMemo(() => {
        const pool = allPlatformTags.length > 0 ? allPlatformTags : availableTags;
        if (!skillSearchTerm.trim()) return pool;
        return pool.filter((t) => t.toLowerCase().includes(skillSearchTerm.toLowerCase()));
    }, [allPlatformTags, availableTags, skillSearchTerm]);

    // Sidebar Content Component (Shared between desktop and mobile drawer)
    const FilterSidebarContent = (
        <div className="space-y-5 text-xs">
            {/* 1. Disciplines & Categories */}
            <div>
                <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                        <FolderIcon className="w-3.5 h-3.5 text-slate-400" />
                        <span>Discipline</span>
                    </h3>
                    {selectedCategory && (
                        <button
                            onClick={() => handleCategorySelect('')}
                            className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-medium cursor-pointer"
                        >
                            Clear
                        </button>
                    )}
                </div>
                <div className="space-y-1">
                    <button
                        onClick={() => handleCategorySelect('')}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg font-medium transition-colors text-left cursor-pointer ${
                            selectedCategory === ''
                                ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-semibold border border-blue-200 dark:border-blue-800'
                                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                        }`}
                    >
                        <span className="flex items-center gap-2">
                            <GlobeAltIcon className="w-4 h-4 text-slate-400 shrink-0" />
                            <span>All Disciplines</span>
                        </span>
                    </button>

                    {availableCategories.map((cat) => {
                        const isSelected = selectedCategory === cat.slug || selectedCategory === cat.id;
                        return (
                            <button
                                key={cat.id || cat.slug}
                                onClick={() => handleCategorySelect(cat.slug || cat.id)}
                                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg font-medium transition-colors text-left cursor-pointer ${
                                    isSelected
                                        ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-semibold border border-blue-200 dark:border-blue-800'
                                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                                }`}
                            >
                                <span className="truncate pr-2">{cat.name}</span>
                                {cat.courseCount !== undefined && (
                                    <span className="text-[10px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-md shrink-0">
                                        {cat.courseCount}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* 2. Sub-Topics & Skills */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                        <TagIcon className="w-3.5 h-3.5 text-slate-400" />
                        <span>{activeCat ? `${activeCat.name.split('&')[0].trim()} Skills` : 'Skills & Topics'}</span>
                    </h3>
                    <button
                        onClick={() => setAllSkillsModalOpen(true)}
                        className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-medium cursor-pointer"
                    >
                        Browse all
                    </button>
                </div>

                <div className="flex flex-wrap gap-1.5">
                    {availableTags.slice(0, 8).map((tag) => {
                        const isSelected = selectedTag.toLowerCase() === tag.toLowerCase();
                        return (
                            <button
                                key={tag}
                                onClick={() => handleTagSelect(tag)}
                                className={`px-2.5 py-1 rounded-md text-xs transition-colors cursor-pointer ${
                                    isSelected
                                        ? 'bg-blue-600 text-white font-medium shadow-2xs'
                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200/50 dark:border-slate-700/50'
                                }`}
                            >
                                {tag}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* 3. Rating Filter */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                <h3 className="font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[11px] mb-2 flex items-center gap-1.5">
                    <StarIcon className="w-3.5 h-3.5 text-slate-400" />
                    <span>Student Rating</span>
                </h3>
                <div className="space-y-1">
                    {RATING_OPTIONS.map((opt) => (
                        <button
                            key={opt.value}
                            onClick={() => handleRatingSelect(opt.value)}
                            className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-left transition-colors cursor-pointer ${
                                minRating === opt.value
                                    ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 font-semibold border border-amber-200 dark:border-amber-800'
                                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                            }`}
                        >
                            <span>{opt.label}</span>
                            {minRating === opt.value && <CheckIcon className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />}
                        </button>
                    ))}
                </div>
            </div>

            {/* 4. Difficulty Level */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                <h3 className="font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[11px] mb-2 flex items-center gap-1.5">
                    <SignalIcon className="w-3.5 h-3.5 text-slate-400" />
                    <span>Experience Level</span>
                </h3>
                <div className="space-y-1">
                    {LEVEL_OPTIONS.map((opt) => (
                        <button
                            key={opt.value}
                            onClick={() => handleLevelSelect(opt.value)}
                            className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-left transition-colors cursor-pointer ${
                                level === opt.value
                                    ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-300 font-semibold border border-blue-200 dark:border-blue-800'
                                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                            }`}
                        >
                            <span>{opt.label}</span>
                            {level === opt.value && <CheckIcon className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />}
                        </button>
                    ))}
                </div>
            </div>

            {/* 5. Pricing & Offers */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                <h3 className="font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[11px] mb-2 flex items-center gap-1.5">
                    <CurrencyDollarIcon className="w-3.5 h-3.5 text-slate-400" />
                    <span>Pricing</span>
                </h3>
                <div className="space-y-1">
                    {PRICE_OPTIONS.map((opt) => (
                        <button
                            key={opt.value}
                            onClick={() => handlePriceSelect(opt.value)}
                            className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-left transition-colors cursor-pointer ${
                                priceTier === opt.value
                                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-300 font-semibold border border-emerald-200 dark:border-emerald-800'
                                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                            }`}
                        >
                            <span>{opt.label}</span>
                            {priceTier === opt.value && <CheckIcon className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />}
                        </button>
                    ))}
                </div>
            </div>

            {/* 6. Course Duration */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                <h3 className="font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[11px] mb-2 flex items-center gap-1.5">
                    <ClockIcon className="w-3.5 h-3.5 text-slate-400" />
                    <span>Commitment</span>
                </h3>
                <div className="space-y-1">
                    {DURATION_OPTIONS.map((opt) => (
                        <button
                            key={opt.value}
                            onClick={() => handleDurationSelect(opt.value)}
                            className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-left transition-colors cursor-pointer ${
                                durationTier === opt.value
                                    ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-300 font-semibold border border-blue-200 dark:border-blue-800'
                                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                            }`}
                        >
                            <span>{opt.label}</span>
                            {durationTier === opt.value && <CheckIcon className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />}
                        </button>
                    ))}
                </div>
            </div>

            {activeFilterCount > 0 && (
                <div className="pt-2">
                    <button
                        onClick={handleClearAll}
                        className="w-full py-2 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium text-center transition-colors cursor-pointer"
                    >
                        Reset All Filters
                    </button>
                </div>
            )}
        </div>
    );

    return (
        <div className="container py-8 space-y-6">
            {/* 1. Page Header & Quick Search */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                        {activeCat ? activeCat.name : 'Explore Courses'}
                    </h1>
                    <nav className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-1">
                        <Link to="/" className="hover:text-blue-600 dark:hover:text-blue-400">Home</Link>
                        <span>/</span>
                        <span>Courses</span>
                        {activeCat && (
                            <>
                                <span>/</span>
                                <span className="text-blue-600 dark:text-blue-400 font-medium">{activeCat.name}</span>
                            </>
                        )}
                    </nav>
                </div>

                {/* Search Bar */}
                <div className="w-full md:w-96">
                    <SearchBar
                        value={searchQuery}
                        onChange={setSearchQuery}
                        onSubmit={handleSearch}
                        placeholder={
                            activeCat
                                ? `Search in ${activeCat.name}...`
                                : 'Search skills, topics, or instructors...'
                        }
                    />
                </div>
            </div>

            {/* 2. Quick Presets Strip */}
            <div className="flex items-center gap-2 overflow-x-auto py-1">
                {userInterests.length > 0 && (
                    <div className="flex items-center gap-1.5 shrink-0 pr-2 border-r border-slate-200 dark:border-slate-800">
                        <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-1">
                            <StarIcon className="w-3.5 h-3.5" />
                            <span>For You:</span>
                        </span>
                        {userInterests.map((interest) => (
                            <button
                                key={interest}
                                onClick={() => handleTagSelect(interest)}
                                className={`text-xs font-medium px-2.5 py-1 rounded-md transition-colors shrink-0 cursor-pointer ${
                                    selectedTag.toLowerCase() === interest.toLowerCase()
                                        ? 'bg-amber-600 text-white'
                                        : 'bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 hover:bg-amber-100 border border-amber-200 dark:border-amber-800/60'
                                }`}
                            >
                                #{interest}
                            </button>
                        ))}
                    </div>
                )}

                <button
                    onClick={() => handlePriceSelect('free')}
                    className={`text-xs font-medium px-3 py-1 rounded-md transition-colors shrink-0 flex items-center gap-1 cursor-pointer ${
                        priceTier === 'free'
                            ? 'bg-emerald-600 text-white shadow-2xs'
                            : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 border border-slate-200 dark:border-slate-800'
                    }`}
                >
                    <span>Free Only</span>
                </button>

                <button
                    onClick={() => handleRatingSelect('4.5')}
                    className={`text-xs font-medium px-3 py-1 rounded-md transition-colors shrink-0 flex items-center gap-1 cursor-pointer ${
                        minRating === '4.5'
                            ? 'bg-amber-600 text-white shadow-2xs'
                            : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 border border-slate-200 dark:border-slate-800'
                    }`}
                >
                    <span>4.5+ Rating</span>
                </button>

                <button
                    onClick={() => handleLevelSelect('beginner')}
                    className={`text-xs font-medium px-3 py-1 rounded-md transition-colors shrink-0 flex items-center gap-1 cursor-pointer ${
                        level === 'beginner'
                            ? 'bg-blue-600 text-white shadow-2xs'
                            : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 border border-slate-200 dark:border-slate-800'
                    }`}
                >
                    <span>Beginner Friendly</span>
                </button>

                <button
                    onClick={() => setAllSkillsModalOpen(true)}
                    className="text-xs font-medium px-3 py-1 rounded-md transition-colors shrink-0 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 cursor-pointer ml-auto"
                >
                    <MagnifyingGlassIcon className="w-3.5 h-3.5 text-slate-400" />
                    <span>All Skills ({allPlatformTags.length > 0 ? allPlatformTags.length : '100+'})</span>
                </button>
            </div>

            {/* 3. Main Discovery Workspace (Sidebar + Grid) */}
            <div className="flex flex-col lg:flex-row gap-6 items-start">
                {/* Left Desktop Sidebar */}
                {showSidebar && (
                    <aside className="hidden lg:block w-64 xl:w-72 shrink-0 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-2xs sticky top-20">
                        {FilterSidebarContent}
                    </aside>
                )}

                {/* Right Courses Main Area */}
                <main className="flex-1 min-w-0 space-y-4">
                    {/* Top Toolbar */}
                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-3 shadow-2xs space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setMobileFilterOpen(true)}
                                    className="lg:hidden px-3 py-1.5 rounded-lg bg-blue-600 text-white font-medium text-xs flex items-center gap-1.5 shadow-2xs"
                                >
                                    <FunnelIcon className="w-3.5 h-3.5" />
                                    <span>Filters</span>
                                    {activeFilterCount > 0 && (
                                        <span className="w-4 h-4 rounded-full bg-white text-blue-600 flex items-center justify-center text-[10px] font-bold">
                                            {activeFilterCount}
                                        </span>
                                    )}
                                </button>

                                <button
                                    onClick={() => setShowSidebar(!showSidebar)}
                                    className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium text-xs transition-colors cursor-pointer"
                                >
                                    <AdjustmentsHorizontalIcon className="w-3.5 h-3.5 text-slate-400" />
                                    <span>{showSidebar ? 'Hide Filters' : 'Show Filters'}</span>
                                </button>

                                <span className="text-xs text-slate-500 dark:text-slate-400">
                                    {!loading && `${courses.length} ${courses.length === 1 ? 'course' : 'courses'} found`}
                                </span>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium hidden sm:inline">Sort:</span>
                                    <select
                                        value={sort}
                                        onChange={(e) => handleSortChange(e.target.value)}
                                        className="text-xs font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer"
                                    >
                                        {SORT_OPTIONS.map((opt) => (
                                            <option key={opt.value} value={opt.value}>
                                                {opt.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* View Switcher */}
                                <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
                                    <button
                                        onClick={() => setViewMode('grid')}
                                        className={`p-1.5 rounded-md text-xs transition-colors cursor-pointer ${
                                            viewMode === 'grid'
                                                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-2xs font-semibold'
                                                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                                        }`}
                                        title="Grid View"
                                    >
                                        <Squares2X2Icon className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => setViewMode('list')}
                                        className={`p-1.5 rounded-md text-xs transition-colors cursor-pointer ${
                                            viewMode === 'list'
                                                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-2xs font-semibold'
                                                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                                        }`}
                                        title="List View"
                                    >
                                        <ListBulletIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Active Filter Badges */}
                        {activeFilterCount > 0 && (
                            <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-slate-100 dark:border-slate-800">
                                <div className="flex flex-wrap items-center gap-1.5">
                                    {selectedCategory && (
                                        <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                            <span>Track: {activeCat?.name || selectedCategory}</span>
                                            <button onClick={() => handleCategorySelect('')} className="hover:text-rose-500 ml-0.5 cursor-pointer">
                                                <XMarkIcon className="w-3 h-3" />
                                            </button>
                                        </span>
                                    )}
                                    {selectedTag && (
                                        <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                            <span>#{selectedTag}</span>
                                            <button onClick={() => handleTagSelect('')} className="hover:text-rose-500 ml-0.5 cursor-pointer">
                                                <XMarkIcon className="w-3 h-3" />
                                            </button>
                                        </span>
                                    )}
                                    {level && (
                                        <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                            <span className="capitalize">{level}</span>
                                            <button onClick={() => handleLevelSelect('')} className="hover:text-rose-500 ml-0.5 cursor-pointer">
                                                <XMarkIcon className="w-3 h-3" />
                                            </button>
                                        </span>
                                    )}
                                    {priceTier && (
                                        <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                            <span className="capitalize">{priceTier}</span>
                                            <button onClick={() => handlePriceSelect('')} className="hover:text-rose-500 ml-0.5 cursor-pointer">
                                                <XMarkIcon className="w-3 h-3" />
                                            </button>
                                        </span>
                                    )}
                                    {minRating && (
                                        <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                            <span>{minRating}+ Rating</span>
                                            <button onClick={() => handleRatingSelect('')} className="hover:text-rose-500 ml-0.5 cursor-pointer">
                                                <XMarkIcon className="w-3 h-3" />
                                            </button>
                                        </span>
                                    )}
                                    {durationTier && (
                                        <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                            <span>Duration: {durationTier}</span>
                                            <button onClick={() => handleDurationSelect('')} className="hover:text-rose-500 ml-0.5 cursor-pointer">
                                                <XMarkIcon className="w-3 h-3" />
                                            </button>
                                        </span>
                                    )}
                                </div>

                                <button
                                    onClick={handleClearAll}
                                    className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-medium cursor-pointer"
                                >
                                    Clear all ({activeFilterCount})
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Course Cards Feed */}
                    {loading ? (
                        <div className={viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5" : "space-y-3"}>
                            {[1, 2, 3, 4, 5, 6].map((i) => (
                                <CourseCardSkeleton key={i} />
                            ))}
                        </div>
                    ) : displayedCourses.length === 0 ? (
                        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-8 my-4 shadow-2xs max-w-md mx-auto space-y-3">
                            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
                                <MagnifyingGlassIcon className="w-6 h-6" />
                            </div>
                            <h3 className="text-base font-semibold text-slate-900 dark:text-white">No matching courses found</h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                Try expanding your filters or search for another topic across our disciplines.
                            </p>
                            <Button onClick={handleClearAll} variant="secondary" size="sm">
                                Reset Filters
                            </Button>
                        </div>
                    ) : viewMode === 'grid' ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                            {displayedCourses.map((course) => (
                                <CourseCard key={course.id} course={course} />
                            ))}
                        </div>
                    ) : (
                        // List View Mode
                        <div className="space-y-3">
                            {displayedCourses.map((course) => (
                                <div
                                    key={course.id}
                                    className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col sm:flex-row gap-4 items-center group"
                                >
                                    <div className="w-full sm:w-48 aspect-16/10 rounded-lg overflow-hidden shrink-0 bg-slate-100 dark:bg-slate-800">
                                        <img
                                            src={course.thumbnail}
                                            alt={course.title}
                                            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                                        />
                                    </div>
                                    <div className="flex-1 space-y-1.5 w-full">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60">
                                                {course.level}
                                            </span>
                                            {course.rating > 0 && (
                                                <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                                                    <StarIcon className="w-3.5 h-3.5" />
                                                    <span>{course.rating.toFixed(1)}</span>
                                                    <span className="text-slate-400 font-normal">({course.reviewCount})</span>
                                                </span>
                                            )}
                                        </div>
                                        <h3 className="font-semibold text-sm sm:text-base text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                            <Link to={`/courses/${course.id}`}>{course.title}</Link>
                                        </h3>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                            {course.instructor}
                                        </p>
                                        <div className="flex flex-wrap gap-1 pt-1">
                                            {course.tags.slice(0, 4).map((t) => (
                                                <span key={t} className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                                    {t}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="sm:border-l sm:border-slate-100 sm:dark:border-slate-800 sm:pl-4 flex sm:flex-col justify-between sm:justify-center items-end gap-2.5 w-full sm:w-auto shrink-0">
                                        <div className="text-right">
                                            <p className="text-base font-bold text-slate-900 dark:text-white">
                                                {course.price === 0 ? 'Free' : `$${course.price.toFixed(2)}`}
                                            </p>
                                        </div>
                                        <Link
                                            to={`/courses/${course.id}`}
                                            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs rounded-lg transition-colors shadow-2xs"
                                        >
                                            View Course
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Load More Button */}
                    {hasMore && (
                        <div className="flex justify-center mt-8">
                            <Button
                                onClick={handleLoadMore}
                                variant="secondary"
                                size="md"
                                className="px-6"
                            >
                                Load More Courses ({courses.length - visibleCount} remaining)
                            </Button>
                        </div>
                    )}
                </main>
            </div>

            {/* 4. "Browse All Skills" Modal */}
            {allSkillsModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 max-w-xl w-full p-5 sm:p-6 shadow-xl space-y-4 max-h-[85vh] flex flex-col">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
                            <div>
                                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                                    All Skills & Topics
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                    Filter courses across our complete skill taxonomy.
                                </p>
                            </div>
                            <button
                                onClick={() => setAllSkillsModalOpen(false)}
                                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer"
                            >
                                <XMarkIcon className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Search input in modal */}
                        <div className="shrink-0">
                            <input
                                type="text"
                                value={skillSearchTerm}
                                onChange={(e) => setSkillSearchTerm(e.target.value)}
                                placeholder="Search skills (e.g. React, Python, Accounting, Figma)..."
                                className="w-full px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        {/* Skills Cloud */}
                        <div className="overflow-y-auto space-y-4 pr-1">
                            {userInterests.length > 0 && !skillSearchTerm && (
                                <div>
                                    <h4 className="text-[11px] font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400 mb-2">
                                        Your Saved Interests
                                    </h4>
                                    <div className="flex flex-wrap gap-1.5">
                                        {userInterests.map((interest) => (
                                            <button
                                                key={interest}
                                                onClick={() => handleTagSelect(interest)}
                                                className="px-2.5 py-1 rounded-md text-xs font-medium bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 hover:bg-amber-100 border border-amber-200 dark:border-amber-800/60 cursor-pointer"
                                            >
                                                #{interest}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div>
                                <h4 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
                                    {skillSearchTerm ? `Matching (${filteredPlatformSkills.length})` : 'All Platform Skills'}
                                </h4>
                                <div className="flex flex-wrap gap-1.5">
                                    {filteredPlatformSkills.length === 0 ? (
                                        <p className="text-xs text-slate-400">No matching skills found.</p>
                                    ) : (
                                        filteredPlatformSkills.map((tag) => {
                                            const isSelected = selectedTag.toLowerCase() === tag.toLowerCase();
                                            return (
                                                <button
                                                    key={tag}
                                                    onClick={() => handleTagSelect(tag)}
                                                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                                                        isSelected
                                                            ? 'bg-blue-600 text-white'
                                                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200/50 dark:border-slate-700/50'
                                                    }`}
                                                >
                                                    #{tag}
                                                </button>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end shrink-0">
                            <Button variant="secondary" size="sm" onClick={() => setAllSkillsModalOpen(false)}>
                                Close
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* 5. Mobile Slide-Over Filter Drawer */}
            {mobileFilterOpen && (
                <div className="fixed inset-0 z-50 lg:hidden bg-black/50 backdrop-blur-xs flex justify-end">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-xs h-full p-5 shadow-xl flex flex-col justify-between animate-in slide-in-from-right duration-200">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                                Filter Courses
                            </h3>
                            <button
                                onClick={() => setMobileFilterOpen(false)}
                                className="text-slate-400 hover:text-slate-600 p-1"
                            >
                                <XMarkIcon className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="overflow-y-auto py-3 flex-1">
                            {FilterSidebarContent}
                        </div>

                        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex gap-2">
                            <button
                                onClick={handleClearAll}
                                className="flex-1 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium text-xs"
                            >
                                Reset
                            </button>
                            <button
                                onClick={() => setMobileFilterOpen(false)}
                                className="flex-1 py-2 rounded-lg bg-blue-600 text-white font-medium text-xs shadow-2xs"
                            >
                                Show ({courses.length})
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Recently Viewed Strip */}
            <div className="pt-6 border-t border-slate-200 dark:border-slate-800">
                <RecentlyViewedCourses />
            </div>

            {/* Recommendations Strip */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                <CourseRecommendations />
            </div>
        </div>
    );
}

export default CourseList;
