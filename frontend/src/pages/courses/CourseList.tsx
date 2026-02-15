import { useState } from 'react';
import { Link } from 'react-router-dom';
import { SearchBar, CourseCard, Button, Course } from '../../components/common';

// Mock course data (replace with API call later)
const MOCK_COURSES: Course[] = [
    {
        id: 1,
        title: 'Build Text to Image SaaS App in React JS',
        instructor: 'Richard James',
        thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400&h=300&fit=crop',
        rating: 4.5,
        reviewCount: 122,
        price: 10.99
    },
    {
        id: 2,
        title: 'Build AI BG Removal SaaS App in React JS',
        instructor: 'Richard James',
        thumbnail: 'https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?w=400&h=300&fit=crop',
        rating: 4.5,
        reviewCount: 122,
        price: 10.99
    },
    {
        id: 3,
        title: 'React Router Complete Course in One Video',
        instructor: 'Richard James',
        thumbnail: 'https://images.unsplash.com/photo-1587620962725-abab7fe55159?w=400&h=300&fit=crop',
        rating: 4.5,
        reviewCount: 122,
        price: 10.99
    },
    {
        id: 4,
        title: 'Build Full Stack E-Commerce MERN App in React JS',
        instructor: 'Richard James',
        thumbnail: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=300&fit=crop',
        rating: 4.5,
        reviewCount: 122,
        price: 10.99
    },
    {
        id: 5,
        title: 'Build Text to Image SaaS App in React JS',
        instructor: 'Richard James',
        thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400&h=300&fit=crop',
        rating: 4.5,
        reviewCount: 122,
        price: 10.99
    },
    {
        id: 6,
        title: 'Build AI BG Removal SaaS App in React JS',
        instructor: 'Richard James',
        thumbnail: 'https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?w=400&h=300&fit=crop',
        rating: 4.5,
        reviewCount: 122,
        price: 10.99
    },
    {
        id: 7,
        title: 'React Router Complete Course in One Video',
        instructor: 'Richard James',
        thumbnail: 'https://images.unsplash.com/photo-1587620962725-abab7fe55159?w=400&h=300&fit=crop',
        rating: 4.5,
        reviewCount: 122,
        price: 10.99
    },
    {
        id: 8,
        title: 'Build Full Stack E-Commerce MERN App in React JS',
        instructor: 'Richard James',
        thumbnail: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=300&fit=crop',
        rating: 4.5,
        reviewCount: 122,
        price: 10.99
    },
    {
        id: 9,
        title: 'Build Text to Image SaaS App in React JS',
        instructor: 'Richard James',
        thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400&h=300&fit=crop',
        rating: 4.2,
        reviewCount: 122,
        price: 10.99
    },
    {
        id: 10,
        title: 'Build AI BG Removal SaaS App in React JS',
        instructor: 'Richard James',
        thumbnail: 'https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?w=400&h=300&fit=crop',
        rating: 4.5,
        reviewCount: 122,
        price: 10.99
    },
    {
        id: 11,
        title: 'React Router Complete Course in One Video',
        instructor: 'Richard James',
        thumbnail: 'https://images.unsplash.com/photo-1587620962725-abab7fe55159?w=400&h=300&fit=crop',
        rating: 4.5,
        reviewCount: 122,
        price: 10.99
    },
    {
        id: 12,
        title: 'Build Full Stack E-Commerce MERN App in React JS',
        instructor: 'Richard James',
        thumbnail: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=300&fit=crop',
        rating: 4.5,
        reviewCount: 122,
        price: 10.99
    }
];

/**
 * CourseList Page
 * Displays grid of available courses with search functionality
 */
function CourseList() {
    const [searchQuery, setSearchQuery] = useState('');
    const [visibleCount, setVisibleCount] = useState(8);

    const filteredCourses = MOCK_COURSES.filter(course =>
        course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.instructor.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const displayedCourses = filteredCourses.slice(0, visibleCount);
    const hasMore = visibleCount < filteredCourses.length;

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
        </div>
    );
}

export default CourseList;
