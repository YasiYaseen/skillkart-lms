import { useState, useEffect } from 'react';
import { useNavigate, Link, Navigate } from 'react-router-dom';
import { CourseCard, Button, SearchBar } from '../components/common';
import { Course } from '../components/common/CourseCard';
import { useAuth } from '@/features/auth/AuthContext';
import { LearnerHome } from '@/features/student';
import { api } from '@/lib/api';

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
    title: string;
    instructor?: { name?: string };
    thumbnailUrl?: string;
    averageRating?: number;
    reviewCount?: number;
    price?: number;
    level?: string;
    tags?: string[];
    enrollmentCount?: number;
}

/**
 * Marketing Landing Page (shown to guests and logged-out visitors)
 */
function MarketingLanding() {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [courses, setCourses] = useState<Course[]>([]);
    const [loadingCourses, setLoadingCourses] = useState(true);

    useEffect(() => {
        api.get<{ courses: RawHomeCourse[] }>('/courses')
            .then((res) => {
                const raw = res.data?.courses || [];
                const mapped: Course[] = raw.slice(0, 4).map((c: RawHomeCourse) => ({
                    id: c._id,
                    title: c.title,
                    instructor: c.instructor?.name || 'Instructor',
                    thumbnail: c.thumbnailUrl || DEFAULT_FALLBACK_THUMBNAIL,
                    rating: c.averageRating || 4.5,
                    reviewCount: c.reviewCount || 0,
                    price: c.price || 0,
                    level: c.level || 'beginner',
                    tags: c.tags || [],
                    enrollmentCount: c.enrollmentCount || 0,
                }));
                setCourses(mapped);
            })
            .catch(() => {
                // Keep empty on error
            })
            .finally(() => {
                setLoadingCourses(false);
            });
    }, []);

    const handleSearch = (query: string) => {
        navigate(`/courses?search=${encodeURIComponent(query)}`);
    };

    return (
        <div className="bg-white dark:bg-gray-900 transition-colors">
            {/* Hero Section */}
            <section className="py-20 md:py-28 bg-gradient-to-b from-indigo-50/60 via-white to-white dark:from-gray-900 dark:via-gray-900 dark:to-gray-900 text-center px-4">
                <div className="container mx-auto max-w-4xl">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-xs font-semibold mb-6">
                        <span>🚀</span>
                        <span>Transform Your Professional Skills & Knowledge</span>
                    </div>

                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 dark:text-white mb-6 leading-tight">
                        Empower your future with<br />
                        courses designed to <span className="text-indigo-600 dark:text-indigo-400 relative inline-block">
                            fit your goals.
                            <svg className="absolute w-full h-3 -bottom-1 left-0 text-indigo-200 dark:text-indigo-800/60 -z-10" viewBox="0 0 100 10" preserveAspectRatio="none">
                                <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="8" fill="none" />
                            </svg>
                        </span>
                    </h1>
                    <p className="text-gray-600 dark:text-gray-300 text-lg md:text-xl mb-10 max-w-2xl mx-auto">
                        Learn high-demand skills in Business, Finance, Design, Engineering, AI, and Leadership with interactive curriculum, projects, and verified certificates.
                    </p>

                    <div className="max-w-xl mx-auto mb-6">
                        <div className="relative">
                            <SearchBar
                                placeholder="Search Business, Finance, Design, AI, Technology..."
                                value={searchQuery}
                                onChange={setSearchQuery}
                                onSubmit={handleSearch}
                            />
                        </div>
                    </div>

                    {/* Quick Topic Chips */}
                    <div className="flex flex-wrap justify-center items-center gap-2 max-w-2xl mx-auto mb-10">
                        <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mr-1">
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
                                className="text-xs font-medium px-3 py-1.5 rounded-full bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-indigo-500 dark:hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 shadow-2xs transition-all cursor-pointer"
                            >
                                #{topic.label}
                            </button>
                        ))}
                    </div>

                    <div className="flex justify-center gap-4 mb-16">
                        <Button size="lg" onClick={() => navigate('/courses')}>Explore Catalog</Button>
                        <Button size="lg" variant="secondary" onClick={() => navigate('/courses?priceTier=free')}>Free Courses &rarr;</Button>
                    </div>

                    <div className="space-y-4">
                        <p className="text-xs font-semibold tracking-wider uppercase text-gray-400 dark:text-gray-500">Trusted by learners from top teams</p>
                        <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12 opacity-70 grayscale hover:grayscale-0 transition-all duration-300">
                            {COMPANIES.map((company) => (
                                <img key={company.name} src={company.logo} alt={company.name} className="h-6 md:h-8 object-contain dark:invert" />
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Stats Banner */}
            <section className="border-y border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/40 py-10">
                <div className="container mx-auto px-4 max-w-6xl">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                        {STATS.map((stat, idx) => (
                            <div key={idx} className="p-4">
                                <p className="text-3xl md:text-4xl font-extrabold text-indigo-600 dark:text-indigo-400 mb-1">{stat.value}</p>
                                <p className="text-xs md:text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{stat.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Featured Courses */}
            <section className="py-20 container mx-auto px-4 max-w-7xl">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">Featured & Top-Rated Courses</h2>
                    <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                        Explore our highest rated programs taught by experienced engineers, designers, and industry specialists.
                    </p>
                </div>

                {loadingCourses ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[1, 2, 3, 4].map((n) => (
                            <div key={n} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 h-72 animate-pulse" />
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {courses.map((course) => (
                            <CourseCard key={course.id} course={course} />
                        ))}
                    </div>
                )}

                <div className="text-center mt-12">
                    <Button variant="secondary" onClick={() => navigate('/courses')}>
                        Show all courses ({courses.length > 0 ? '150+' : 'Explore'}) &rarr;
                    </Button>
                </div>
            </section>

            {/* Testimonials */}
            <section className="py-20 bg-gray-50 dark:bg-gray-800/40 border-t border-gray-100 dark:border-gray-800">
                <div className="container mx-auto px-4 max-w-6xl">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">Learner Success Stories</h2>
                        <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                            See how SkillKart helps developers, students, and professionals achieve their goals and accelerate their careers.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {TESTIMONIALS.map((testimonial) => (
                            <div key={testimonial.id} className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xs border border-gray-200 dark:border-gray-700 flex flex-col justify-between">
                                <div>
                                    <div className="flex items-center gap-4 mb-6">
                                        <img src={testimonial.image} alt={testimonial.name} className="w-12 h-12 rounded-full object-cover border-2 border-indigo-100 dark:border-indigo-900" />
                                        <div>
                                            <h4 className="font-bold text-gray-900 dark:text-white text-sm">{testimonial.name}</h4>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">{testimonial.role}</p>
                                        </div>
                                    </div>
                                    <div className="flex text-amber-400 mb-4 text-sm">
                                        {[...Array(5)].map((_, i) => <span key={i}>★</span>)}
                                    </div>
                                    <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed italic">
                                        "{testimonial.content}"
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 container mx-auto px-4 text-center max-w-4xl">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">Start learning skills for your future today</h2>
                <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-8">
                    Join thousands of students and professionals advancing their careers with hands-on, high-impact online courses.
                </p>
                <div className="flex justify-center gap-4">
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
