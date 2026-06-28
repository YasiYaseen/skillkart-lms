import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { SearchBar, CourseCard, Button, Course } from '../../components/common';
import { api } from '@/lib/api';

/**
 * CourseList Page
 * Displays grid of available courses with search functionality
 */
function CourseList() {
    const [searchQuery, setSearchQuery] = useState('');
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [visibleCount, setVisibleCount] = useState(8);

    useEffect(() => {
        fetchCourses();
    }, [searchQuery]);

    const fetchCourses = async () => {
        try {
            setLoading(true);
            const res = await api.get(`/courses?q=${searchQuery}`);
            const mappedCourses = res.data.courses.map((c: any) => ({
                id: c._id,
                title: c.title,
                instructor: c.instructor?.name || 'Unknown Instructor',
                thumbnail: c.thumbnailUrl || 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400&h=300&fit=crop',
                rating: c.averageRating || 0,
                reviewCount: c.reviewCount || 0,
                price: c.price || 0
            }));
            setCourses(mappedCourses);
        } catch (err) {
            console.error('Failed to fetch courses:', err);
        } finally {
            setLoading(false);
        }
    };

    const displayedCourses = courses.slice(0, visibleCount);
    const hasMore = visibleCount < courses.length;

    const handleLoadMore = () => {
        setVisibleCount(prev => prev + 4);
    };

    const handleSearch = (query: string) => {
        setSearchQuery(query);
        setVisibleCount(8); // Reset pagination on new search
    };

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
                            <p>No courses found matching "{searchQuery}"</p>
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
