import { StarIcon, StarEmptyIcon } from '../../assets/icons';

interface RatingProps {
    value?: number;
    count?: number;
    showValue?: boolean;
    className?: string;
}

/**
 * Rating Component
 * Displays star rating with optional review count
 */
function Rating({ value = 0, count = 0, showValue = true, className = '' }: RatingProps) {
    const fullStars = Math.floor(value);
    const hasHalfStar = value % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    return (
        <div className={`rating ${className}`}>
            <div className="rating-stars">
                {/* Full stars */}
                {[...Array(fullStars)].map((_, i) => (
                    <StarIcon key={`full-${i}`} className="rating-star" />
                ))}

                {/* Half star (rendered as full for simplicity) */}
                {hasHalfStar && <StarIcon className="rating-star" />}

                {/* Empty stars */}
                {[...Array(emptyStars)].map((_, i) => (
                    <StarEmptyIcon key={`empty-${i}`} className="rating-star empty" />
                ))}
            </div>

            {showValue && <span className="rating-value">{value.toFixed(1)}</span>}
            {count > 0 && <span className="rating-count">({count})</span>}
        </div>
    );
}

export default Rating;
