import { Link } from 'react-router-dom';
import Rating from './Rating';
import { WishlistButton } from '@/features/wishlist';

export interface Course {
    id: string | number;
    title: string;
    instructor: string;
    thumbnail: string;
    rating?: number;
    reviewCount?: number;
    price: number;
    level?: string;
    enrollmentCount?: number;
}

interface CourseCardProps {
    course: Course;
    className?: string;
    showWishlist?: boolean;
}

const LEVEL_BADGE_STYLES: Record<string, string> = {
    beginner: 'course-card-level-badge beginner',
    intermediate: 'course-card-level-badge intermediate',
    advanced: 'course-card-level-badge advanced',
};

/**
 * CourseCard Component
 * Displays individual course information in a card format
 */
function CourseCard({ course, className = '', showWishlist = true }: CourseCardProps) {
    const {
        id,
        title,
        instructor,
        thumbnail,
        rating = 0,
        reviewCount = 0,
        price,
        level,
        enrollmentCount = 0,
    } = course;

    return (
        <Link to={`/courses/${id}`} className={`course-card relative group ${className}`}>
            <div className="course-card-thumbnail relative">
                <img src={thumbnail} alt={title} loading="lazy" />
                {level && (
                    <span className={LEVEL_BADGE_STYLES[level] || 'course-card-level-badge'}>
                        {level.charAt(0).toUpperCase() + level.slice(1)}
                    </span>
                )}
                {showWishlist && id && (
                    <div className="absolute top-2 right-2 z-10">
                        <WishlistButton courseId={String(id)} variant="icon" />
                    </div>
                )}
            </div>

            <div className="course-card-body">
                <h3 className="course-card-title">{title}</h3>
                <p className="course-card-instructor">{instructor}</p>

                {enrollmentCount > 0 && (
                    <p className="course-card-enrollment">
                        {enrollmentCount.toLocaleString()} {enrollmentCount === 1 ? 'student' : 'students'}
                    </p>
                )}

                <div className="course-card-footer">
                    <Rating value={rating} count={reviewCount} />
                    <span className="course-card-price">
                        {price > 0 ? `$${price.toFixed(2)}` : 'Free'}
                    </span>
                </div>
            </div>
        </Link>
    );
}

export default CourseCard;
