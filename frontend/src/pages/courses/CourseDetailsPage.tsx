import CourseStructure from '@/components/course/CourseStructure';
import CourseFAQAccordion from '@/components/course/CourseFAQAccordion';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { api } from '@/lib/api';
import { toast } from 'react-toastify';
import { EnrollButton } from '@/features/enrollment/components/EnrollButton';
import { useEnrollment } from '@/features/enrollment/hooks/useEnrollment';
import { WishlistButton } from '@/features/wishlist';
import { useAuth } from '@/features/auth/AuthContext';

type CourseReview = {
    _id: string;
    rating: number;
    comment: string;
    createdAt: string;
    student?: {
        name?: string;
    };
};

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
    const [course, setCourse] = useState<any>(null);
    const [reviews, setReviews] = useState<CourseReview[]>([]);
    const [reviewRating, setReviewRating] = useState(5);
    const [reviewComment, setReviewComment] = useState('');
    const [submittingReview, setSubmittingReview] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (courseId) {
            api.post(`/me/recently-viewed/${courseId}`).catch(() => {
                // Ignore silent errors for unauthenticated visitors
            });
        }

        Promise.all([
            api.get(`/courses/${courseId}`),
            api.get(`/courses/${courseId}/reviews`)
        ])
            .then(([courseRes, reviewRes]) => {
                const res = courseRes;
                const c = res.data.course;
                const mappedSections = c.sections.map((sec: any) => {
                    const sectionLessons = c.lessons.filter((l: any) => l.section === sec._id);
                    return {
                        id: sec._id,
                        title: sec.title,
                        lectureCount: sectionLessons.length,
                        duration: sectionLessons.reduce((acc: number, l: any) => acc + (l.durationMinutes || 0), 0) + ' m',
                        lectures: sectionLessons.map((l: any) => {
                            const lessonItems = (c.lessonItems || []).filter((i: any) => i.lesson === l._id);
                            return {
                                title: l.title,
                                duration: (l.durationMinutes || 0) + ' mins',
                                items: lessonItems
                            };
                        })
                    };
                });

                setCourse({
                    id: c._id,
                    title: c.title,
                    subtitle: c.description ? c.description.split('.')[0] + '.' : `${c.level.charAt(0).toUpperCase() + c.level.slice(1)} level course`,
                    instructor: c.instructor?.name || 'Unknown Instructor',
                    instructorId: c.instructor?._id || (typeof c.instructor === 'string' ? c.instructor : null),
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
                    lastUpdated: c.updatedAt ? new Date(c.updatedAt).toLocaleDateString() : '',
                    description: c.description ? [c.description] : [],
                    structure: {
                        totalSections: c.sections.length,
                        totalLectures: c.lessons.length,
                        totalDuration: (c.durationMinutes || 0) + "m",
                        sections: mappedSections
                    }
                });
                setReviews(reviewRes.data.reviews || []);
            })
            .catch(err => {
                toast.error(err.response?.data?.message || 'Failed to fetch course details');
            })
            .finally(() => {
                setLoading(false);
            });
    }, [courseId]);

    const handleReviewSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!courseId) return;

        setSubmittingReview(true);
        try {
            const res = await api.post(`/courses/${courseId}/reviews`, {
                rating: reviewRating,
                comment: reviewComment,
            });
            const reviewsRes = await api.get(`/courses/${courseId}/reviews`);
            setReviews(reviewsRes.data.reviews || []);
            setCourse((current: any) => current ? {
                ...current,
                rating: res.data.summary.averageRating,
                ratingCount: res.data.summary.reviewCount,
            } : current);
            setReviewComment('');
            setReviewRating(5);
            toast.success('Review added');
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to submit review');
        } finally {
            setSubmittingReview(false);
        }
    };

    if (loading) {
        return <div className="text-center py-20 text-gray-500">Loading course details...</div>;
    }

    if (!course) {
        return <div className="text-center py-20 text-red-500">Course not found</div>;
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-12">
            <div className="container py-10">

                {/* Main Grid Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">

                    {/* Left Column (Content) */}
                    <div className="lg:col-span-2 space-y-8">

                        {/* 1. Top Section Info */}
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 mb-4 leading-tight">
                                {course.title}
                            </h1>
                            <p className="text-lg text-gray-600 mb-4">
                                {course.subtitle}
                            </p>

                            <div className="flex items-center flex-wrap gap-4 text-sm mb-4">
                                {course.rating > 0 && (
                                    <div className="flex items-center gap-1">
                                        <span className="font-bold text-orange-500 flex items-center gap-0.5">
                                            {course.rating} <StarIcon />
                                        </span>
                                        <span className="text-blue-600 underline cursor-pointer">
                                            ({course.ratingCount} ratings)
                                        </span>
                                    </div>
                                )}
                                {course.studentCount > 0 && (
                                    <div className="text-gray-600">
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

                        {/* 2. Course Structure */}
                        <CourseStructure
                            sections={course.structure.sections}
                            totalSections={course.structure.totalSections}
                            totalLectures={course.structure.totalLectures}
                            totalDuration={course.structure.totalDuration}
                        />

                        {/* 3. Course Description */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">Course Description</h2>
                            <div className="space-y-4 text-gray-700 leading-relaxed whitespace-pre-wrap">
                                {course.description.map((paragraph: string, idx: number) => (
                                    <p key={idx}>{paragraph}</p>
                                ))}
                            </div>
                        </div>

                        {/* 4. Frequently Asked Questions */}
                        <CourseFAQAccordion courseId={courseId!} />

                        {/* 5. Student Reviews */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8">
                            <div className="flex items-center justify-between gap-4 mb-6">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900">Student Reviews</h2>
                                    <p className="text-sm text-gray-500 mt-1">
                                        {course.ratingCount > 0 ? `${course.rating} average from ${course.ratingCount} reviews` : 'No reviews yet'}
                                    </p>
                                </div>
                                {course.rating > 0 && (
                                    <div className="flex items-center gap-1 text-orange-500 font-bold">
                                        <span>{course.rating}</span>
                                        <StarIcon />
                                    </div>
                                )}
                            </div>

                            {/* Review form — only for enrolled students */}
                            {!enrollmentLoading && isEnrolled ? (
                                <form onSubmit={handleReviewSubmit} className="border border-gray-100 dark:border-gray-700 rounded-lg p-4 mb-6 space-y-4">
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
                                        <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="review-comment">
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
                                            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="Share what helped you most."
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={submittingReview}
                                        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        {submittingReview ? 'Submitting...' : 'Submit review'}
                                    </button>
                                </form>
                            ) : !enrollmentLoading && !isEnrolled ? (
                                <div className="border border-dashed border-gray-200 rounded-lg p-4 mb-6 text-sm text-gray-500 text-center">
                                    {user ? 'Enroll in this course to leave a review.' : 'Log in and enroll to leave a review.'}
                                </div>
                            ) : null}

                            <div className="space-y-4">
                                {reviews.length === 0 && (
                                    <p className="text-sm text-gray-500">Students who enroll can leave the first review.</p>
                                )}
                                {reviews.map((review) => (
                                    <div key={review._id} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                                        <div className="flex items-center justify-between gap-3 mb-2">
                                            <span className="font-medium text-gray-900">{review.student?.name || 'Student'}</span>
                                            <span className="flex items-center gap-1 text-sm font-semibold text-orange-500">
                                                {review.rating} <StarIcon />
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-700 leading-relaxed">{review.comment}</p>
                                        <p className="text-xs text-gray-400 mt-2">
                                            {new Date(review.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>

                    {/* Right Column (Sticky Card) */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-4 space-y-6">

                            {/* Course Card */}
                            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                                {/* Thumbnail */}
                                <div className="relative aspect-video">
                                    <img
                                        src={course.thumbnail}
                                        alt={course.title}
                                        className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-black/10"></div>
                                </div>

                                <div className="p-6">
                                    {/* Price */}
                                    <div className="flex items-center gap-3 mb-6">
                                        <span className="text-3xl font-bold text-gray-900">${course.price}</span>
                                        <span className="text-lg text-gray-400 line-through">${course.oldPrice}</span>
                                    </div>

                                    {/* Stats Summary */}
                                    <div className="flex items-center justify-between text-sm text-gray-500 mb-6">
                                        <div className="flex items-center gap-1.5">
                                            <StarIcon />
                                            <span>{course.rating || 'N/A'}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <ClockIcon />
                                            <span>{course.totalHours} hours</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <BookIcon />
                                            <span>{course.totalLessons} lessons</span>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="space-y-3 mb-6">
                                        {courseId && (
                                            <EnrollButton courseId={courseId} onEnrolled={() => navigate(`/learn/${courseId}`)} />
                                        )}
                                        {courseId && (
                                            <WishlistButton courseId={courseId} variant="button" />
                                        )}
                                    </div>

                                    {/* Course Quick Stats */}
                                    <div>
                                        <h3 className="font-semibold text-gray-900 mb-3">Course includes</h3>
                                        <ul className="space-y-2.5">
                                            <li className="flex items-center gap-2.5 text-sm text-gray-600">
                                                <span className="text-blue-500 mt-0.5">📚</span>
                                                <span>{course.totalLessons} lesson{course.totalLessons !== 1 ? 's' : ''}</span>
                                            </li>
                                            {course.totalHours > 0 && (
                                                <li className="flex items-center gap-2.5 text-sm text-gray-600">
                                                    <span className="text-blue-500 mt-0.5">⏱️</span>
                                                    <span>{course.totalHours} hour{course.totalHours !== 1 ? 's' : ''} of content</span>
                                                </li>
                                            )}
                                            <li className="flex items-center gap-2.5 text-sm text-gray-600">
                                                <span className="text-blue-500 mt-0.5">🎯</span>
                                                <span className="capitalize">{course.level ?? 'All'} level</span>
                                            </li>
                                            <li className="flex items-center gap-2.5 text-sm text-gray-600">
                                                <span className="text-blue-500 mt-0.5">♾️</span>
                                                <span>Lifetime access</span>
                                            </li>
                                        </ul>
                                    </div>

                                </div>
                            </div>

                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}

export default CourseDetailsPage;
