import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/features/auth/AuthContext';
import { api } from '@/lib/api';
import { Course } from '@/components/common/CourseCard';
import { SearchBar } from '@/components/common';
import ContinueLearningShelf from '../components/ContinueLearningShelf';
import CategoryExplorer, { CategoryTrack } from '../components/CategoryExplorer';
import CourseRowShelf from '../components/CourseRowShelf';
import CourseRecommendations from '@/components/course/CourseRecommendations';
import RecentlyViewedCourses from '@/components/course/RecentlyViewedCourses';

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
    const trendingCourses = (feed?.trending || []).map(mapRawCourse);
    const topRatedCourses = (feed?.topRated || []).map(mapRawCourse);
    const freeCourses = (feed?.freeStarters || []).map(mapRawCourse);
    const newCourses = (feed?.newReleases || []).map(mapRawCourse);

    return (
        <div className="container py-8 space-y-12 px-4 max-w-7xl">
            {/* 1. Dynamic Hero Welcome & Search Hub */}
            <section className="relative overflow-hidden rounded-3xl bg-linear-to-br from-indigo-950 via-slate-900 to-indigo-900 text-white p-7 md:p-10 border border-indigo-800/40 shadow-2xl">
                <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />

                <div className="relative z-10 max-w-3xl space-y-5">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-indigo-200 text-xs font-semibold">
                        <span>👋</span>
                        <span>{greeting}, {user?.name?.split(' ')[0] || 'Learner'}!</span>
                        <span className="w-1 h-1 rounded-full bg-indigo-300" />
                        <span className="text-white">Learn high-demand skills for your future</span>
                    </div>

                    <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight">
                        What skill will you master today?
                    </h1>

                    <p className="text-sm md:text-base text-indigo-100/90 leading-relaxed max-w-2xl">
                        Explore expert-led courses across Business, Technology, Creative Design, Finance, Marketing, and Artificial Intelligence.
                    </p>

                    {/* Integrated Search Bar */}
                    <div className="pt-2 max-w-2xl">
                        <SearchBar
                            value={searchQuery}
                            onChange={setSearchQuery}
                            onSubmit={handleSearch}
                            placeholder="Search courses, skills, or topics (e.g. Leadership, Finance, Design, AI, Python)..."
                        />
                    </div>

                    {/* Topic Badges */}
                    <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                        <span className="text-indigo-300 font-bold uppercase tracking-wider text-[10px]">
                            Popular Topics:
                        </span>
                        {[
                            { label: 'Business & Management', tag: 'Business' },
                            { label: 'Finance & Stocks', tag: 'Finance' },
                            { label: 'UI/UX Design', tag: 'Design' },
                            { label: 'AI & Data Science', tag: 'AI' },
                            { label: 'Web & Software Dev', tag: 'Web Development' },
                            { label: 'Digital Marketing', tag: 'Marketing' },
                        ].map((t) => (
                            <button
                                key={t.tag}
                                onClick={() => navigate(`/courses?tag=${encodeURIComponent(t.tag)}`)}
                                className="px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 text-indigo-100 hover:text-white transition-all cursor-pointer text-xs font-medium"
                            >
                                #{t.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Quick Learner Stats Quicklinks */}
                <div className="relative z-10 mt-8 pt-6 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <Link
                        to="/my-courses"
                        className="p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 backdrop-blur-xs transition-all flex items-center gap-3"
                    >
                        <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-300 flex items-center justify-center text-lg shrink-0">
                            📚
                        </div>
                        <div className="truncate">
                            <p className="text-[11px] text-indigo-200">Enrolled Courses</p>
                            <p className="text-sm font-bold text-white">My Learning →</p>
                        </div>
                    </Link>

                    <Link
                        to="/study-hub"
                        className="p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 backdrop-blur-xs transition-all flex items-center gap-3"
                    >
                        <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center text-lg shrink-0">
                            📝
                        </div>
                        <div className="truncate">
                            <p className="text-[11px] text-indigo-200">Study Notes & Marks</p>
                            <p className="text-sm font-bold text-white">Study Hub →</p>
                        </div>
                    </Link>

                    <Link
                        to="/my-certificates"
                        className="p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 backdrop-blur-xs transition-all flex items-center gap-3"
                    >
                        <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center text-lg shrink-0">
                            🏆
                        </div>
                        <div className="truncate">
                            <p className="text-[11px] text-indigo-200">Earned Credentials</p>
                            <p className="text-sm font-bold text-white">Certificates →</p>
                        </div>
                    </Link>

                    <Link
                        to="/wishlist"
                        className="p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 backdrop-blur-xs transition-all flex items-center gap-3"
                    >
                        <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-300 flex items-center justify-center text-lg shrink-0">
                            ❤️
                        </div>
                        <div className="truncate">
                            <p className="text-[11px] text-indigo-200">Saved Courses</p>
                            <p className="text-sm font-bold text-white">Wishlist →</p>
                        </div>
                    </Link>
                </div>
            </section>

            {/* 2. Jump Back In / Resume Learning Hero */}
            <ContinueLearningShelf />

            {/* 3. Personalized Recommendations ("Picked For You") */}
            <div className="pt-2">
                <CourseRecommendations
                    title="Picked Just For You"
                    subtitle="Personalized recommendations matching your learning goals and enrolled topics"
                />
            </div>

            {/* 4. Career Paths & Skill Tracks Explorer */}
            <div className="pt-4">
                <CategoryExplorer categories={feed?.categoryTracks} />
            </div>

            {/* 5. Trending & Bestsellers Shelf */}
            <div className="pt-4">
                <CourseRowShelf
                    title="Trending & Bestselling Courses"
                    subtitle="The most popular programs chosen by developers and engineers this month"
                    icon="🔥"
                    badge="Hot"
                    courses={trendingCourses}
                    viewAllLink="/courses?sort=popular"
                    loading={loading}
                />
            </div>

            {/* 6. Free Starter Pack (Friction-Free Enroll) */}
            {freeCourses.length > 0 && (
                <div className="pt-4">
                    <div className="p-6 md:p-8 rounded-3xl bg-linear-to-r from-emerald-500/10 via-teal-500/5 to-emerald-500/10 border border-emerald-500/20">
                        <CourseRowShelf
                            title="Free Starter Courses"
                            subtitle="Zero-cost masterclasses. Start learning immediately with 1-click enroll"
                            icon="🎁"
                            badge="100% Free"
                            courses={freeCourses}
                            viewAllLink="/courses?priceTier=free"
                            loading={loading}
                        />
                    </div>
                </div>
            )}

            {/* 7. Top-Rated Masterclasses */}
            <div className="pt-4">
                <CourseRowShelf
                    title="Highest Rated Masterclasses"
                    subtitle="Top student-reviewed curricula with 4.8+ star ratings and certificates"
                    icon="⭐"
                    badge="Top Rated"
                    courses={topRatedCourses}
                    viewAllLink="/courses?sort=highest-rated"
                    loading={loading}
                />
            </div>

            {/* 8. New Releases */}
            {newCourses.length > 0 && (
                <div className="pt-4">
                    <CourseRowShelf
                        title="New Releases & Latest Curriculums"
                        subtitle="Freshly published courses with cutting-edge frameworks and architectures"
                        icon="🚀"
                        badge="New"
                        courses={newCourses}
                        viewAllLink="/courses?sort=latest"
                        loading={loading}
                    />
                </div>
            )}

            {/* 9. Featured Instructors Spotlight */}
            {feed?.featuredInstructors && feed.featuredInstructors.length > 0 && (
                <section className="pt-4 space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-extrabold text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
                                <span>👨‍🏫</span>
                                <span>Learn from Industry Experts</span>
                            </h2>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                Senior engineers, tech leads, and educators guiding your learning journey.
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {feed.featuredInstructors.map((inst) => (
                            <Link
                                key={inst._id}
                                to={`/instructors/${inst._id}`}
                                className="p-5 rounded-3xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-xs hover:shadow-lg transition-all flex flex-col items-center text-center group"
                            >
                                <img
                                    src={inst.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(inst.name)}`}
                                    alt={inst.name}
                                    className="w-20 h-20 rounded-full object-cover border-3 border-indigo-100 dark:border-indigo-900 shadow-sm mb-3 group-hover:scale-105 transition-transform"
                                />
                                <h3 className="font-bold text-gray-900 dark:text-white text-base group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                    {inst.name}
                                </h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 mb-3">
                                    {inst.headline || 'Senior Course Creator'}
                                </p>
                                <div className="mt-auto w-full pt-3 border-t border-gray-100 dark:border-gray-700 flex justify-around text-xs text-gray-600 dark:text-gray-300 font-semibold">
                                    <span>{inst.courseCount} {inst.courseCount === 1 ? 'Course' : 'Courses'}</span>
                                    <span>•</span>
                                    <span>{inst.studentCount} Students</span>
                                </div>
                            </Link>
                        ))}
                    </div>
                </section>
            )}

            {/* 10. Recently Viewed Strip */}
            <div className="pt-6 border-t border-gray-100 dark:border-gray-800">
                <RecentlyViewedCourses />
            </div>

            {/* 11. Browse All Catalog CTA */}
            <section className="rounded-3xl bg-linear-to-r from-indigo-600 to-purple-700 text-white p-8 md:p-10 text-center space-y-4 shadow-xl">
                <h2 className="text-2xl md:text-3xl font-black">
                    Looking for something specific?
                </h2>
                <p className="text-sm text-indigo-100 max-w-xl mx-auto">
                    Explore our entire library of over {feed?.totalPublishedCourses || '150+'} courses with full faceted filters, tags, and level options.
                </p>
                <div className="pt-2">
                    <Link
                        to="/courses"
                        className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-white text-indigo-700 hover:bg-indigo-50 font-extrabold text-sm shadow-lg transition-transform hover:-translate-y-0.5"
                    >
                        <span>Open Full Course Catalog</span>
                        <span>→</span>
                    </Link>
                </div>
            </section>
        </div>
    );
}

export default LearnerHome;
