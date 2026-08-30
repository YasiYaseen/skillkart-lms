import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { SearchBar, CourseCard, Button, Course } from '../../components/common';
import { api } from '@/lib/api';
import CourseRecommendations from '@/components/course/CourseRecommendations';
import RecentlyViewedCourses from '@/components/course/RecentlyViewedCourses';

const LEVEL_OPTIONS = [
    { label: 'All Levels', value: '' },
    { label: 'Beginner', value: 'beginner' },
    { label: 'Intermediate', value: 'intermediate' },
    { label: 'Advanced', value: 'advanced' },
];

const PRICE_OPTIONS = [
    { label: 'All Prices', value: '' },
    { label: 'Free', value: 'free' },
    { label: 'Under $20', value: 'under-20' },
    { label: 'Under $50', value: 'under-50' },
    { label: 'Paid', value: 'paid' },
];

const SORT_OPTIONS = [
    { label: 'Latest', value: 'latest' },
    { label: 'Most Popular', value: 'popular' },
    { label: 'Highest Rated', value: 'highest-rated' },
    { label: 'Free First', value: 'free' },
];

const DEFAULT_POPULAR_TAGS = ['React', 'JavaScript', 'Node.js', 'Python', 'Full Stack', 'Web Development', 'Design', 'AI'];

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
 * Displays grid of available courses with multi-attribute search (title, description, instructor, tags),
 * tag pills, price filters, level filters, and sort functionality.
 */
function CourseList() {
    const [searchParams, setSearchParams] = useSearchParams();

    const [searchQuery, setSearchQuery] = useState(
        searchParams.get('search') || searchParams.get('q') || ''
    );
    const [level, setLevel] = useState(searchParams.get('level') || '');
    const [priceTier, setPriceTier] = useState(searchParams.get('price') || '');
    const [selectedTag, setSelectedTag] = useState(searchParams.get('tag') || '');
    const [sort, setSort] = useState(searchParams.get('sort') || 'latest');
    const [courses, setCourses] = useState<Course[]>([]);
    const [availableTags, setAvailableTags] = useState<string[]>(DEFAULT_POPULAR_TAGS);
    const [loading, setLoading] = useState(true);
    const [visibleCount, setVisibleCount] = useState(8);

    // Sync state with URL params
    const updateQueryParams = useCallback((newSearch: string, newLevel: string, newTag: string, newPrice: string, newSort: string) => {
        const nextParams: Record<string, string> = {};
        if (newSearch) nextParams.search = newSearch;
        if (newLevel) nextParams.level = newLevel;
        if (newTag) nextParams.tag = newTag;
        if (newPrice) nextParams.price = newPrice;
        if (newSort && newSort !== 'latest') nextParams.sort = newSort;
        setSearchParams(nextParams, { replace: true });
    }, [setSearchParams]);

    const fetchCourses = useCallback(async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (searchQuery) params.set('q', searchQuery);
            if (level) params.set('level', level);
            if (selectedTag) params.set('tag', selectedTag);
            if (priceTier) params.set('priceTier', priceTier);
            if (sort && sort !== 'latest') params.set('sort', sort);

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

            if (data.tags && Array.isArray(data.tags) && data.tags.length > 0) {
                const merged = Array.from(new Set([...DEFAULT_POPULAR_TAGS, ...data.tags]));
                setAvailableTags(merged);
            }
        } catch (err) {
            console.error('Failed to fetch courses:', err);
        } finally {
            setLoading(false);
        }
    }, [searchQuery, level, selectedTag, priceTier, sort]);

    useEffect(() => {
        fetchCourses();
        setVisibleCount(8);
    }, [fetchCourses]);

    const displayedCourses = courses.slice(0, visibleCount);
    const hasMore = visibleCount < courses.length;

    const handleLoadMore = () => {
        setVisibleCount((prev) => prev + 4);
    };

    const handleSearch = (query: string) => {
        setSearchQuery(query);
        setVisibleCount(8);
        updateQueryParams(query, level, selectedTag, priceTier, sort);
    };

    const handleLevelChange = (newLevel: string) => {
        setLevel(newLevel);
        setVisibleCount(8);
        updateQueryParams(searchQuery, newLevel, selectedTag, priceTier, sort);
    };

    const handlePriceChange = (newPrice: string) => {
        setPriceTier(newPrice);
        setVisibleCount(8);
        updateQueryParams(searchQuery, level, selectedTag, newPrice, sort);
    };

    const handleTagChange = (newTag: string) => {
        setSelectedTag(newTag);
        setVisibleCount(8);
        updateQueryParams(searchQuery, level, newTag, priceTier, sort);
    };

    const handleSortChange = (newSort: string) => {
        setSort(newSort);
        setVisibleCount(8);
        updateQueryParams(searchQuery, level, selectedTag, priceTier, newSort);
    };

    const handleClearAll = () => {
        setLevel('');
        setSelectedTag('');
        setPriceTier('');
        setSort('latest');
        setSearchQuery('');
        setSearchParams({}, { replace: true });
    };

    const activeFiltersCount = [
        level,
        selectedTag,
        priceTier,
        searchQuery,
        sort !== 'latest' ? sort : '',
    ].filter(Boolean).length;

    return (
        <div className="container py-8 px-4">
            {/* Page Header */}
            <div className="page-header flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Explore Courses</h1>
                    <nav className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-1.5">
                        <Link to="/" className="hover:text-indigo-600 dark:hover:text-indigo-400">Home</Link>
                        <span>/</span>
                        <span className="text-gray-800 dark:text-gray-200 font-medium">Courses</span>
                    </nav>
                </div>

                {/* Search Bar */}
                <div className="w-full md:w-96">
                    <SearchBar
                        value={searchQuery}
                        onChange={setSearchQuery}
                        onSubmit={handleSearch}
                        placeholder="Search courses, topics, or instructors..."
                    />
                </div>
            </div>

            {/* Topic / Tag Pills */}
            <div className="flex items-center gap-2 overflow-x-auto py-2 mb-4 scrollbar-none">
                <span className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider shrink-0 mr-1">
                  Topics:
                </span>
                <button
                    onClick={() => handleTagChange('')}
                    className={`text-xs font-semibold px-3.5 py-1.5 rounded-full transition-all shrink-0 ${
                        selectedTag === ''
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                >
                    All Topics
                </button>
                {availableTags.map((tag) => (
                    <button
                        key={tag}
                        onClick={() => handleTagChange(selectedTag === tag ? '' : tag)}
                        className={`text-xs font-semibold px-3.5 py-1.5 rounded-full transition-all shrink-0 ${
                            selectedTag === tag
                                ? 'bg-indigo-600 text-white shadow-xs'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                        }`}
                    >
                        #{tag}
                    </button>
                ))}
            </div>

            {/* Filter & Sort Bar */}
            <div className="course-filters flex flex-wrap items-center gap-4 bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-xs mb-8">
                {/* Level Filter */}
                <div className="filter-group flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-500 dark:text-gray-400">Level:</span>
                    <div className="flex flex-wrap gap-1">
                        {LEVEL_OPTIONS.map((opt) => (
                            <button
                                key={opt.value}
                                className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-colors ${
                                    level === opt.value
                                        ? 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 font-semibold'
                                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                                }`}
                                onClick={() => handleLevelChange(opt.value)}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Price Filter */}
                <div className="filter-group flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-500 dark:text-gray-400">Price:</span>
                    <div className="flex flex-wrap gap-1">
                        {PRICE_OPTIONS.map((opt) => (
                            <button
                                key={opt.value}
                                className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-colors ${
                                    priceTier === opt.value
                                        ? 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 font-semibold'
                                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                                }`}
                                onClick={() => handlePriceChange(opt.value)}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Sort */}
                <div className="filter-group flex items-center gap-2 ml-auto">
                    <span className="text-xs font-bold text-gray-500 dark:text-gray-400">Sort:</span>
                    <div className="flex flex-wrap gap-1">
                        {SORT_OPTIONS.map((opt) => (
                            <button
                                key={opt.value}
                                className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-colors ${
                                    sort === opt.value
                                        ? 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 font-semibold'
                                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                                }`}
                                onClick={() => handleSortChange(opt.value)}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Results summary & clear */}
                <div className="w-full flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
                    <span>
                        {!loading && `${courses.length} ${courses.length === 1 ? 'course' : 'courses'} found`}
                    </span>
                    {activeFiltersCount > 0 && (
                        <button
                            className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
                            onClick={handleClearAll}
                        >
                            ✕ Reset all filters ({activeFiltersCount})
                        </button>
                    )}
                </div>
            </div>

            {/* Course Grid / Skeleton */}
            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                        <CourseCardSkeleton key={i} />
                    ))}
                </div>
            ) : (
                <>
                    {/* Course Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {displayedCourses.map((course) => (
                            <CourseCard key={course.id} course={course} />
                        ))}
                    </div>

                    {/* Empty State */}
                    {displayedCourses.length === 0 && (
                        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-8 my-6 shadow-xs max-w-lg mx-auto">
                            <div className="w-16 h-16 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-2xl mx-auto mb-4">
                                🔍
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1.5">No matching courses</h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mb-6">
                                We couldn't find any courses matching your criteria. Try adjusting your filters or search keywords.
                            </p>
                            <Button variant="secondary" size="sm" onClick={handleClearAll}>
                                Reset all filters
                            </Button>
                        </div>
                    )}

                    {/* Load More */}
                    {hasMore && (
                        <div className="flex justify-center mt-10">
                            <Button variant="secondary" size="md" onClick={handleLoadMore}>
                                Load more courses ({courses.length - visibleCount} remaining)
                            </Button>
                        </div>
                    )}
                </>
            )}

            {/* Recently Viewed */}
            <div className="pt-12 border-t border-gray-100 dark:border-gray-800 mt-12">
                <RecentlyViewedCourses />
            </div>

            {/* Course Recommendations */}
            <div className="pt-8 border-t border-gray-100 dark:border-gray-800">
                <CourseRecommendations
                    title="Recommended For You"
                    subtitle="Courses picked based on community ratings and popularity"
                />
            </div>
        </div>
    );
}

export default CourseList;
