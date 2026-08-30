import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '@/lib/api';
import CourseCard from '@/components/common/CourseCard';

interface InstructorData {
    _id: string;
    name: string;
    avatar?: string;
    headline?: string;
    bio?: string;
    interests?: string[];
    socialLinks?: {
        website?: string;
        linkedin?: string;
        twitter?: string;
    };
    joinedDate: string;
}

interface InstructorStats {
    totalCourses: number;
    totalStudents: number;
    totalReviews: number;
    averageRating: number;
}

interface InstructorCourseData {
    _id: string;
    title: string;
    thumbnailUrl?: string;
    tags?: string[];
    averageRating?: number;
    reviewCount?: number;
    price?: number;
    level?: string;
    enrollmentCount?: number;
}

interface InstructorProfileResponse {
    instructor: InstructorData;
    stats?: InstructorStats;
    courses?: InstructorCourseData[];
}

function InstructorPublicProfile() {
    const { instructorId } = useParams<{ instructorId: string }>();
    const [instructor, setInstructor] = useState<InstructorData | null>(null);
    const [stats, setStats] = useState<InstructorStats>({
        totalCourses: 0,
        totalStudents: 0,
        totalReviews: 0,
        averageRating: 0,
    });
    const [courses, setCourses] = useState<InstructorCourseData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!instructorId) return;
        setLoading(true);
        setError(null);

        api.get<InstructorProfileResponse>(`/users/instructor/${instructorId}`)
            .then((res) => {
                setInstructor(res.data.instructor);
                setStats(res.data.stats || {
                    totalCourses: 0,
                    totalStudents: 0,
                    totalReviews: 0,
                    averageRating: 0,
                });
                setCourses(res.data.courses || []);
            })
            .catch((err: unknown) => {
                const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to load instructor profile';
                setError(msg);
            })
            .finally(() => {
                setLoading(false);
            });
    }, [instructorId]);

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-gray-500 text-sm">Loading instructor profile...</p>
                </div>
            </div>
        );
    }

    if (error || !instructor) {
        return (
            <div className="container py-20 text-center">
                <div className="max-w-md mx-auto bg-white dark:bg-gray-800 p-8 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
                    <div className="w-14 h-14 bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                        !
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                        Instructor Not Found
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
                        {error || "The instructor you're looking for does not exist or is inactive."}
                    </p>
                    <Link
                        to="/courses"
                        className="inline-flex items-center justify-center px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-xl transition-colors shadow-xs"
                    >
                        Browse Courses
                    </Link>
                </div>
            </div>
        );
    }

    const formattedJoinedDate = instructor.joinedDate
        ? new Date(instructor.joinedDate).toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'long',
          })
        : '';

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-16">
            {/* Hero Header Banner */}
            <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-gray-900 text-white py-12 px-4 shadow-inner">
                <div className="container max-w-6xl mx-auto">
                    <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
                        {/* Avatar */}
                        <div className="shrink-0 relative">
                            {instructor.avatar ? (
                                <img
                                    src={instructor.avatar}
                                    alt={instructor.name}
                                    className="w-32 h-32 md:w-36 md:h-36 rounded-2xl object-cover ring-4 ring-white/20 shadow-xl"
                                />
                            ) : (
                                <div className="w-32 h-32 md:w-36 md:h-36 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-700 text-white text-4xl font-extrabold flex items-center justify-center ring-4 ring-white/20 shadow-xl">
                                    {instructor.name.substring(0, 2).toUpperCase()}
                                </div>
                            )}
                            <div className="absolute -bottom-2 -right-2 bg-blue-500 text-white p-1.5 rounded-full shadow-md" title="Verified Instructor">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                                    <path fillRule="evenodd" d="M8.603 3.799A4.49 4.49 0 0 1 12 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 0 1 3.498 1.307 4.491 4.491 0 0 1 1.307 3.497A4.49 4.49 0 0 1 21.75 12a4.49 4.49 0 0 1-1.549 3.397 4.491 4.491 0 0 1-1.307 3.497 4.491 4.491 0 0 1-3.497 1.307A4.49 4.49 0 0 1 12 21.75a4.49 4.49 0 0 1-3.397-1.549 4.49 4.49 0 0 1-3.498-1.306 4.491 4.491 0 0 1-1.307-3.498A4.49 4.49 0 0 1 2.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 0 1 1.307-3.497 4.49 4.49 0 0 1 3.497-1.307Zm7.007 6.387a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clipRule="evenodd" />
                                </svg>
                            </div>
                        </div>

                        {/* Details */}
                        <div className="flex-1 text-center md:text-left space-y-3">
                            <div>
                                <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-400/30 uppercase tracking-wider mb-2">
                                    Instructor Profile
                                </span>
                                <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
                                    {instructor.name}
                                </h1>
                            </div>

                            {instructor.headline && (
                                <p className="text-lg text-blue-100/90 font-medium">
                                    {instructor.headline}
                                </p>
                            )}

                            {formattedJoinedDate && (
                                <p className="text-xs text-gray-400">
                                    Instructor since {formattedJoinedDate}
                                </p>
                            )}

                            {/* Social links */}
                            {instructor.socialLinks && (
                                <div className="flex items-center justify-center md:justify-start gap-4 pt-1">
                                    {instructor.socialLinks.website && (
                                        <a
                                            href={instructor.socialLinks.website}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-blue-200"
                                        >
                                            🌐 Website ↗
                                        </a>
                                    )}
                                    {instructor.socialLinks.linkedin && (
                                        <a
                                            href={instructor.socialLinks.linkedin}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-blue-200"
                                        >
                                            🔗 LinkedIn ↗
                                        </a>
                                    )}
                                    {instructor.socialLinks.twitter && (
                                        <a
                                            href={instructor.socialLinks.twitter}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-blue-200"
                                        >
                                            🐦 Twitter / X ↗
                                        </a>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Bar */}
            <div className="container max-w-6xl mx-auto px-4 -mt-6">
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-md p-6 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                    <div>
                        <p className="text-2xl md:text-3xl font-extrabold text-blue-600 dark:text-blue-400">
                            {stats.totalStudents.toLocaleString()}
                        </p>
                        <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 font-medium mt-1">
                            Total Students
                        </p>
                    </div>
                    <div>
                        <p className="text-2xl md:text-3xl font-extrabold text-indigo-600 dark:text-indigo-400">
                            {stats.totalCourses}
                        </p>
                        <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 font-medium mt-1">
                            Courses Published
                        </p>
                    </div>
                    <div>
                        <p className="text-2xl md:text-3xl font-extrabold text-orange-500 flex items-center justify-center gap-1">
                            <span>{stats.averageRating > 0 ? stats.averageRating : 'N/A'}</span>
                            {stats.averageRating > 0 && <span className="text-lg">★</span>}
                        </p>
                        <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 font-medium mt-1">
                            Instructor Rating
                        </p>
                    </div>
                    <div>
                        <p className="text-2xl md:text-3xl font-extrabold text-gray-800 dark:text-gray-200">
                            {stats.totalReviews.toLocaleString()}
                        </p>
                        <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 font-medium mt-1">
                            Student Reviews
                        </p>
                    </div>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="container max-w-6xl mx-auto px-4 mt-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: About & Interests */}
                <div className="space-y-6">
                    {/* About section */}
                    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xs p-6">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                            About the Instructor
                        </h2>
                        {instructor.bio ? (
                            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                                {instructor.bio}
                            </p>
                        ) : (
                            <p className="text-sm text-gray-400 italic">
                                This instructor has not provided a biography yet.
                            </p>
                        )}
                    </div>

                    {/* Expertise / Interests */}
                    {instructor.interests && instructor.interests.length > 0 && (
                        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xs p-6">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                                Areas of Expertise
                            </h2>
                            <div className="flex flex-wrap gap-2">
                                {instructor.interests.map((interest) => (
                                    <span
                                        key={interest}
                                        className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-900/30"
                                    >
                                        {interest}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Column: Instructor Courses */}
                <div className="lg:col-span-2">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xs p-6 md:p-8">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                    Courses by {instructor.name}
                                </h2>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                    {courses.length} {courses.length === 1 ? 'course' : 'courses'} available
                                </p>
                            </div>
                        </div>

                        {courses.length === 0 ? (
                            <div className="text-center py-16 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-2xl">
                                <div className="text-4xl mb-3">🎓</div>
                                <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">
                                    No published courses available yet.
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {courses.map((course) => (
                                    <CourseCard
                                        key={course._id}
                                        course={{
                                            id: course._id,
                                            title: course.title,
                                            instructor: instructor.name,
                                            thumbnail: course.thumbnailUrl || 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&h=600&fit=crop',
                                            tags: course.tags || [],
                                            rating: course.averageRating || 0,
                                            reviewCount: course.reviewCount || 0,
                                            price: course.price || 0,
                                            level: course.level || 'beginner',
                                            enrollmentCount: course.enrollmentCount || 0,
                                        }}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default InstructorPublicProfile;
