// Instructor Dashboard Page (static UI)

function Dashboard() {
    return (
        <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-8">Dashboard</h1>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                    <p className="text-sm text-gray-500 mb-1">Total Enrollments</p>
                    <p className="text-3xl font-bold text-gray-900">124</p>
                    <p className="text-xs text-green-600 mt-2">+12% from last month</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                    <p className="text-sm text-gray-500 mb-1">Total Earnings</p>
                    <p className="text-3xl font-bold text-gray-900">$4,250</p>
                    <p className="text-xs text-green-600 mt-2">+8% from last month</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                    <p className="text-sm text-gray-500 mb-1">Active Courses</p>
                    <p className="text-3xl font-bold text-gray-900">5</p>
                    <p className="text-xs text-gray-400 mt-2">1 in draft</p>
                </div>
            </div>

            {/* Recent Enrollments */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-900">Recent Enrollments</h2>
                </div>
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-gray-100">
                            <th className="text-left py-3 px-6 text-gray-500 font-medium">#</th>
                            <th className="text-left py-3 px-6 text-gray-500 font-medium">Student name</th>
                            <th className="text-left py-3 px-6 text-gray-500 font-medium">Course Title</th>
                            <th className="text-left py-3 px-6 text-gray-500 font-medium">Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        {[
                            { name: 'Richard Gartton', course: 'Build Text to Image SaaS App in React JS', date: '22 Aug 2024' },
                            { name: 'Evelynn Murphy', course: 'Build AI BG Removal SaaS App in React JS', date: '22 Aug 2024' },
                            { name: 'Alison Powell', course: 'React Router Complete Course in One Video', date: '23 Sep 2024' },
                        ].map((row, i) => (
                            <tr key={i} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                <td className="py-4 px-6 text-gray-400">{i + 1}</td>
                                <td className="py-4 px-6">
                                    <div className="flex items-center gap-3">
                                        <img
                                            src={`https://randomuser.me/api/portraits/${i % 2 === 0 ? 'men' : 'women'}/${i + 30}.jpg`}
                                            alt={row.name}
                                            className="w-8 h-8 rounded-full object-cover"
                                        />
                                        <span className="text-gray-800">{row.name}</span>
                                    </div>
                                </td>
                                <td className="py-4 px-6 text-gray-600">{row.course}</td>
                                <td className="py-4 px-6 text-gray-400">{row.date}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default Dashboard;
