import { Link } from 'react-router-dom';
import Rating from './Rating';

export interface Course {
    id: string | number;
    title: string;
    instructor: string;
    thumbnail: string;
    rating?: number;
    reviewCount?: number;
    price: number;
}

interface CourseCardProps {
    course: Course;
    className?: string;
}

/**
 * CourseCard Component
 * Displays individual course information in a card format
 */
function CourseCard({ course, className = '' }: CourseCardProps) {
    const {
        id,
        title,
        instructor,
        thumbnail,
        rating = 0,
        reviewCount = 0,
        price
    } = course;

    return (
        <Link to={`/courses/${id}`} className={`course-card ${className}`}>
            <div className="course-card-thumbnail">
                <img src={thumbnail} alt={title} loading="lazy" />
            </div>

            <div className="course-card-body">
                <h3 className="course-card-title">{title}</h3>
                <p className="course-card-instructor">{instructor}</p>

                <div className="course-card-footer">
                    <Rating value={rating} count={reviewCount} />
                    <span className="course-card-price">${price.toFixed(2)}</span>
                </div>
            </div>
        </Link>
    );
}

export default CourseCard;
