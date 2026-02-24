// Instructor - Students Enrolled Page (static UI)

const MOCK_STUDENTS = [
    { id: 1, name: 'Richard Gartton', course: 'Build Text to Image SaaS App in React JS', date: '22 Aug 2024', avatar: 'https://randomuser.me/api/portraits/men/32.jpg' },
    { id: 2, name: 'Evelynn Murphy', course: 'Build AI BG Removal SaaS App in React JS', date: '22 Aug 2024', avatar: 'https://randomuser.me/api/portraits/women/44.jpg' },
    { id: 3, name: 'Alison Powell', course: 'React Router Complete Course in One Video', date: '23 Sep 2024', avatar: 'https://randomuser.me/api/portraits/women/65.jpg' },
    { id: 4, name: 'Richard Gartton', course: 'Build Full Stack E-Commerce App in React JS', date: '10 Oct 2024', avatar: 'https://randomuser.me/api/portraits/men/32.jpg' },
    { id: 5, name: 'Evelynn Murphy', course: 'Build AI BG Removal SaaS App in React JS', date: '22 Aug 2024', avatar: 'https://randomuser.me/api/portraits/women/44.jpg' },
    { id: 6, name: 'Alison Powell', course: 'React Router Complete Course in One Video', date: '23 Sep 2024', avatar: 'https://randomuser.me/api/portraits/women/65.jpg' },
    { id: 7, name: 'Richard Gartton', course: 'Build Full Stack E-Commerce App in React JS', date: '10 Oct 2024', avatar: 'https://randomuser.me/api/portraits/men/45.jpg' },
];

function StudentsEnrolled() {
    return (
        <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-8">Students Enrolled</h1>

            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-gray-100">
                            <th className="text-left py-4 px-6 text-gray-500 font-medium">#</th>
                            <th className="text-left py-4 px-6 text-gray-500 font-medium">Student name</th>
                            <th className="text-left py-4 px-6 text-gray-500 font-medium">Course Title</th>
                            <th className="text-left py-4 px-6 text-gray-500 font-medium">Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        {MOCK_STUDENTS.map((student) => (
                            <tr key={student.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                <td className="py-4 px-6 text-gray-400">{student.id}</td>
                                <td className="py-4 px-6">
                                    <div className="flex items-center gap-3">
                                        <img
                                            src={student.avatar}
                                            alt={student.name}
                                            className="w-8 h-8 rounded-full object-cover"
                                        />
                                        <span className="text-gray-800">{student.name}</span>
                                    </div>
                                </td>
                                <td className="py-4 px-6 text-gray-600">{student.course}</td>
                                <td className="py-4 px-6 text-gray-400">{student.date}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default StudentsEnrolled;
