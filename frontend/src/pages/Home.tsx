import { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { CourseCard, Button, SearchBar } from '../components/common';
import { Course } from '../components/common/CourseCard';
import { useAuth } from '@/features/auth/AuthContext';
import { LearnerHome } from '@/features/student';
import { api } from '@/lib/api';
import { AcademicCapIcon, StarIcon } from '@heroicons/react/20/solid';

const DEFAULT_FALLBACK_THUMBNAIL = 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&h=600&fit=crop';

const TESTIMONIALS = [
    {
        id: 1,
        name: "Alex Rivera",
        role: "Full Stack Engineer @ Spotify",
        image: "https://randomuser.me/api/portraits/men/32.jpg",
        content: "SkillKart's structured learning paths helped me transition from a junior developer to a full-stack engineer in just 6 months. The hands-on curriculum is top tier.",
    },
    {
        id: 2,
        name: "Priya Sharma",
        role: "Frontend Developer @ Microsoft",
        image: "https://randomuser.me/api/portraits/women/44.jpg",
        content: "The interactive quizzes, streak tracking, and verified certificates gave me the confidence and practical portfolio to land my dream tech job.",
    },
    {
        id: 3,
        name: "Marcus Chen",
        role: "Lead Cloud Architect & Instructor",
        image: "https://randomuser.me/api/portraits/men/22.jpg",
        content: "As an instructor, SkillKart gives me the best tools to publish courses, track student completion analytics, and connect with motivated learners worldwide.",
    }
];

const STATS = [
    { label: "Active Learners", value: "10,000+" },
    { label: "Expert Courses", value: "150+" },
    { label: "Completion Rate", value: "95%" },
    { label: "Student Rating", value: "4.8 / 5.0" },
];

const COMPANIES = [
    { name: "Microsoft", logo: "https://upload.wikimedia.org/wikipedia/commons/9/96/Microsoft_logo_%282012%29.svg" },
    { name: "Walmart", logo: "https://upload.wikimedia.org/wikipedia/commons/c/ca/Walmart_logo.svg" },
    { name: "Accenture", logo: "https://upload.wikimedia.org/wikipedia/commons/c/cd/Accenture.svg" },
    { name: "Adobe", logo: "https://upload.wikimedia.org/wikipedia/commons/5/5f/Adobe_corporate_logo.svg" },
    { name: "PayPal", logo: "https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg" }
];

interface RawHomeCourse {
    _id: string;
    id?: string;
    title: string;
    description?: string;
    price?: number;
    level?: string;
    category?: string;
    instructor?: { name?: string };
    instructorName?: string;
    averageRating?: number;
    rating?: number;
    reviewsCount?: number;
    reviewCount?: number;
    studentsCount?: number;
    thumbnailUrl?: string;
    thumbnail?: string;
    enrollmentCount?: number;
    sections?: Array<{ lectures?: Array<{ duration?: number }> }>;
    duration?: number;
    courseBadge?: string;
    isTrending?: boolean;
}

/**
 * Marketing Landing Page (shown to guests and logged-out visitors)
 */
function MarketingLanding() {
    const navigate = useNavigate();
    const [courses, setCourses] = useState<Course[]>([]);
    const [loadingCourses, setLoadingCourses] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        api.get<{ courses: RawHomeCourse[] }>('/courses?limit=8&status=published')
            .then(res => {
                const mapped: Course[] = (res.data.courses || []).map((c: RawHomeCourse) => {
                    const totalSecs = (c.sections || []).reduce((acc: number, s) => {
                        return acc + (s.lectures || []).reduce((lAcc: number, l) => lAcc + (l.duration || 0), 0);
                    }, 0);
                    const hours = Math.round((totalSecs / 3600) * 10) / 10;

                    return {
                        id: c._id || c.id || '',
                        title: c.title,
                        description: c.description || '',
                        instructor: c.instructor?.name || c.instructorName || 'Expert Instructor',
                        price: c.price || 0,
                        rating: c.averageRating || c.rating || 4.8,
                        reviewCount: c.reviewsCount || c.reviewCount || 120,
                        studentsCount: c.studentsCount || c.enrollmentCount || 450,
                        thumbnail: c.thumbnailUrl || c.thumbnail || DEFAULT_FALLBACK_THUMBNAIL,
                        duration: hours > 0 ? `${hours} hrs` : `${c.duration || 6} hrs`,
                        category: c.category || 'General',
                        level: c.level as 'Beginner' | 'Intermediate' | 'Advanced' || 'Beginner',
                        badge: c.courseBadge || (c.isTrending ? 'Popular' : undefined),
                    };
                });
                setCourses(mapped);
            })
            .catch(() => {})
            .finally(() => {
                setLoadingCourses(false);
            });
    }, []);

    const handleSearch = (query: string) => {
        navigate(`/courses?search=${encodeURIComponent(query)}`);
    };

    return (
        <div className="bg-white dark:bg-slate-900 transition-colors">
            {/* Hero Section */}
            <section className="py-16 md:py-24 bg-slate-50 dark:bg-slate-950/60 text-center px-4 border-b border-slate-200 dark:border-slate-800">
                <div className="container mx-auto max-w-4xl">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-xs font-semibold mb-6 border border-blue-200 dark:border-blue-800/60">
                        <AcademicCapIcon className="w-4 h-4 text-blue-600" />
                        <span>High-Impact Professional Skills & Industry Credentials</span>
                    </div>

                    <h1 className="text-3xl md:text-5xl lg:text-6xl font-extrabold text-slate-900 dark:text-white mb-6 leading-tight tracking-tight">
                        Empower your future with<br />
                        courses designed to <span className="text-blue-600 dark:text-blue-400 relative inline-block">
                            fit your career goals.
                        </span>
                    </h1>
                    <p className="text-slate-600 dark:text-slate-300 text-base md:text-lg mb-8 max-w-2xl mx-auto">
                        Learn high-demand disciplines in Engineering, Business, Finance, UI/UX, AI, and Leadership with interactive curriculum, projects, and verified certificates.
                    </p>

                    <div className="max-w-xl mx-auto mb-6">
                        <div className="relative">
                            <SearchBar
                                placeholder="Search Engineering, AI, Business, Design, Finance..."
                                value={searchQuery}
                                onChange={setSearchQuery}
                                onSubmit={handleSearch}
                            />
                        </div>
                    </div>

                    {/* Quick Topic Chips */}
                    <div className="flex flex-wrap justify-center items-center gap-2 max-w-2xl mx-auto mb-8">
                        <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mr-1">
                            Popular:
                        </span>
                        {[
                            { label: 'Business', tag: 'Business' },
                            { label: 'Finance', tag: 'Finance' },
                            { label: 'UI/UX Design', tag: 'Design' },
                            { label: 'AI & Data', tag: 'AI' },
                            { label: 'Web & Tech', tag: 'Web Development' },
                            { label: 'Marketing', tag: 'Marketing' },
                        ].map((topic) => (
                            <button
                                key={topic.tag}
                                type="button"
                                onClick={() => navigate(`/courses?tag=${encodeURIComponent(topic.tag)}`)}
                                className="text-xs font-medium px-3 py-1 rounded-md bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-blue-500 text-slate-600 dark:text-slate-300 transition-all cursor-pointer"
                            >
                                #{topic.label}
                            </button>
                        ))}
                    </div>

                    <div className="flex justify-center gap-3 mb-14">
                        <Button size="lg" onClick={() => navigate('/courses')}>Explore Catalog</Button>
                        <Button size="lg" variant="secondary" onClick={() => navigate('/courses?price=free')}>Free Courses &rarr;</Button>
                    </div>

                    <div className="space-y-3">
                        <p className="text-xs font-semibold tracking-wider uppercase text-slate-400 dark:text-slate-500">Trusted by learners worldwide</p>
                        <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12 opacity-60 grayscale hover:grayscale-0 transition-all duration-300">
                            {COMPANIES.map((company) => (
                                <img key={company.name} src={company.logo} alt={company.name} className="h-5 md:h-7 object-contain dark:invert" />
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Stats Banner */}
            <section className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-8">
                <div className="container mx-auto px-4 max-w-6xl">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                        {STATS.map((stat, idx) => (
                            <div key={idx} className="p-2">
                                <p className="text-2xl md:text-3xl font-extrabold text-blue-600 dark:text-blue-400 mb-1">{stat.value}</p>
                                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">{stat.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Featured Courses */}
            <section className="py-16 container mx-auto px-4 max-w-7xl">
                <div className="text-center mb-10">
                    <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-2">Featured & Top-Rated Courses</h2>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                        Explore our highest rated programs taught by experienced engineers, practitioners, and industry specialists.
                    </p>
                </div>

                {loadingCourses ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                        {[1, 2, 3, 4].map((n) => (
                            <div key={n} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 h-72 animate-pulse" />
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                        {courses.map((course) => (
                            <CourseCard key={course.id} course={course} />
                        ))}
                    </div>
                )}

                <div className="text-center mt-10">
                    <Button variant="secondary" onClick={() => navigate('/courses')}>
                        Show all courses ({courses.length > 0 ? '150+' : 'Explore'}) &rarr;
                    </Button>
                </div>
            </section>

            {/* Testimonials */}
            <section className="py-16 bg-slate-50 dark:bg-slate-950/60 border-t border-slate-200 dark:border-slate-800">
                <div className="container mx-auto px-4 max-w-6xl">
                    <div className="text-center mb-12">
                        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-2">Learner Outcomes & Reviews</h2>
                        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                            See how SkillKart helps developers, professionals, and teams advance their technical and leadership skills.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {TESTIMONIALS.map((testimonial) => (
                            <div key={testimonial.id} className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-2xs border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
                                <div>
                                    <div className="flex items-center gap-3.5 mb-4">
                                        <img src={testimonial.image} alt={testimonial.name} className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700" />
                                        <div>
                                            <h4 className="font-semibold text-slate-900 dark:text-white text-xs">{testimonial.name}</h4>
                                            <p className="text-[11px] text-slate-500 dark:text-slate-400">{testimonial.role}</p>
                                        </div>
                                    </div>
                                    <div className="flex text-amber-500 mb-3 gap-0.5">
                                        {[...Array(5)].map((_, i) => <StarIcon key={i} className="w-3.5 h-3.5" />)}
                                    </div>
                                    <p className="text-slate-600 dark:text-slate-300 text-xs leading-relaxed italic">
                                        "{testimonial.content}"
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-16 container mx-auto px-4 text-center max-w-3xl space-y-4">
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">Start advancing your professional skills today</h2>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-xl mx-auto">
                    Join thousands of professionals mastering new technologies and leadership practices with verified credentials.
                </p>
                <div className="flex justify-center gap-3 pt-2">
                    <Button size="lg" onClick={() => navigate('/courses')}>Get Started</Button>
                    <Button size="lg" variant="secondary" onClick={() => navigate('/courses')}>Explore Catalog &rarr;</Button>
                </div>
            </section>
        </div>
    );
}

/**
 * Main Home Page Route
 * Dynamically switches based on user role:
 * - Admin -> Navigates to /admin (Admin Control Center)
 * - Instructor -> Navigates to /instructor (Instructor Studio)
 * - Student -> Renders the LearnerHome Hub
 * - Guest -> Renders the MarketingLanding Page
 */
function Home() {
    const { user } = useAuth();

    if (user) {
        if (user.role === 'admin') {
            return <Navigate to="/admin" replace />;
        }
        if (user.role === 'instructor') {
            return <Navigate to="/instructor" replace />;
        }
        return <LearnerHome />;
    }

    return <MarketingLanding />;
}

export default Home;
