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

const SORT_OPTIONS = [
    { label: 'Latest', value: 'latest' },
    { label: 'Most Popular', value: 'popular' },
    { label: 'Highest Rated', value: 'highest-rated' },
    { label: 'Free First', value: 'free' },
];

const DEFAULT_POPULAR_TAGS = ['React', 'JavaScript', 'Node.js', 'Python', 'Full Stack', 'Web Development', 'Design', 'AI'];

/**
 * CourseList Page
 * Displays grid of available courses with multi-attribute search (title, description, instructor, tags),
 * tag pills, level filters, and sort functionality.
 */
function CourseList() {
    const [searchParams, setSearchParams] = useSearchParams();

    const [searchQuery, setSearchQuery] = useState(
        searchParams.get('search') || searchParams.get('q') || ''
    );
    const [level, setLevel] = useState(searchParams.get('level') || '');
    const [selectedTag, setSelectedTag] = useState(searchParams.get('tag') || '');
    const [sort, setSort] = useState(searchParams.get('sort') || 'latest');
    const [courses, setCourses] = useState<Course[]>([]);
    const [availableTags, setAvailableTags] = useState<string[]>(DEFAULT_POPULAR_TAGS);
    const [loading, setLoading] = useState(true);
    const [visibleCount, setVisibleCount] = useState(8);

    // Sync state with URL params
    const updateQueryParams = useCallback((newSearch: string, newLevel: string, newTag: string, newSort: string) => {
        const nextParams: Record<string, string> = {};
        if (newSearch) nextParams.search = newSearch;
        if (newLevel) nextParams.level = newLevel;
        if (newTag) nextParams.tag = newTag;
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
            if (sort && sort !== 'latest') params.set('sort', sort);

            const res = await api.get(`/courses?${params.toString()}`);
            const data = res.data;
            const mappedCourses = (data.courses || []).map((c: any) => ({
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
            }));
            setCourses(mappedCourses);

            if (data.tags && Array.isArray(data.tags) && data.tags.length > 0) {
                // Merge unique tags
                const merged = Array.from(new Set([...DEFAULT_POPULAR_TAGS, ...data.tags]));
                setAvailableTags(merged);
            }
        } catch (err) {
            console.error('Failed to fetch courses:', err);
        } finally {
            setLoading(false);
        }
    }, [searchQuery, level, selectedTag, sort]);

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
        updateQueryParams(query, level, selectedTag, sort);
    };

    const handleLevelChange = (newLevel: string) => {
        setLevel(newLevel);
        setVisibleCount(8);
        updateQueryParams(searchQuery, newLevel, selectedTag, sort);
    };

    const handleTagChange = (newTag: string) => {
        setSelectedTag(newTag);
        setVisibleCount(8);
        updateQueryParams(searchQuery, level, newTag, sort);
    };

    const handleSortChange = (newSort: string) => {
        setSort(newSort);
        setVisibleCount(8);
        updateQueryParams(searchQuery, level, selectedTag, newSort);
    };

    const handleClearAll = () => {
        setLevel('');
        setSelectedTag('');
        setSort('latest');
        setSearchQuery('');
        setSearchParams({}, { replace: true });
    };

    const activeFiltersCount = [
        level,
        selectedTag,
        searchQuery,
        sort !== 'latest' ? sort : '',
    ].filter(Boolean).length;

    return (
        <div className="container">
            {/* Page Header */}
            <div className="page-header flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div>
                    <h1 className="page-title">Explore Courses</h1>
                    <nav className="breadcrumb mt-2">
                        <Link to="/">Home</Link>
                        <span className="breadcrumb-separator">/</span>
                        <span>Courses</span>
                    </nav>
                </div>

                {/* Search Bar matching title, instructor, description, tags */}
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
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider shrink-0 mr-1">
                  Topics:
                </span>
                <button
                    onClick={() => handleTagChange('')}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-all shrink-0 ${
                        selectedTag === ''
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                    All Topics
                </button>
                {availableTags.map((tag) => (
                    <button
                        key={tag}
                        onClick={() => handleTagChange(selectedTag === tag ? '' : tag)}
                        className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-all shrink-0 ${
                            selectedTag === tag
                                ? 'bg-blue-600 text-white shadow-xs'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                        #{tag}
                    </button>
                ))}
            </div>

            {/* Filter & Sort Bar */}
            <div className="course-filters">
                {/* Level Filter Pills */}
                <div className="filter-group">
                    <span className="filter-label">Level:</span>
                    <div className="filter-pills">
                        {LEVEL_OPTIONS.map((opt) => (
                            <button
                                key={opt.value}
                                id={`filter-level-${opt.value || 'all'}`}
                                className={`filter-pill${level === opt.value ? ' active' : ''}`}
                                onClick={() => handleLevelChange(opt.value)}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Sort */}
                <div className="filter-group">
                    <span className="filter-label">Sort by:</span>
                    <div className="filter-pills">
                        {SORT_OPTIONS.map((opt) => (
                            <button
                                key={opt.value}
                                id={`sort-${opt.value}`}
                                className={`filter-pill${sort === opt.value ? ' active' : ''}`}
                                onClick={() => handleSortChange(opt.value)}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Results summary */}
                <div className="filter-results-count">
                    {!loading && (
                        <span>
                            {courses.length} {courses.length === 1 ? 'course' : 'courses'} found
                            {activeFiltersCount > 0 && (
                                <button
                                    className="clear-filters-btn"
                                    onClick={handleClearAll}
                                >
                                    Clear filters ({activeFiltersCount})
                                </button>
                            )}
                        </span>
                    )}
                </div>
            </div>

            {loading ? (
                <div className="text-center py-16 text-gray-500 animate-pulse">Loading matching courses...</div>
            ) : (
                <>
                    {/* Course Grid */}
                    <div className="course-grid">
                        {displayedCourses.map((course) => (
                            <CourseCard key={course.id} course={course} />
                        ))}
                    </div>

                    {/* Empty State */}
                    {displayedCourses.length === 0 && (
                        <div className="text-center py-16 bg-gray-50 rounded-2xl border border-gray-100 p-8 my-6">
                            <div className="text-4xl mb-3">🔍</div>
                            <h3 className="text-lg font-bold text-gray-900 mb-1">No courses found</h3>
                            <p className="text-sm text-gray-500 max-w-md mx-auto">
                                We couldn't find any courses matching
                                {searchQuery ? ` "${searchQuery}"` : ''}
                                {selectedTag ? ` in topic #${selectedTag}` : ''}
                                {level ? ` for ${level} level` : ''}.
                            </p>
                            <button
                                className="clear-filters-btn mt-4 inline-block font-semibold text-blue-600 hover:text-blue-700"
                                onClick={handleClearAll}
                            >
                                Clear all filters & search
                            </button>
                        </div>
                    )}

                    {/* Load More */}
                    {hasMore && (
                        <div className="load-more-wrapper">
                            <Button variant="secondary" size="md" onClick={handleLoadMore}>
                                Load more
                            </Button>
                        </div>
                    )}
                </>
            )}

            {/* Recently Viewed */}
            <div className="pt-10 border-t border-gray-100 dark:border-gray-800">
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
