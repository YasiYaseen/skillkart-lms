import CourseStructure from '@/components/course/CourseStructure';
import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { toast } from 'react-toastify';
import { useAuth } from '@/features/auth/AuthContext';

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
    const [course, setCourse] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [enrolling, setEnrolling] = useState(false);

    useEffect(() => {
        api.get(`/courses/${courseId}`)
            .then(res => {
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
                    subtitle: c.level === 'beginner' ? 'Beginner friendly starting point.' : 'Advanced level material.',
                    instructor: c.instructor?.name || 'Unknown Instructor',
                    rating: null,
                    ratingCount: null,
                    studentCount: null,
                    thumbnail: c.thumbnailUrl || 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&h=600&fit=crop',
                    price: c.price || 0,
                    oldPrice: c.price ? (c.price * 1.5).toFixed(2) : 0,
                    totalHours: Math.round((c.durationMinutes || 0) / 60),
                    totalLessons: c.lessons.length,
                    lastUpdated: c.updatedAt ? new Date(c.updatedAt).toLocaleDateString() : '',
                    description: c.description ? [c.description] : [],
                    whatYouWillLearn: ['Lifetime access with updates', 'Hands-on project guidance', 'Detailed instruction'],
                    structure: {
                        totalSections: c.sections.length,
                        totalLectures: c.lessons.length,
                        totalDuration: (c.durationMinutes || 0) + "m",
                        sections: mappedSections
                    }
                });
            })
            .catch(err => {
                toast.error(err.response?.data?.message || 'Failed to fetch course details');
            })
            .finally(() => {
                setLoading(false);
            });
    }, [courseId]);

    const handleEnroll = async () => {
        if (!user) {
            toast.info('Please log in to enroll');
            return;
        }
        setEnrolling(true);
        try {
            await api.post(`/courses/${courseId}/enroll`);
            toast.success('Successfully enrolled!');
            navigate(`/learn/${courseId}`);
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Enrollment failed');
        } finally {
            setEnrolling(false);
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
                                {course.rating && (
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
                            <div className="space-y-4 text-gray-700 leading-relaxed whitespace-pre-wrap">
                                {course.description.map((paragraph: string, idx: number) => (
                                    <p key={idx}>{paragraph}</p>
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

                                    {/* Button */}
                                    <button 
                                        onClick={handleEnroll}
                                        disabled={enrolling}
                                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-4 rounded-xl transition-all shadow-md hover:shadow-lg active:scale-95 mb-6 disabled:opacity-50 disabled:cursor-not-allowed">
                                        {enrolling ? 'Enrolling...' : 'Enroll Now'}
                                    </button>

                                    {/* What's Included */}
                                    <div>
                                        <h3 className="font-semibold text-gray-900 mb-3">What's in the course?</h3>
                                        <ul className="space-y-2.5">
                                            {course.whatYouWillLearn.map((item: string, idx: number) => (
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
