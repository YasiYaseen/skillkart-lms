import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '@/lib/api';
import CourseCard from '@/components/common/CourseCard';
import {
    AcademicCapIcon,
    CheckBadgeIcon,
    GlobeAltIcon,
    LinkIcon,
    StarIcon,
    UserGroupIcon,
    BookOpenIcon,
    ChatBubbleLeftRightIcon,
} from '@heroicons/react/20/solid';

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

function InstructorPublicProfile() {
    const { instructorId } = useParams();
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

        const fetchProfile = async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await api.get(`/instructors/${instructorId}/public-profile`);
                const data = res.data;
                setInstructor(data.instructor);
                setStats(data.stats || {
                    totalCourses: 0,
                    totalStudents: 0,
                    totalReviews: 0,
                    averageRating: 0,
                });
                setCourses(data.courses || []);
            } catch (err: unknown) {
                const msg =
                    (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
                    'Failed to load instructor profile';
                setError(msg);
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [instructorId]);

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
                <div className="text-center space-y-3 animate-pulse">
                    <div className="w-16 h-16 rounded-full bg-slate-200 dark:bg-slate-800 mx-auto" />
                    <div className="h-5 w-48 bg-slate-200 dark:bg-slate-800 rounded mx-auto" />
                    <div className="h-4 w-32 bg-slate-100 dark:bg-slate-850 rounded mx-auto" />
                </div>
            </div>
        );
    }

    if (error || !instructor) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
                <div className="text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-8 max-w-md shadow-2xs space-y-4">
                    <div className="w-12 h-12 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
                        <AcademicCapIcon className="w-6 h-6" />
                    </div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">Instructor Not Found</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                        {error || 'The instructor profile you requested does not exist or is inactive.'}
                    </p>
                    <Link
                        to="/courses"
                        className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition-colors shadow-2xs"
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
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-16">
            {/* Hero Header Banner */}
            <div className="bg-slate-900 text-white py-12 px-4 border-b border-slate-800">
                <div className="container max-w-6xl mx-auto">
                    <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
                        {/* Avatar */}
                        <div className="shrink-0 relative">
                            {instructor.avatar ? (
                                <img
                                    src={instructor.avatar}
                                    alt={instructor.name}
                                    className="w-28 h-28 md:w-32 md:h-32 rounded-xl object-cover border-2 border-slate-700 shadow-2xs"
                                />
                            ) : (
                                <div className="w-28 h-28 md:w-32 md:h-32 rounded-xl bg-slate-800 text-blue-400 border-2 border-slate-700 text-3xl font-bold flex items-center justify-center shadow-2xs">
                                    {instructor.name.substring(0, 2).toUpperCase()}
                                </div>
                            )}
                            <div className="absolute -bottom-2 -right-2 bg-blue-600 text-white p-1 rounded-full shadow-2xs" title="Verified Instructor">
                                <CheckBadgeIcon className="w-4 h-4" />
                            </div>
                        </div>

                        {/* Details */}
                        <div className="flex-1 text-center md:text-left space-y-2">
                            <div>
                                <span className="inline-block px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-blue-950/60 text-blue-300 border border-blue-800/80 uppercase tracking-wider mb-2">
                                    Verified Instructor
                                </span>
                                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                                    {instructor.name}
                                </h1>
                            </div>

                            {instructor.headline && (
                                <p className="text-sm text-slate-300 font-medium">
                                    {instructor.headline}
                                </p>
                            )}

                            {formattedJoinedDate && (
                                <p className="text-xs text-slate-400">
                                    Instructor since {formattedJoinedDate}
                                </p>
                            )}

                            {/* Social links */}
                            {instructor.socialLinks && (
                                <div className="flex items-center justify-center md:justify-start gap-2 pt-2">
                                    {instructor.socialLinks.website && (
                                        <a
                                            href={instructor.socialLinks.website}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 transition-colors text-slate-200 border border-slate-700"
                                        >
                                            <GlobeAltIcon className="w-3.5 h-3.5 text-slate-400" />
                                            <span>Website</span>
                                        </a>
                                    )}
                                    {instructor.socialLinks.linkedin && (
                                        <a
                                            href={instructor.socialLinks.linkedin}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 transition-colors text-slate-200 border border-slate-700"
                                        >
                                            <LinkIcon className="w-3.5 h-3.5 text-slate-400" />
                                            <span>LinkedIn</span>
                                        </a>
                                    )}
                                    {instructor.socialLinks.twitter && (
                                        <a
                                            href={instructor.socialLinks.twitter}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 transition-colors text-slate-200 border border-slate-700"
                                        >
                                            <LinkIcon className="w-3.5 h-3.5 text-slate-400" />
                                            <span>Twitter / X</span>
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
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs p-5 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div>
                        <p className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white flex items-center justify-center gap-1.5">
                            <UserGroupIcon className="w-5 h-5 text-blue-600" />
                            <span>{stats.totalStudents.toLocaleString()}</span>
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                            Total Students
                        </p>
                    </div>
                    <div>
                        <p className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white flex items-center justify-center gap-1.5">
                            <BookOpenIcon className="w-5 h-5 text-indigo-600" />
                            <span>{stats.totalCourses}</span>
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                            Courses Published
                        </p>
                    </div>
                    <div>
                        <p className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white flex items-center justify-center gap-1">
                            <StarIcon className="w-5 h-5 text-amber-500" />
                            <span>{stats.averageRating > 0 ? stats.averageRating : 'N/A'}</span>
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                            Instructor Rating
                        </p>
                    </div>
                    <div>
                        <p className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white flex items-center justify-center gap-1.5">
                            <ChatBubbleLeftRightIcon className="w-5 h-5 text-emerald-600" />
                            <span>{stats.totalReviews.toLocaleString()}</span>
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                            Student Reviews
                        </p>
                    </div>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="container max-w-6xl mx-auto px-4 mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: About & Interests */}
                <div className="space-y-6">
                    {/* About section */}
                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs p-5">
                        <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
                            About the Instructor
                        </h2>
                        {instructor.bio ? (
                            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                                {instructor.bio}
                            </p>
                        ) : (
                            <p className="text-xs text-slate-400 italic">
                                This instructor has not provided a biography yet.
                            </p>
                        )}
                    </div>

                    {/* Expertise / Interests */}
                    {instructor.interests && instructor.interests.length > 0 && (
                        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs p-5">
                            <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
                                Areas of Expertise
                            </h2>
                            <div className="flex flex-wrap gap-1.5">
                                {instructor.interests.map((interest) => (
                                    <span
                                        key={interest}
                                        className="text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
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
                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs p-5 sm:p-6">
                        <div className="flex justify-between items-center mb-5">
                            <div>
                                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                                    Courses by {instructor.name}
                                </h2>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                    {courses.length} {courses.length === 1 ? 'course' : 'courses'} available
                                </p>
                            </div>
                        </div>

                        {courses.length === 0 ? (
                            <div className="text-center py-12 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
                                <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-full flex items-center justify-center mx-auto">
                                    <AcademicCapIcon className="w-5 h-5" />
                                </div>
                                <p className="text-slate-500 dark:text-slate-400 text-xs font-medium">
                                    No published courses available yet.
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
