import CourseStructure from '@/components/course/CourseStructure';
import { useParams } from 'react-router-dom';

// --- Mock Data ---

const COURSE_DATA = {
    id: 1,
    title: "Build Text to image SaaS App in React JS",
    subtitle: "Master MERN Stack by building a Full Stack AI Text to Image SaaS App using React js, Mongodb, Node js, Express js and Stripe Payment",
    instructor: "Richard James",
    rating: 4.5,
    ratingCount: 122,
    studentCount: 21,
    thumbnail: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&h=600&fit=crop",
    price: 10.99,
    oldPrice: 19.99,
    discount: 50,
    daysLeft: 5,
    totalHours: 30,
    totalLessons: 54,
    lastUpdated: "08/2023",
    language: "English",
    captions: "English",
    description: [
        "This is the most comprehensive and in-depth JavaScript course with 30 JavaScript projects.",
        "JavaScript is currently the most popular programming language in the world. If you are an aspiring web developer or full stack developer, JavaScript is a must to learn. It also helps you to get high-paying jobs all over the world.",
        "In this course, you will learn modern JavaScript from the very beginning, step-by-step. We will cover all the core concepts, modern ES6+ features, asynchronous programming, and much more."
    ],
    whatYouWillLearn: [
        "Lifetime access with free updates.",
        "Step-by-step, hands-on project guidance.",
        "Downloadable resources and source code.",
        "Quizzes to test your knowledge.",
        "Certificate of completion."
    ],
    structure: {
        totalSections: 22,
        totalLectures: 54,
        totalDuration: "27h 25m",
        sections: [
            {
                id: 1,
                title: "Project Introduction",
                lectureCount: 3,
                duration: "45 m",
                lectures: [
                    { title: "App Overview - Build Text-to-Image SaaS", duration: "10 mins" },
                    { title: "Tech Stack - React, Node.js, MongoDB", duration: "15 mins" },
                    { title: "Core Features - Authentication, payment, deployment", duration: "20 mins" }
                ]
            },
            {
                id: 2,
                title: "Project Setup and configuration",
                lectureCount: 4,
                duration: "45 m",
                lectures: [
                    { title: "Environment Setup - Install Node.js, VS Code", duration: "10 mins" },
                    { title: "Repository Setup - Clone project repository", duration: "10 mins" },
                    { title: "Install Dependencies - Set up npm packages", duration: "10 mins" },
                    { title: "Initial Configuration - Set up basic files and folders", duration: "15 mins" }
                ]
            },
            { id: 3, title: "Tailwind Setup", lectureCount: 4, duration: "45 m", lectures: [] },
            { id: 4, title: "Frontend Project", lectureCount: 4, duration: "45 m", lectures: [] },
            { id: 5, title: "Backend Project", lectureCount: 4, duration: "45 m", lectures: [] },
            { id: 6, title: "Payment Integration", lectureCount: 4, duration: "45 m", lectures: [] },
            { id: 7, title: "Project Deployment", lectureCount: 4, duration: "45 m", lectures: [] },
        ]
    }
};

// --- Icons ---
const StarIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-orange-500">
        <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
    </svg>
);

const PlayIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-gray-400">
        <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm14.024-.983a1.125 1.125 0 010 1.966l-5.603 3.113A1.125 1.125 0 019 15.113V8.887c0-.857.921-1.4 1.671-.983l5.603 3.113z" clipRule="evenodd" />
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

const ChevronDownIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-gray-500">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
    </svg>
);


// --- Components ---

function CourseDetailsPage() {
    const { courseId } = useParams();
    // In a real app, fetch data based on courseId
    const course = COURSE_DATA;

    return (
        <div className="min-h-screen bg-gray-50 pb-12">
            <div className="container mx-auto px-4 py-8">

                {/* Main Grid Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

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
                                <div className="flex items-center gap-1">
                                    <span className="font-bold text-orange-500 flex items-center gap-0.5">
                                        {course.rating} <StarIcon />
                                    </span>
                                    <span className="text-blue-600 underline cursor-pointer">
                                        ({course.ratingCount} ratings)
                                    </span>
                                </div>
                                <div className="text-gray-600">
                                    {course.studentCount} students
                                </div>
                            </div>

                            <div className="text-sm text-gray-700">
                                Course by <a href="#" className="text-blue-600 underline font-medium">{course.instructor}</a>
                            </div>
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
                            <div className="space-y-4 text-gray-700 leading-relaxed">
                                {course.description.map((video, idx) => (
                                    <p key={idx}>{video}</p>
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
                                    {/* Discount Badge */}
                                    <div className="mb-4">
                                        <span className="inline-block text-orange-600 font-medium text-sm animate-pulse">
                                            🔥 {course.daysLeft} days left at this price!
                                        </span>
                                    </div>

                                    {/* Price */}
                                    <div className="flex items-center gap-3 mb-6">
                                        <span className="text-3xl font-bold text-gray-900">${course.price}</span>
                                        <span className="text-lg text-gray-400 line-through">${course.oldPrice}</span>
                                        <span className="text-lg font-medium text-orange-600">{course.discount}% off</span>
                                    </div>

                                    {/* Stats Summary */}
                                    <div className="flex items-center justify-between text-sm text-gray-500 mb-6">
                                        <div className="flex items-center gap-1.5">
                                            <StarIcon />
                                            <span>{course.rating}</span>
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

                                    {/* Button */}
                                    <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-4 rounded-xl transition-all shadow-md hover:shadow-lg active:scale-95 mb-6">
                                        Enroll Now
                                    </button>

                                    {/* What's Included */}
                                    <div>
                                        <h3 className="font-semibold text-gray-900 mb-3">What's in the course?</h3>
                                        <ul className="space-y-2.5">
                                            {course.whatYouWillLearn.map((item, idx) => (
                                                <li key={idx} className="flex items-start gap-2.5 text-sm text-gray-600">
                                                    <span className="text-green-500 mt-0.5">•</span>
                                                    <span>{item}</span>
                                                </li>
                                            ))}
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
