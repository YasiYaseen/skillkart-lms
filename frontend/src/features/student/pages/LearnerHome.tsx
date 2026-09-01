import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/features/auth/AuthContext';
import { api } from '@/lib/api';
import { enrollmentService } from '@/features/enrollment/services/enrollmentService';
import { Course } from '@/components/common/CourseCard';
import { SearchBar } from '@/components/common';
import ContinueLearningShelf from '../components/ContinueLearningShelf';
import CategoryExplorer, { CategoryTrack } from '../components/CategoryExplorer';
import CourseRowShelf from '../components/CourseRowShelf';
import CourseRecommendations from '@/components/course/CourseRecommendations';
import RecentlyViewedCourses from '@/components/course/RecentlyViewedCourses';
import {
    AcademicCapIcon,
    DocumentTextIcon,
    TrophyIcon,
    HeartIcon,
    UserGroupIcon,
    ArrowRightIcon,
    SparklesIcon,
    FireIcon,
    StarIcon,
    TagIcon,
} from '@heroicons/react/24/outline';

interface RawApiCourse {
    _id: string;
    title: string;
    instructor?: { name?: string; avatar?: string; headline?: string };
    thumbnailUrl?: string;
    tags?: string[];
    averageRating?: number;
    reviewCount?: number;
    price?: number;
    level?: string;
    enrollmentCount?: number;
    durationMinutes?: number;
    totalLessons?: number;
}

interface FeaturedInstructor {
    _id: string;
    name: string;
    avatar?: string;
    headline?: string;
    courseCount: number;
    studentCount: number;
    ratingAvg: number;
}

interface DiscoveryFeedData {
    trending: RawApiCourse[];
    topRated: RawApiCourse[];
    freeStarters: RawApiCourse[];
    newReleases: RawApiCourse[];
    categoryTracks: CategoryTrack[];
    featuredInstructors: FeaturedInstructor[];
    totalPublishedCourses: number;
}

function mapRawCourse(c: RawApiCourse): Course {
    return {
        id: c._id,
        title: c.title,
        instructor: c.instructor?.name || 'Instructor',
        thumbnail: c.thumbnailUrl || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&h=400&fit=crop',
        tags: c.tags || [],
        rating: c.averageRating || 0,
        reviewCount: c.reviewCount || 0,
        price: c.price || 0,
        level: c.level || 'beginner',
        enrollmentCount: c.enrollmentCount || 0,
        durationMinutes: c.durationMinutes || 0,
        totalLessons: c.totalLessons || 0,
    };
}

function getTimeOfDayGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
}

export function LearnerHome() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [searchQuery, setSearchQuery] = useState('');
    const [feed, setFeed] = useState<DiscoveryFeedData | null>(null);
    const [loading, setLoading] = useState(true);
    const [enrolledCourseIds, setEnrolledCourseIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (user) {
            enrollmentService.getMyEnrollments({ limit: 500 })
                .then((res) => {
                    const enrollments = res.data?.data || res.data?.enrollments || res.data || [];
                    const ids = new Set<string>();
                    for (const item of (Array.isArray(enrollments) ? enrollments : [])) {
                        const courseObj = item.course || item;
                        const cId = typeof courseObj === 'object' ? (courseObj._id || courseObj.id) : courseObj;
                        if (cId) ids.add(String(cId));
                    }
                    setEnrolledCourseIds(ids);
                })
                .catch(() => {});
        } else {
            setEnrolledCourseIds(new Set());
        }
    }, [user]);

    useEffect(() => {
        api.get<DiscoveryFeedData>('/courses/discovery-feed')
            .then((res) => {
                setFeed(res.data);
            })
            .catch((err) => {
                console.error('Failed to load discovery feed:', err);
            })
            .finally(() => {
                setLoading(false);
            });
    }, []);

    const handleSearch = (q: string) => {
        if (!q.trim()) return;
        navigate(`/courses?search=${encodeURIComponent(q.trim())}`);
    };

    const greeting = getTimeOfDayGreeting();
    const mapWithEnrollment = (c: RawApiCourse) => ({
        ...mapRawCourse(c),
        isEnrolled: enrolledCourseIds.has(String(c._id)),
    });

    const trendingCourses = (feed?.trending || []).map(mapWithEnrollment);
    const topRatedCourses = (feed?.topRated || []).map(mapWithEnrollment);
    const freeCourses = (feed?.freeStarters || []).map(mapWithEnrollment);
    const newCourses = (feed?.newReleases || []).map(mapWithEnrollment);

    return (
        <div className="container py-8 space-y-10">
            {/* 1. Dynamic Hero Welcome & Search Hub */}
            <section className="rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white p-6 sm:p-8 md:p-10 border border-slate-200 dark:border-slate-800 shadow-xs">
                <div className="max-w-3xl space-y-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-blue-50 dark:bg-blue-500/15 border border-blue-200 dark:border-blue-400/20 text-blue-700 dark:text-blue-300 text-xs font-semibold">
                        <span>{greeting}, {user?.name?.split(' ')[0] || 'Learner'}</span>
                        <span className="w-1 h-1 rounded-full bg-blue-500 dark:bg-blue-400" />
                        <span className="text-slate-600 dark:text-slate-300">SkillKart Learning Hub</span>
                    </div>

                    <h1 className="text-2xl sm:text-4xl font-bold tracking-tight leading-tight text-slate-900 dark:text-white">
                        Build verified skills with expert-led courses.
                    </h1>

                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl">
                        Explore rigorous, project-based courses across software engineering, data science, product design, finance, and leadership.
                    </p>

                    {/* Integrated Search Bar */}
                    <div className="pt-2 max-w-2xl">
                        <SearchBar
                            value={searchQuery}
                            onChange={setSearchQuery}
                            onSubmit={handleSearch}
                            placeholder="Search courses, skills, or instructors..."
                        />
                    </div>

                    {/* Topic Badges */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs">
                        <span className="text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[10px] mr-1">
                            Popular:
                        </span>
                        {[
                            { label: 'Engineering', tag: 'Web Development' },
                            { label: 'AI & Data', tag: 'AI' },
                            { label: 'UI/UX Design', tag: 'Design' },
                            { label: 'Business', tag: 'Business' },
                            { label: 'Finance', tag: 'Finance' },
                            { label: 'Marketing', tag: 'Marketing' },
                        ].map((t) => (
                            <button
                                key={t.tag}
                                onClick={() => navigate(`/courses?tag=${encodeURIComponent(t.tag)}`)}
                                className="px-2.5 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer text-xs font-medium"
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Quick Learner Stats Quicklinks */}
                <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <Link
                        to="/my-courses"
                        className="p-3.5 rounded-lg bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/70 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/60 transition-colors flex items-center gap-3 group"
                    >
                        <div className="w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                            <AcademicCapIcon className="w-5 h-5" />
                        </div>
                        <div className="truncate">
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">Enrolled Courses</p>
                            <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-300 transition-colors">My Learning →</p>
                        </div>
                    </Link>

                    <Link
                        to="/study-hub"
                        className="p-3.5 rounded-lg bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/70 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/60 transition-colors flex items-center gap-3 group"
                    >
                        <div className="w-9 h-9 rounded-lg bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                            <DocumentTextIcon className="w-5 h-5" />
                        </div>
                        <div className="truncate">
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">Study Notes</p>
                            <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors">Study Hub →</p>
                        </div>
                    </Link>

                    <Link
                        to="/my-certificates"
                        className="p-3.5 rounded-lg bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/70 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/60 transition-colors flex items-center gap-3 group"
                    >
                        <div className="w-9 h-9 rounded-lg bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                            <TrophyIcon className="w-5 h-5" />
                        </div>
                        <div className="truncate">
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">Credentials</p>
                            <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-300 transition-colors">Certificates →</p>
                        </div>
                    </Link>

                    <Link
                        to="/wishlist"
                        className="p-3.5 rounded-lg bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/70 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/60 transition-colors flex items-center gap-3 group"
                    >
                        <div className="w-9 h-9 rounded-lg bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                            <HeartIcon className="w-5 h-5" />
                        </div>
                        <div className="truncate">
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">Saved Courses</p>
                            <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-300 transition-colors">Wishlist →</p>
                        </div>
                    </Link>
                </div>
            </section>

            {/* 2. Jump Back In / Resume Learning */}
            <ContinueLearningShelf />

            {/* 3. Personalized Recommendations */}
            <div className="pt-2">
                <CourseRecommendations
                    title="Recommended for You"
                    subtitle="Courses tailored to your active learning path and preferences"
                />
            </div>

            {/* 4. Career Paths & Skill Tracks Explorer */}
            <div className="pt-2">
                <CategoryExplorer categories={feed?.categoryTracks} />
            </div>

            {/* 5. Trending & Popular Courses */}
            <div className="pt-2">
                <CourseRowShelf
                    title="Popular Programs"
                    subtitle="Most enrolled courses chosen by developers and professionals this month"
                    icon={<FireIcon className="w-5 h-5 text-amber-500" />}
                    badge="Trending"
                    courses={trendingCourses}
                    viewAllLink="/courses?sort=popular"
                    loading={loading}
                />
            </div>

            {/* 6. Free Starter Pack */}
            {freeCourses.length > 0 && (
                <div className="pt-2">
                    <div className="p-5 sm:p-6 rounded-xl bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                        <CourseRowShelf
                            title="Free Starter Courses"
                            subtitle="Zero-cost masterclasses. Begin learning immediately with 1-click enroll"
                            icon={<TagIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />}
                            badge="Free"
                            courses={freeCourses}
                            viewAllLink="/courses?priceTier=free"
                            loading={loading}
                        />
                    </div>
                </div>
            )}

            {/* 7. Highest Rated Masterclasses */}
            <div className="pt-2">
                <CourseRowShelf
                    title="Top-Rated Courses"
                    subtitle="Highly rated courses verified by student reviews and certificate completions"
                    icon={<StarIcon className="w-5 h-5 text-amber-500" />}
                    badge="Top Rated"
                    courses={topRatedCourses}
                    viewAllLink="/courses?sort=highest-rated"
                    loading={loading}
                />
            </div>

            {/* 8. New Releases */}
            {newCourses.length > 0 && (
                <div className="pt-2">
                    <CourseRowShelf
                        title="New Releases"
                        subtitle="Recently published curricula covering modern toolchains and frameworks"
                        icon={<SparklesIcon className="w-5 h-5 text-blue-500" />}
                        badge="New"
                        courses={newCourses}
                        viewAllLink="/courses?sort=latest"
                        loading={loading}
                    />
                </div>
            )}

            {/* 9. Featured Instructors Spotlight */}
            {feed?.featuredInstructors && feed.featuredInstructors.length > 0 && (
                <section className="pt-2 space-y-4">
                    <div>
                        <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
                            <UserGroupIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            <span>Learn from Industry Practitioners</span>
                        </h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            Senior engineers, leaders, and educators guiding your curriculum.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {feed.featuredInstructors.map((inst) => (
                            <Link
                                key={inst._id}
                                to={`/instructors/${inst._id}`}
                                className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col items-center text-center group"
                            >
                                <img
                                    src={inst.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(inst.name)}`}
                                    alt={inst.name}
                                    className="w-16 h-16 rounded-full object-cover border-2 border-slate-200 dark:border-slate-700 shadow-2xs mb-3 group-hover:scale-105 transition-transform"
                                />
                                <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                    {inst.name}
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mb-3">
                                    {inst.headline || 'Course Instructor'}
                                </p>
                                <div className="mt-auto w-full pt-2.5 border-t border-slate-100 dark:border-slate-800 flex justify-around text-xs text-slate-600 dark:text-slate-400 font-medium">
                                    <span>{inst.courseCount} {inst.courseCount === 1 ? 'course' : 'courses'}</span>
                                    <span>•</span>
                                    <span>{inst.studentCount} students</span>
                                </div>
                            </Link>
                        ))}
                    </div>
                </section>
            )}

            {/* 10. Recently Viewed Strip */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                <RecentlyViewedCourses />
            </div>

            {/* 11. Browse All Catalog CTA */}
            <section className="rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white p-6 sm:p-8 md:p-10 text-center space-y-3 border border-slate-200 dark:border-slate-800 shadow-xs">
                <h2 className="text-xl sm:text-2xl font-bold">
                    Looking for a specific skill or certification?
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-lg mx-auto">
                    Search our complete catalog of over {feed?.totalPublishedCourses || '150+'} courses with faceted filters, prerequisites, and level paths.
                </p>
                <div className="pt-2">
                    <Link
                        to="/courses"
                        className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs sm:text-sm shadow-xs transition-colors"
                    >
                        <span>Explore Full Catalog</span>
                        <ArrowRightIcon className="w-4 h-4" />
                    </Link>
                </div>
            </section>
        </div>
    );
}

export default LearnerHome;
