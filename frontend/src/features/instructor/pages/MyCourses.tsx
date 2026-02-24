// Instructor - My Courses Page (static UI)

const MOCK_COURSES = [
    {
        id: 1,
        title: 'Build Text to Image SaaS App in React JS',
        thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=100&h=60&fit=crop',
        earnings: '$100',
        students: 25,
        isLive: true,
    },
    {
        id: 2,
        title: 'Build Text to Image SaaS App in React JS',
        thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=100&h=60&fit=crop',
        earnings: '$1100',
        students: 28,
        isLive: false,
    },
    {
        id: 3,
        title: 'Build Text to Image SaaS App in React JS',
        thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=100&h=60&fit=crop',
        earnings: '$510',
        students: 22,
        isLive: true,
    },
    {
        id: 4,
        title: 'Build AI BG Removal SaaS App in React JS',
        thumbnail: 'https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?w=100&h=60&fit=crop',
        earnings: '$1,200',
        students: 8,
        isLive: true,
    },
    {
        id: 5,
        title: 'Build Text to Image SaaS App in React JS',
        thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=100&h=60&fit=crop',
        earnings: '$350',
        students: 14,
        isLive: true,
    },
];

function MyCourses() {
    return (
        <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-8">My Courses</h1>

            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-gray-100">
                            <th className="text-left py-4 px-6 text-gray-500 font-medium">All Courses</th>
                            <th className="text-left py-4 px-6 text-gray-500 font-medium">Earnings</th>
                            <th className="text-left py-4 px-6 text-gray-500 font-medium">Students</th>
                            <th className="text-left py-4 px-6 text-gray-500 font-medium">Course Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {MOCK_COURSES.map((course) => (
                            <tr key={course.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                <td className="py-4 px-6">
                                    <div className="flex items-center gap-4">
                                        <img
                                            src={course.thumbnail}
                                            alt={course.title}
                                            className="w-16 h-10 rounded object-cover flex-shrink-0"
                                        />
                                        <span className="text-gray-800 font-medium">{course.title}</span>
                                    </div>
                                </td>
                                <td className="py-4 px-6 text-gray-600">{course.earnings}</td>
                                <td className="py-4 px-6 text-gray-600">{course.students}</td>
                                <td className="py-4 px-6">
                                    <div className="flex items-center gap-2">
                                        {/* Toggle */}
                                        <button
                                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${course.isLive ? 'bg-blue-600' : 'bg-gray-300'
                                                }`}
                                        >
                                            <span
                                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${course.isLive ? 'translate-x-6' : 'translate-x-1'
                                                    }`}
                                            />
                                        </button>
                                        <span className={`text-sm ${course.isLive ? 'text-blue-600' : 'text-gray-400'}`}>
                                            {course.isLive ? 'Live' : 'Private'}
                                        </span>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default MyCourses;
