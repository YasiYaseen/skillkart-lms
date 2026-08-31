import CourseStructure from '@/components/course/CourseStructure';
import CourseFAQAccordion from '@/components/course/CourseFAQAccordion';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useState, useEffect, useMemo, useCallback } from 'react';
import type { FormEvent } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { EnrollButton } from '@/features/enrollment/components/EnrollButton';
import { useEnrollment } from '@/features/enrollment/hooks/useEnrollment';
import { WishlistButton } from '@/features/wishlist';
import { useAuth } from '@/features/auth/AuthContext';
import { AuthModals } from '@/features/auth';
import { useCart } from '@/context/CartContext';
import { useCurrency } from '@/context/CurrencyContext';
import { MarkdownRenderer } from '@/components/common';
import {
    AcademicCapIcon,
    ClockIcon as ClockIconSolid,
    CheckCircleIcon,
    ShieldCheckIcon,
    ShoppingCartIcon,
    BoltIcon,
    CheckIcon,
    ArrowRightIcon,
    BookOpenIcon,
    SignalIcon,
    SparklesIcon,
    MagnifyingGlassIcon,
} from '@heroicons/react/20/solid';

function formatMinutes(totalMins: number) {
    if (!totalMins || totalMins <= 0) return '0m';
    const hours = Math.floor(totalMins / 60);
    const mins = totalMins % 60;
    if (hours > 0 && mins > 0) return `${hours}h ${mins}m`;
    if (hours > 0) return `${hours}h`;
    return `${mins}m`;
}

type CourseReview = {
    _id: string;
    rating: number;
    comment: string;
    createdAt: string;
    student?: {
        _id?: string;
        name?: string;
    } | string;
};

interface RawCourseDetailsLessonItem {
    _id: string;
    lesson: string;
    type?: string;
    content?: { text?: string; url?: string };
    order?: number;
}

interface RawCourseDetailsLesson {
    _id: string;
    title: string;
    durationMinutes?: number;
    section: string;
    order?: number;
}

interface RawCourseDetailsSection {
    _id: string;
    title: string;
    order?: number;
}

interface RawCourseDetails {
    _id: string;
    title: string;
    description?: string;
    level: string;
    instructor?: { _id?: string; name?: string } | string;
    averageRating?: number;
    reviewCount?: number;
    studentCount?: number;
    thumbnailUrl?: string;
    price?: number;
    durationMinutes?: number;
    tags?: string[];
    whatYouWillLearn?: string[];
    prerequisites?: string[];
    updatedAt?: string;
    sections: RawCourseDetailsSection[];
    lessons: RawCourseDetailsLesson[];
    lessonItems?: RawCourseDetailsLessonItem[];
}

interface MappedLecture {
    title: string;
    duration: string;
    items: RawCourseDetailsLessonItem[];
}

interface MappedSection {
    id: string;
    title: string;
    lectureCount: number;
    duration: string;
    lectures: MappedLecture[];
}

interface DetailedCourseState {
    id: string;
    title: string;
    subtitle: string;
    instructor: string;
    instructorId: string | null;
    rating: number;
    ratingCount: number;
    studentCount: number;
    thumbnail: string;
    price: number;
    oldPrice: number | null;
    totalHours: number;
    totalLessons: number;
    level: string;
    tags: string[];
    whatYouWillLearn: string[];
    prerequisites: string[];
    lastUpdated: string;
    description: string[];
    structure: {
        totalSections: number;
        totalLectures: number;
        totalDuration: string;
        sections: MappedSection[];
    };
}

// --- Icons ---
const StarIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-orange-500">
        <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
    </svg>
);

const ClockIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-gray-500">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const BookIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-gray-500">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
    </svg>
);

// --- Components ---

function CourseDetailsPage() {
    const { courseId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { isEnrolled, loading: enrollmentLoading } = useEnrollment(courseId);
    const { addToCart, isInCart } = useCart();
    const { formatPrice, formatAmount } = useCurrency();
    const [course, setCourse] = useState<DetailedCourseState | null>(null);
    const [reviews, setReviews] = useState<CourseReview[]>([]);
    const [reviewSort, setReviewSort] = useState<'newest' | 'highest' | 'lowest'>('newest');
    const [reviewPage, setReviewPage] = useState(1);
    const [reviewPagination, setReviewPagination] = useState<{ total: number; page: number; pages: number; limit: number } | null>(null);
    const [reviewRating, setReviewRating] = useState(5);
    const [reviewComment, setReviewComment] = useState('');
    const [submittingReview, setSubmittingReview] = useState(false);
    const [loading, setLoading] = useState(true);
    const [showAuthModal, setShowAuthModal] = useState(false);

    const loadReviews = useCallback(async (cId: string, sort: 'newest' | 'highest' | 'lowest', page: number) => {
        try {
            const res = await api.get<{ reviews: CourseReview[]; pagination?: { total: number; page: number; pages: number; limit: number } }>(
                `/courses/${cId}/reviews?sort=${sort}&page=${page}&limit=5`
            );
            setReviews(res.data.reviews || []);
            if (res.data.pagination) {
                setReviewPagination(res.data.pagination);
            }
        } catch {
            // Ignore review loading errors
        }
    }, []);

    useEffect(() => {
        if (courseId) {
            api.post(`/me/recently-viewed/${courseId}`).catch(() => {
                // Ignore silent errors for unauthenticated visitors
            });
        }

        if (!courseId) return;

        api.get<{ course: RawCourseDetails }>(`/courses/${courseId}`)
            .then((courseRes) => {
                const c = courseRes.data.course;
                const mappedSections: MappedSection[] = c.sections.map((sec: RawCourseDetailsSection) => {
                    const sectionLessons = c.lessons.filter((l: RawCourseDetailsLesson) => l.section === sec._id);
                    const secDurationMins = sectionLessons.reduce((acc: number, l: RawCourseDetailsLesson) => acc + (l.durationMinutes || 0), 0);
                    return {
                        id: sec._id,
                        title: sec.title,
                        lectureCount: sectionLessons.length,
                        duration: formatMinutes(secDurationMins),
                        lectures: sectionLessons.map((l: RawCourseDetailsLesson) => {
                            const lessonItems = (c.lessonItems || []).filter((i: RawCourseDetailsLessonItem) => i.lesson === l._id);
                            return {
                                title: l.title,
                                duration: formatMinutes(l.durationMinutes || 0),
                                items: lessonItems
                            };
                        })
                    };
                });

                const instructorName = typeof c.instructor === 'object' ? c.instructor?.name || 'Unknown Instructor' : 'Unknown Instructor';
                const instructorId = typeof c.instructor === 'object' ? c.instructor?._id || null : (typeof c.instructor === 'string' ? c.instructor : null);

                setCourse({
                    id: c._id,
                    title: c.title,
                    subtitle: c.description ? c.description.split('.')[0] + '.' : `${c.level.charAt(0).toUpperCase() + c.level.slice(1)} level course`,
                    instructor: instructorName,
                    instructorId,
                    rating: c.averageRating || 0,
                    ratingCount: c.reviewCount || 0,
                    studentCount: c.studentCount || 0,
                    thumbnail: c.thumbnailUrl || 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&h=600&fit=crop',
                    price: c.price || 0,
                    oldPrice: null,
                    totalHours: Math.round((c.durationMinutes || 0) / 60),
                    totalLessons: c.lessons.length,
                    level: c.level || 'beginner',
                    tags: c.tags || [],
                    whatYouWillLearn: c.whatYouWillLearn || [],
                    prerequisites: c.prerequisites || [],
                    lastUpdated: c.updatedAt ? new Date(c.updatedAt).toLocaleDateString() : '',
                    description: c.description ? [c.description] : [],
                    structure: {
                        totalSections: c.sections.length,
                        totalLectures: c.lessons.length,
                        totalDuration: formatMinutes(c.durationMinutes || 0),
                        sections: mappedSections
                    }
                });
            })
            .catch((err: unknown) => {
                const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to fetch course details';
                toast.error(msg);
            })
            .finally(() => {
                setLoading(false);
            });

        loadReviews(courseId, reviewSort, reviewPage);
    }, [courseId, reviewSort, reviewPage, loadReviews]);

    const ratingBreakdown = useMemo(() => {
        const counts: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
        reviews.forEach((r) => {
            const star = Math.min(5, Math.max(1, Math.round(r.rating)));
            counts[star] = (counts[star] || 0) + 1;
        });
        const total = reviews.length;
        return [5, 4, 3, 2, 1].map((star) => ({
            star,
            count: counts[star] || 0,
            percentage: total > 0 ? Math.round(((counts[star] || 0) / total) * 100) : 0,
        }));
    }, [reviews]);

    const myReview = reviews.find((r: CourseReview) => {
        const studentId = typeof r.student === 'object' ? r.student?._id : r.student;
        return studentId && studentId === user?.id;
    });

    const handleReviewSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!courseId) return;

        setSubmittingReview(true);
        try {
            let res;
            if (myReview) {
                res = await api.patch<{ summary: { averageRating: number; reviewCount: number } }>(`/courses/${courseId}/reviews/me`, {
                    rating: reviewRating,
                    comment: reviewComment,
                });
                toast.success('Review updated');
            } else {
                res = await api.post<{ summary: { averageRating: number; reviewCount: number } }>(`/courses/${courseId}/reviews`, {
                    rating: reviewRating,
                    comment: reviewComment,
                });
                toast.success('Review added');
            }
            await loadReviews(courseId, reviewSort, reviewPage);
            setCourse((current) => current ? {
                ...current,
                rating: res.data.summary.averageRating,
                ratingCount: res.data.summary.reviewCount,
            } : current);
            setReviewComment('');
            setReviewRating(5);
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to submit review';
            toast.error(msg);
        } finally {
            setSubmittingReview(false);
        }
    };

    const handleDeleteReview = async () => {
        if (!courseId) return;
        try {
            const res = await api.delete<{ summary: { averageRating: number; reviewCount: number } }>(`/courses/${courseId}/reviews/me`);
            await loadReviews(courseId, reviewSort, reviewPage);
            setCourse((current) => current ? {
                ...current,
                rating: res.data.summary.averageRating,
                ratingCount: res.data.summary.reviewCount,
            } : current);
            setReviewComment('');
            setReviewRating(5);
            toast.success('Review deleted');
        } catch {
            toast.error('Failed to delete review');
        }
    };

function CourseDetailsSkeleton() {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-12 animate-pulse">
            <div className="container py-10">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    {/* Left Column Skeleton */}
                    <div className="lg:col-span-2 space-y-8">
                        <div className="space-y-4">
                            <div className="h-9 bg-gray-200 dark:bg-gray-700 rounded-xl w-3/4" />
                            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded-lg w-1/2" />
                            <div className="flex items-center gap-4">
                                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-28" />
                                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-24" />
                            </div>
                            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-40" />
                        </div>

                        {/* Description Box Skeleton */}
                        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 space-y-3">
                            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-40" />
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full" />
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6" />
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/6" />
                        </div>

                        {/* Curriculum Skeleton */}
                        <div className="space-y-4">
                            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-48" />
                            <div className="space-y-3">
                                {Array.from({ length: 3 }).map((_, i) => (
                                    <div key={i} className="h-14 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 flex justify-between items-center">
                                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
                                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right Column Skeleton */}
                    <div className="space-y-6">
                        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden p-5 space-y-5 shadow-2xs">
                            <div className="aspect-video bg-slate-200 dark:bg-slate-700 rounded-lg w-full" />
                            <div className="h-7 bg-slate-200 dark:bg-slate-700 rounded-md w-28" />
                            <div className="space-y-2.5">
                                <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded-lg w-full" />
                                <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded-lg w-full" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

    if (loading) {
        return <CourseDetailsSkeleton />;
    }

    if (!course) {
        return (
            <div className="min-h-[70vh] flex items-center justify-center px-4">
                <div className="max-w-md w-full text-center bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xs">
                    <div className="w-14 h-14 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-4 border border-amber-200 dark:border-amber-900/40">
                        <MagnifyingGlassIcon className="w-7 h-7" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1.5">Course Not Found</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
                        The course you are looking for may have been removed, unpublished, or the link is incorrect.
                    </p>
                    <div className="flex justify-center gap-2.5">
                        <button
                            type="button"
                            onClick={() => navigate(-1)}
                            className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        >
                            Go Back
                        </button>
                        <Link
                            to="/courses"
                            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors shadow-2xs"
                        >
                            Browse All Courses
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 pb-12 transition-colors">
            <div className="container py-10">

                {/* Main Grid Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">

                    {/* Left Column (Content) */}
                    <div className="lg:col-span-2 space-y-8">

                        {/* 1. Top Section Info */}
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4 leading-tight">
                                {course.title}
                            </h1>
                            <p className="text-lg text-gray-600 dark:text-gray-300 mb-4">
                                {course.subtitle}
                            </p>

                            <div className="flex items-center flex-wrap gap-4 text-sm mb-4">
                                {course.rating > 0 && (
                                    <div className="flex items-center gap-1">
                                        <span className="font-bold text-amber-500 flex items-center gap-0.5">
                                            {course.rating} <StarIcon />
                                        </span>
                                        <span className="text-blue-600 dark:text-blue-400 underline cursor-pointer">
                                            ({course.ratingCount} ratings)
                                        </span>
                                    </div>
                                )}
                                {course.studentCount > 0 && (
                                    <div className="text-gray-600 dark:text-gray-400">
                                        {course.studentCount} students
                                    </div>
                                )}
                            </div>

                            <div className="text-sm text-gray-700 dark:text-gray-300">
                                Course by{' '}
                                {course.instructorId ? (
                                    <Link
                                        to={`/instructors/${course.instructorId}`}
                                        className="text-blue-600 dark:text-blue-400 font-medium hover:underline inline-flex items-center gap-1"
                                    >
                                        {course.instructor}
                                        <span className="text-xs">↗</span>
                                    </Link>
                                ) : (
                                    <span className="font-medium text-gray-900 dark:text-white">{course.instructor}</span>
                                )}
                            </div>

                            {course.tags && course.tags.length > 0 && (
                                <div className="flex flex-wrap items-center gap-1.5 mt-4">
                                    <span className="text-xs font-medium text-gray-400 mr-1">Tags:</span>
                                    {course.tags.map((t: string) => (
                                        <button
                                            key={t}
                                            type="button"
                                            onClick={() => navigate(`/courses?tag=${encodeURIComponent(t)}`)}
                                            className="text-xs font-semibold px-3 py-1 rounded-full bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-300 dark:hover:bg-blue-900/50 border border-blue-100 dark:border-blue-900/30 transition-all cursor-pointer"
                                        >
                                            #{t}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* What You'll Learn */}
                        {course.whatYouWillLearn && course.whatYouWillLearn.length > 0 && (
                            <div className="bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl p-6 md:p-8">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">✓</span>
                                    <span>What you'll learn</span>
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {course.whatYouWillLearn.map((item: string, idx: number) => (
                                        <div key={idx} className="flex items-start gap-2.5 text-sm text-gray-800 dark:text-gray-200">
                                            <span className="text-emerald-600 dark:text-emerald-400 font-bold shrink-0 mt-0.5">✓</span>
                                            <span className="leading-snug">{item}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* 2. Course Structure */}
                        <CourseStructure
                            sections={course.structure.sections}
                            totalSections={course.structure.totalSections}
                            totalLectures={course.structure.totalLectures}
                            totalDuration={course.structure.totalDuration}
                        />

                        {/* 3. Course Description */}
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xs border border-gray-100 dark:border-gray-700 p-6 md:p-8">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Course Description</h2>
                            <div className="space-y-4">
                                {course.description.map((paragraph: string, idx: number) => (
                                    <MarkdownRenderer key={idx} content={paragraph} />
                                ))}
                            </div>
                        </div>

                        {/* Prerequisites / Requirements */}
                        {course.prerequisites && course.prerequisites.length > 0 && (
                            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xs border border-gray-100 dark:border-gray-700 p-6 md:p-8">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Requirements & Prerequisites</h2>
                                <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                                    {course.prerequisites.map((prereq: string, idx: number) => (
                                        <li key={idx} className="flex items-start gap-2.5">
                                            <span className="text-indigo-500 font-bold mt-0.5">•</span>
                                            <span className="leading-snug">{prereq}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* 4. Frequently Asked Questions */}
                        <CourseFAQAccordion courseId={courseId!} />

                        {/* 5. Student Reviews */}
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xs border border-gray-100 dark:border-gray-700 p-6 md:p-8">
                            <div className="flex items-center justify-between gap-4 mb-6">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Student Reviews</h2>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                        {course.ratingCount > 0 ? `${course.rating} average from ${course.ratingCount} reviews` : 'No reviews yet'}
                                    </p>
                                </div>
                                {course.rating > 0 && (
                                    <div className="flex items-center gap-1 text-amber-500 font-bold text-lg">
                                        <span>{course.rating}</span>
                                        <StarIcon />
                                    </div>
                                )}
                            </div>

                            {/* Rating Distribution Bar Chart */}
                            {reviews.length > 0 && (
                                <div className="bg-gray-50 dark:bg-gray-900/40 rounded-2xl p-6 mb-8 border border-gray-100 dark:border-gray-700/60 grid grid-cols-1 sm:grid-cols-3 gap-6 items-center">
                                    <div className="text-center sm:border-r border-gray-200 dark:border-gray-700 sm:pr-6">
                                        <div className="text-4xl font-extrabold text-gray-900 dark:text-white mb-1">
                                            {course.rating.toFixed(1)}
                                        </div>
                                        <div className="flex justify-center items-center gap-1 text-amber-400 text-lg mb-1">
                                            {[1, 2, 3, 4, 5].map((s) => (
                                                <span key={s} className={s <= Math.round(course.rating) ? "text-amber-400" : "text-gray-300 dark:text-gray-600"}>
                                                    ★
                                                </span>
                                            ))}
                                        </div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            Course Rating • {course.ratingCount} review{course.ratingCount !== 1 ? 's' : ''}
                                        </p>
                                    </div>
                                    <div className="sm:col-span-2 space-y-2">
                                        {ratingBreakdown.map((row) => (
                                            <div key={row.star} className="flex items-center gap-3 text-xs">
                                                <span className="w-12 font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
                                                    <span>{row.star}</span>
                                                    <span className="text-amber-400">★</span>
                                                </span>
                                                <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                                                    <div
                                                        className="bg-amber-400 h-2 rounded-full transition-all duration-500"
                                                        style={{ width: `${row.percentage}%` }}
                                                    />
                                                </div>
                                                <span className="w-10 text-right text-gray-400 dark:text-gray-500 font-mono">
                                                    {row.percentage}%
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Review form — only for enrolled students */}
                            {!enrollmentLoading && isEnrolled ? (
                                <form onSubmit={handleReviewSubmit} className="border border-gray-100 dark:border-gray-700 rounded-2xl p-5 mb-6 space-y-4 bg-gray-50/50 dark:bg-gray-900/30">
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-semibold text-sm text-gray-900 dark:text-white">
                                            {myReview ? 'Update Your Review' : 'Leave a Review'}
                                        </h3>
                                        {myReview && (
                                            <button
                                                type="button"
                                                onClick={handleDeleteReview}
                                                className="text-xs text-red-500 hover:text-red-700 font-medium"
                                            >
                                                Delete Review
                                            </button>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Your rating <span className="text-red-500">*</span>
                                        </label>
                                        <div className="flex items-center gap-1.5">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <button
                                                    key={star}
                                                    type="button"
                                                    onClick={() => setReviewRating(star)}
                                                    className="p-1 text-2xl transition-transform hover:scale-110 focus:outline-none"
                                                    title={`${star} Star${star > 1 ? 's' : ''}`}
                                                >
                                                    <span className={star <= reviewRating ? "text-amber-400" : "text-gray-300 dark:text-gray-600"}>
                                                        ★
                                                    </span>
                                                </button>
                                            ))}
                                            <span className="ml-2 text-xs font-semibold text-gray-600 dark:text-gray-400">
                                                {reviewRating === 5 && "5 Stars - Excellent"}
                                                {reviewRating === 4 && "4 Stars - Very Good"}
                                                {reviewRating === 3 && "3 Stars - Average"}
                                                {reviewRating === 2 && "2 Stars - Poor"}
                                                {reviewRating === 1 && "1 Star - Terrible"}
                                            </span>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2" htmlFor="review-comment">
                                            Your review
                                        </label>
                                        <textarea
                                            id="review-comment"
                                            value={reviewComment}
                                            onChange={(event) => setReviewComment(event.target.value)}
                                            rows={4}
                                            minLength={5}
                                            maxLength={1000}
                                            required
                                            className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            placeholder="Share what helped you most."
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={submittingReview}
                                        className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60 transition-colors shadow-xs"
                                    >
                                        {submittingReview ? 'Submitting...' : myReview ? 'Update Review' : 'Submit Review'}
                                    </button>
                                </form>
                            ) : !enrollmentLoading && !isEnrolled ? (
                                <div className="border border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-5 mb-6 text-sm text-gray-500 dark:text-gray-400 text-center space-y-2">
                                    <p>{user ? 'Enroll in this course to leave a review.' : 'Log in and enroll in this course to share your review.'}</p>
                                    {!user && (
                                        <button
                                            type="button"
                                            onClick={() => setShowAuthModal(true)}
                                            className="px-3.5 py-1.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-lg text-xs font-semibold hover:bg-indigo-100 transition-colors cursor-pointer"
                                        >
                                            Sign in to Review
                                        </button>
                                    )}
                                </div>
                            ) : null}

                            {/* Review Sorting Pills */}
                            {reviews.length > 0 && (
                                <div className="flex items-center justify-between flex-wrap gap-3 pb-4 border-b border-gray-100 dark:border-gray-700/60 mb-6">
                                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Sort Reviews
                                    </span>
                                    <div className="flex items-center gap-2">
                                        {(['newest', 'highest', 'lowest'] as const).map((mode) => (
                                            <button
                                                key={mode}
                                                type="button"
                                                onClick={() => {
                                                    setReviewSort(mode);
                                                    setReviewPage(1);
                                                }}
                                                className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                                                    reviewSort === mode
                                                        ? 'bg-indigo-600 text-white shadow-xs'
                                                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                                }`}
                                            >
                                                {mode === 'newest' ? 'Newest' : mode === 'highest' ? 'Highest Rating' : 'Lowest Rating'}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="space-y-4">
                                {reviews.length === 0 && (
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Students who enroll can leave the first review.</p>
                                )}
                                {reviews.map((review) => {
                                    const studentObj = typeof review.student === 'object' && review.student !== null ? review.student : null;
                                    const studentId = studentObj?._id || (typeof review.student === 'string' ? review.student : undefined);
                                    const studentName = studentObj?.name || 'Student';
                                    const isAuthor = studentId === user?.id;
                                    return (
                                        <div key={review._id} className="border-b border-gray-100 dark:border-gray-700/60 pb-4 last:border-0 last:pb-0">
                                            <div className="flex items-center justify-between gap-3 mb-2">
                                                <span className="font-semibold text-gray-900 dark:text-white">{studentName}</span>
                                                <span className="flex items-center gap-1 text-sm font-semibold text-amber-500">
                                                    {review.rating} <StarIcon />
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{review.comment}</p>
                                            <div className="flex items-center justify-between mt-2">
                                                <p className="text-xs text-gray-400 dark:text-gray-500">
                                                    {new Date(review.createdAt).toLocaleDateString()}
                                                </p>
                                                {isAuthor && (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                             setReviewRating(review.rating);
                                                             setReviewComment(review.comment);
                                                        }}
                                                        className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
                                                    >
                                                        Edit Review
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Pagination Controls */}
                            {reviewPagination && reviewPagination.pages > 1 && (
                                <div className="flex items-center justify-between pt-6 border-t border-gray-100 dark:border-gray-700/60 mt-6">
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        Page {reviewPagination.page} of {reviewPagination.pages} ({reviewPagination.total} reviews)
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            disabled={reviewPagination.page <= 1}
                                            onClick={() => setReviewPage((p) => Math.max(1, p - 1))}
                                            className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed text-gray-700 dark:text-gray-300 transition-colors"
                                        >
                                            Previous
                                        </button>
                                        <button
                                            type="button"
                                            disabled={reviewPagination.page >= reviewPagination.pages}
                                            onClick={() => setReviewPage((p) => p + 1)}
                                            className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed text-gray-700 dark:text-gray-300 transition-colors"
                                        >
                                            Next
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                    </div>

                    {/* Right Column (Sticky Card) */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-20 space-y-6">

                            {/* Course Card */}
                            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                                {/* Thumbnail */}
                                <div className="relative aspect-16/10 bg-slate-100 dark:bg-slate-800">
                                    <img
                                        src={course.thumbnail}
                                        alt={course.title}
                                        className="w-full h-full object-cover"
                                    />
                                </div>

                                <div className="p-5 sm:p-6">
                                    {/* Price */}
                                    <div className="flex items-center gap-3 mb-5">
                                        <span className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
                                            {formatPrice(course.price)}
                                        </span>
                                        {course.oldPrice && (
                                            <span className="text-sm text-slate-400 line-through">{formatAmount(course.oldPrice)}</span>
                                        )}
                                    </div>

                                    {/* Stats Summary */}
                                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-5 pb-4 border-b border-slate-100 dark:border-slate-800">
                                        <div className="flex items-center gap-1">
                                            <StarIcon />
                                            <span className="font-semibold text-slate-700 dark:text-slate-300">{course.rating > 0 ? course.rating.toFixed(1) : 'New'}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <ClockIcon />
                                            <span>{course.structure.totalDuration}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <BookIcon />
                                            <span>{course.totalLessons} lessons</span>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="space-y-2.5 mb-5">
                                        {courseId && (
                                            <EnrollButton
                                                courseId={courseId}
                                                price={course.price}
                                                isPaid={course.price > 0}
                                                onEnrolled={() => navigate(`/learn/${courseId}`)}
                                            />
                                        )}
                                        {courseId && !isEnrolled && course.price > 0 && (
                                            <button
                                                onClick={() => {
                                                    if (!isInCart(courseId)) {
                                                        addToCart({
                                                            courseId,
                                                            title: course.title,
                                                            price: course.price,
                                                            thumbnailUrl: course.thumbnail,
                                                            instructorName: course.instructor,
                                                        });
                                                    }
                                                    navigate('/cart?step=payment');
                                                }}
                                                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                                            >
                                                <BoltIcon className="w-4 h-4" />
                                                <span>Instant Checkout</span>
                                            </button>
                                        )}
                                        {courseId && !isEnrolled && (
                                            isInCart(courseId) ? (
                                                <button
                                                    onClick={() => navigate('/cart')}
                                                    className="w-full py-2.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-lg font-medium text-xs hover:bg-emerald-100 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                                                >
                                                    <CheckIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                                    <span>In Cart &bull; Go to Cart</span>
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => {
                                                        addToCart({
                                                            courseId,
                                                            title: course.title,
                                                            price: course.price,
                                                            thumbnailUrl: course.thumbnail,
                                                            instructorName: course.instructor,
                                                        });
                                                        toast.success('Course added to your cart!');
                                                    }}
                                                    className="w-full py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg font-medium text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                                                >
                                                    <ShoppingCartIcon className="w-4 h-4 text-slate-500" />
                                                    <span>Add to Cart</span>
                                                </button>
                                            )
                                        )}
                                        {courseId && (
                                            <WishlistButton courseId={courseId} variant="button" />
                                        )}

                                        <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 pt-2">
                                            <ShieldCheckIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                            <span>30-Day Money-Back Guarantee &bull; Lifetime Access</span>
                                        </div>
                                    </div>

                                    {/* Course Quick Stats */}
                                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                                        <h3 className="font-semibold text-slate-900 dark:text-white mb-2.5 text-xs uppercase tracking-wider">
                                            Course Details
                                        </h3>
                                        <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
                                            <li className="flex items-center gap-2">
                                                <BookOpenIcon className="w-4 h-4 text-slate-400 shrink-0" />
                                                <span>{course.totalLessons} total lessons & exercises</span>
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <ClockIconSolid className="w-4 h-4 text-slate-400 shrink-0" />
                                                <span>{course.structure.totalDuration} on-demand video & reading</span>
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <SignalIcon className="w-4 h-4 text-slate-400 shrink-0" />
                                                <span className="capitalize">{course.level ?? 'All'} level</span>
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <AcademicCapIcon className="w-4 h-4 text-slate-400 shrink-0" />
                                                <span>Verified certificate upon completion</span>
                                            </li>
                                        </ul>
                                    </div>

                                </div>
                            </div>

                        </div>
                    </div>

                </div>
            </div>

            {showAuthModal && (
                <AuthModals
                    isOpen={showAuthModal}
                    initialMode="login"
                    onClose={() => setShowAuthModal(false)}
                />
            )}
        </div>
    );
}

export default CourseDetailsPage;
