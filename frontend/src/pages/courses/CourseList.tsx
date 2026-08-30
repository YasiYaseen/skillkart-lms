import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { SearchBar, CourseCard, Button, Course } from '../../components/common';
import { api } from '@/lib/api';

const LEVEL_OPTIONS = [
    { label: 'All Levels', value: '' },
    { label: 'Beginner', value: 'beginner' },
    { label: 'Intermediate', value: 'intermediate' },
    { label: 'Advanced', value: 'advanced' },
];

const SORT_OPTIONS = [
    { label: 'Latest', value: 'latest' },
    { label: 'Most Popular', value: 'popular' },
    { label: 'Free First', value: 'free' },
];

/**
 * CourseList Page
 * Displays grid of available courses with search, level filter, and sort functionality
 */
function CourseList() {
    const [searchQuery, setSearchQuery] = useState('');
    const [level, setLevel] = useState('');
    const [sort, setSort] = useState('latest');
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [visibleCount, setVisibleCount] = useState(8);

    const fetchCourses = useCallback(async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (searchQuery) params.set('q', searchQuery);
            if (level) params.set('level', level);
            if (sort && sort !== 'latest') params.set('sort', sort);

            const res = await api.get(`/courses?${params.toString()}`);
            const mappedCourses = res.data.courses.map((c: any) => ({
                id: c._id,
                title: c.title,
                instructor: c.instructor?.name || 'Unknown Instructor',
                thumbnail: c.thumbnailUrl || 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400&h=300&fit=crop',
                rating: c.averageRating || 0,
                reviewCount: c.reviewCount || 0,
                price: c.price || 0,
                level: c.level || 'beginner',
                enrollmentCount: c.enrollmentCount || 0,
            }));
            setCourses(mappedCourses);
        } catch (err) {
            console.error('Failed to fetch courses:', err);
        } finally {
            setLoading(false);
        }
    }, [searchQuery, level, sort]);

    useEffect(() => {
        fetchCourses();
        setVisibleCount(8);
    }, [fetchCourses]);

    const displayedCourses = courses.slice(0, visibleCount);
    const hasMore = visibleCount < courses.length;

    const handleLoadMore = () => {
        setVisibleCount(prev => prev + 4);
    };

    const handleSearch = (query: string) => {
        setSearchQuery(query);
        setVisibleCount(8);
    };

    const handleLevelChange = (newLevel: string) => {
        setLevel(newLevel);
        setVisibleCount(8);
    };

    const handleSortChange = (newSort: string) => {
        setSort(newSort);
        setVisibleCount(8);
    };

    const activeFiltersCount = [level, searchQuery, sort !== 'latest' ? sort : ''].filter(Boolean).length;

    return (
        <div className="container">
            {/* Page Header */}
            <div className="page-header flex items-start justify-between">
                <div>
                    <h1 className="page-title">Course List</h1>

                    <nav className="breadcrumb mt-2">
                        <Link to="/">Home</Link>
                        <span className="breadcrumb-separator">/</span>
                        <span>Course List</span>
                    </nav>
                </div>

                {/* Right Side: Search */}
                <div className="w-80">
                    <SearchBar
                        value={searchQuery}
                        onChange={setSearchQuery}
                        onSubmit={handleSearch}
                        placeholder="Search for courses"
                    />
                </div>
            </div>

            {/* Filter & Sort Bar */}
            <div className="course-filters">
                {/* Level Filter Pills */}
                <div className="filter-group">
                    <span className="filter-label">Level:</span>
                    <div className="filter-pills">
                        {LEVEL_OPTIONS.map(opt => (
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
                        {SORT_OPTIONS.map(opt => (
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
                                    onClick={() => { setLevel(''); setSort('latest'); setSearchQuery(''); }}
                                >
                                    Clear filters
                                </button>
                            )}
                        </span>
                    )}
                </div>
            </div>

            {loading ? (
                <div className="text-center py-12 text-gray-500">Loading courses...</div>
            ) : (
                <>
                    {/* Course Grid */}
                    <div className="course-grid">
                        {displayedCourses.map(course => (
                            <CourseCard key={course.id} course={course} />
                        ))}
                    </div>

                    {/* Empty State */}
                    {displayedCourses.length === 0 && (
                        <div className="text-center py-12 text-gray-500">
                            <p>No courses found{searchQuery ? ` matching "${searchQuery}"` : ''}
                                {level ? ` for ${level} level` : ''}.</p>
                            <button
                                className="clear-filters-btn mt-3"
                                onClick={() => { setLevel(''); setSort('latest'); setSearchQuery(''); }}
                            >
                                Clear all filters
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
        </div>
    );
}

export default CourseList;
