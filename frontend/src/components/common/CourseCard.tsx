import { Link } from 'react-router-dom';
import Rating from './Rating';
import { WishlistButton } from '@/features/wishlist';
import { useCart } from '@/context/CartContext';
import { useCurrency } from '@/context/CurrencyContext';
import { toast } from 'react-toastify';

export interface Course {
    id: string | number;
    title: string;
    instructor: string;
    thumbnail: string;
    tags?: string[];
    rating?: number;
    reviewCount?: number;
    price: number;
    level?: string;
    enrollmentCount?: number;
    durationMinutes?: number;
    totalLessons?: number;
}

interface CourseCardProps {
    course: Course;
    className?: string;
    showWishlist?: boolean;
}

const LEVEL_BADGE_STYLES: Record<string, string> = {
    beginner: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    intermediate: 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    advanced: 'bg-purple-50 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 border-purple-200 dark:border-purple-800',
};

function formatDuration(minutes?: number) {
    if (!minutes || minutes <= 0) return null;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
}

/**
 * CourseCard Component
 * Displays individual course information in a card format
 */
export function CourseCard({ course, className = '', showWishlist = true }: CourseCardProps) {
    const {
        id,
        title,
        instructor,
        thumbnail,
        tags = [],
        rating = 0,
        reviewCount = 0,
        price,
        level,
        enrollmentCount = 0,
        durationMinutes,
        totalLessons,
    } = course;

    const { isInCart, addToCart } = useCart();
    const { formatPrice } = useCurrency();
    const isFree = !price || price === 0;
    const inCart = id ? isInCart(String(id)) : false;

    const handleAddToCart = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (id) {
            addToCart({
                courseId: String(id),
                title,
                price,
                thumbnailUrl: thumbnail,
                instructorName: instructor,
            });
            toast.success(`"${title}" added to your cart!`);
        }
    };

    return (
        <div className="relative group/card flex flex-col h-full">
            <Link
                to={`/courses/${id}`}
                className={`course-card flex flex-col bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-xs hover:shadow-lg transition-all overflow-hidden group ${className}`}
            >
                {/* Thumbnail & Level Badge */}
                <div className="relative aspect-video w-full overflow-hidden bg-gray-100 dark:bg-gray-700">
                    <img
                        src={thumbnail}
                        alt={title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                    />
                    {level && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shadow-xs ${LEVEL_BADGE_STYLES[level] || 'bg-gray-50 text-gray-700'}`}>
                            {level.charAt(0).toUpperCase() + level.slice(1)}
                        </span>
                    )}
                    {isFree && (
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500 text-white shadow-xs">
                            FREE
                        </span>
                    )}
                </div>

                <div className="absolute top-2 right-2 z-10 flex items-center gap-1.5">
                    {showWishlist && id && (
                        <WishlistButton courseId={String(id)} variant="icon" />
                    )}
                </div>

                <div className="p-5 flex flex-col flex-1">
                    <h3 className="font-bold text-gray-900 dark:text-white text-base leading-snug line-clamp-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors mb-1">
                        {title}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-2.5">by {instructor}</p>

                    {/* Tags */}
                    {tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                            {tags.slice(0, 3).map((t, idx) => (
                                <span
                                    key={idx}
                                    className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300"
                                >
                                    #{t}
                                </span>
                            ))}
                        </div>
                    )}

                    {/* Course Metadata (Duration / Lessons / Enrollment) */}
                    <div className="flex items-center gap-3 text-[11px] text-gray-400 dark:text-gray-400 mb-3 mt-auto pt-2 border-t border-gray-50 dark:border-gray-700/60">
                        {formatDuration(durationMinutes) && (
                            <span className="flex items-center gap-1">
                                <span>⏱</span> {formatDuration(durationMinutes)}
                            </span>
                        )}
                        {totalLessons && totalLessons > 0 && (
                            <span className="flex items-center gap-1">
                                <span>📚</span> {totalLessons} lessons
                            </span>
                        )}
                        {enrollmentCount > 0 && (
                            <span className="flex items-center gap-1 ml-auto">
                                <span>👥</span> {enrollmentCount.toLocaleString()}
                            </span>
                        )}
                    </div>

                    {/* Footer: Rating, Price & Quick Cart Button */}
                    <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700 gap-2">
                        <Rating value={rating} count={reviewCount} />
                        <div className="flex items-center gap-2">
                            <span className={`text-base font-extrabold ${isFree ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-900 dark:text-white'}`}>
                                {formatPrice(price)}
                            </span>

                            {!isFree && id && (
                                <button
                                    onClick={handleAddToCart}
                                    title={inCart ? 'Already in Cart' : 'Add to Shopping Cart'}
                                    className={`p-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center ${
                                        inCart
                                            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 border border-emerald-200 dark:border-emerald-800'
                                            : 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-600 hover:text-white'
                                    }`}
                                >
                                    {inCart ? '✓' : '🛒'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </Link>
        </div>
    );
}

export default CourseCard;

