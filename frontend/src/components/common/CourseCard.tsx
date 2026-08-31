import { Link } from 'react-router-dom';
import Rating from './Rating';
import { WishlistButton } from '@/features/wishlist';
import { useCart } from '@/context/CartContext';
import { useCurrency } from '@/context/CurrencyContext';
import { toast } from 'react-toastify';
import {
    ClockIcon,
    AcademicCapIcon,
    UserGroupIcon,
    ShoppingCartIcon,
    CheckIcon,
} from '@heroicons/react/20/solid';

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
    beginner: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700',
    intermediate: 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    advanced: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
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
 * Refined, content-led course presentation
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
                className={`flex flex-col bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-200 overflow-hidden group ${className}`}
            >
                {/* Thumbnail & Level Badge */}
                <div className="relative aspect-16/10 w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                    <img
                        src={thumbnail}
                        alt={title}
                        className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                        loading="lazy"
                    />
                    <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 z-10">
                        {level && (
                            <span className={`text-[10px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded-md border backdrop-blur-xs ${LEVEL_BADGE_STYLES[level] || 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                                {level}
                            </span>
                        )}
                        {isFree && (
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-600 text-white shadow-2xs">
                                Free
                            </span>
                        )}
                    </div>
                </div>

                <div className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1.5">
                    {showWishlist && id && (
                        <WishlistButton courseId={String(id)} variant="icon" />
                    )}
                </div>

                <div className="p-4 sm:p-5 flex flex-col flex-1">
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm sm:text-base leading-snug line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors mb-1">
                        {title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-normal mb-2.5">
                        {instructor}
                    </p>

                    {/* Tags */}
                    {tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                            {tags.slice(0, 3).map((t, idx) => (
                                <span
                                    key={idx}
                                    className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200/60 dark:border-slate-700/60"
                                >
                                    {t}
                                </span>
                            ))}
                        </div>
                    )}

                    {/* Course Metadata (Duration / Lessons / Enrollment) */}
                    <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mb-3 mt-auto pt-2.5 border-t border-slate-100 dark:border-slate-800">
                        {formatDuration(durationMinutes) && (
                            <span className="flex items-center gap-1">
                                <ClockIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span>{formatDuration(durationMinutes)}</span>
                            </span>
                        )}
                        {totalLessons && totalLessons > 0 && (
                            <span className="flex items-center gap-1">
                                <AcademicCapIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span>{totalLessons} lessons</span>
                            </span>
                        )}
                        {enrollmentCount > 0 && (
                            <span className="flex items-center gap-1 ml-auto text-[11px]">
                                <UserGroupIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span>{enrollmentCount.toLocaleString()}</span>
                            </span>
                        )}
                    </div>

                    {/* Footer: Rating, Price & Quick Cart Button */}
                    <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 dark:border-slate-800 gap-2">
                        <Rating value={rating} count={reviewCount} />
                        <div className="flex items-center gap-2">
                            <span className={`text-sm sm:text-base font-bold ${isFree ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'}`}>
                                {formatPrice(price)}
                            </span>

                            {!isFree && id && (
                                <button
                                    onClick={handleAddToCart}
                                    title={inCart ? 'In cart' : 'Add to cart'}
                                    className={`p-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center cursor-pointer ${
                                        inCart
                                            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 border border-emerald-200 dark:border-emerald-800'
                                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 dark:hover:text-white'
                                    }`}
                                >
                                    {inCart ? (
                                        <CheckIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                    ) : (
                                        <ShoppingCartIcon className="w-4 h-4" />
                                    )}
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

