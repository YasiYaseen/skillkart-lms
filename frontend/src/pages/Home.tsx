import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CourseCard, Button, SearchBar } from '../components/common';
import { Course } from '../components/common/CourseCard';

// --- Mock Data ---
const FEATURED_COURSES: Course[] = [
    {
        id: 1,
        title: 'Build Text to image SaaS App in React JS',
        instructor: 'Richard James',
        thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400&h=300&fit=crop',
        rating: 4.5,
        reviewCount: 122,
        price: 10.99
    },
    {
        id: 2,
        title: 'Build AI BG Removal SaaS App in React JS',
        instructor: 'Richard James',
        thumbnail: 'https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?w=400&h=300&fit=crop',
        rating: 4.5,
        reviewCount: 122,
        price: 10.99
    },
    {
        id: 3,
        title: 'React Router Complete Course in One Video',
        instructor: 'Richard James',
        thumbnail: 'https://images.unsplash.com/photo-1587620962725-abab7fe55159?w=400&h=300&fit=crop',
        rating: 4.5,
        reviewCount: 122,
        price: 10.99
    },
    {
        id: 4,
        title: 'Build Full Stack E-Commerce MERN App in React JS',
        instructor: 'Richard James',
        thumbnail: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=300&fit=crop',
        rating: 4.5,
        reviewCount: 122,
        price: 10.99
    }
];

const TESTIMONIALS = [
    {
        id: 1,
        name: "Donald Jackman",
        role: "SWE 1 @ Amazon",
        image: "https://randomuser.me/api/portraits/men/32.jpg",
        content: "I've been using SkillKart for nearly two years, primarily for Instagram, and it has been incredibly user-friendly, making my work much easier.",
    },
    {
        id: 2,
        name: "Richard Nelson",
        role: "SDE 2 @ Samsung",
        image: "https://randomuser.me/api/portraits/men/45.jpg",
        content: "I've been using SkillKart for nearly two years, primarily for Instagram, and it has been incredibly user-friendly, making my work much easier.",
    },
    {
        id: 3,
        name: "James Washington",
        role: "SDE 2 @ Google",
        image: "https://randomuser.me/api/portraits/men/22.jpg",
        content: "I've been using SkillKart for nearly two years, primarily for Instagram, and it has been incredibly user-friendly, making my work much easier.",
    }
];

const COMPANIES = [
    { name: "Microsoft", logo: "https://upload.wikimedia.org/wikipedia/commons/9/96/Microsoft_logo_%282012%29.svg" },
    { name: "Walmart", logo: "https://upload.wikimedia.org/wikipedia/commons/c/ca/Walmart_logo.svg" },
    { name: "Accenture", logo: "https://upload.wikimedia.org/wikipedia/commons/c/cd/Accenture.svg" },
    { name: "Adobe", logo: "https://upload.wikimedia.org/wikipedia/commons/5/5f/Adobe_corporate_logo.svg" },
    { name: "PayPal", logo: "https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg" }
];

function Home() {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');

    const handleSearch = (query: string) => {
        navigate(`/courses?search=${encodeURIComponent(query)}`);
    };

    return (
        <div className="bg-white">
            {/* Hero Section */}
            <section className="py-20 md:py-28 bg-gradient-to-b from-blue-50 to-white text-center px-4">
                <div className="container mx-auto max-w-4xl">
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 mb-6 leading-tight">
                        Empower your future with the<br />
                        courses designed to <span className="text-blue-600 relative inline-block">
                            fit your choice.
                            <svg className="absolute w-full h-3 -bottom-1 left-0 text-blue-200 -z-10" viewBox="0 0 100 10" preserveAspectRatio="none">
                                <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="8" fill="none" />
                            </svg>
                        </span>
                    </h1>
                    <p className="text-gray-600 text-lg md:text-xl mb-10 max-w-2xl mx-auto">
                        We bring together world-class instructors, interactive content, and a supportive community to help you achieve your personal and professional goals.
                    </p>

                    <div className="max-w-xl mx-auto mb-16">
                        <div className="relative">
                            <SearchBar
                                placeholder="Search for courses"
                                value={searchQuery}
                                onChange={setSearchQuery}
                                onSubmit={handleSearch}
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <p className="text-sm font-medium text-gray-500">Trusted by learners from</p>
                        <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12 opacity-70 grayscale hover:grayscale-0 transition-all duration-300">
                            {COMPANIES.map((company) => (
                                <img key={company.name} src={company.logo} alt={company.name} className="h-6 md:h-8 object-contain" />
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Featured Courses */}
            <section className="py-20 container mx-auto px-4">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">Learn from the best</h2>
                    <p className="text-gray-600 max-w-2xl mx-auto">
                        Discover our top-rated courses across various categories. From coding and design to business and wellness, our courses are crafted to deliver results.
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    {FEATURED_COURSES.map(course => (
                        <CourseCard key={course.id} course={course} />
                    ))}
                </div>

                <div className="text-center mt-12">
                    <Button variant="secondary" onClick={() => navigate('/courses')}>
                        Show all courses
                    </Button>
                </div>
            </section>

            {/* Testimonials */}
            <section className="py-20 bg-gray-50">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-gray-900 mb-4">Testimonials</h2>
                        <p className="text-gray-600 max-w-2xl mx-auto">
                            Hear from our learners as they share their journeys of transformation, success, and how our platform has made a difference in their lives.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {TESTIMONIALS.map((testimonial) => (
                            <div key={testimonial.id} className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
                                <div className="flex items-center gap-4 mb-6">
                                    <img src={testimonial.image} alt={testimonial.name} className="w-12 h-12 rounded-full object-cover" />
                                    <div>
                                        <h4 className="font-bold text-gray-900">{testimonial.name}</h4>
                                        <p className="text-xs text-gray-500">{testimonial.role}</p>
                                    </div>
                                </div>
                                <div className="flex text-orange-400 mb-4 text-sm">
                                    {[...Array(5)].map((_, i) => <span key={i}>★</span>)}
                                </div>
                                <p className="text-gray-600 text-sm leading-relaxed">
                                    "{testimonial.content}"
                                </p>
                                <a href="#" className="text-blue-600 text-sm font-medium mt-4 inline-block hover:underline">Read more</a>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 container mx-auto px-4 text-center">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">Learn anything, anytime, anywhere</h2>
                <p className="text-gray-600 max-w-2xl mx-auto mb-8">
                    Incididunt sint fugiat pariatur cupidatat consectetur sit cillum anim id veniam aliqua proident excepteur commodo do ea.
                </p>
                <div className="flex justify-center gap-4">
                    <Button size="lg" onClick={() => navigate('/courses')}>Get started</Button>
                    <Button size="lg" variant="secondary" onClick={() => navigate('/courses')}>Learn more &rarr;</Button>
                </div>
            </section>

        </div>
    );
}

export default Home;
