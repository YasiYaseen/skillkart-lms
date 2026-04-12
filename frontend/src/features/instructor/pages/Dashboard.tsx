import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { toast } from 'react-toastify';

function Dashboard() {
    const [stats, setStats] = useState({ enrollments: 0, earnings: 0, active: 0, draft: 0 });
    const [recent, setRecent] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                const res = await api.get('/courses?mine=true');
                const courses = res.data.courses;
                let tEnr = 0, tEarn = 0, tAct = 0, tDft = 0;
                let allEnrollments: any[] = [];

                const enrollmentPromises = courses.map((c: any) =>
                    api.get(`/courses/${c._id}/enrollments`)
                );

                const enrollmentResults = await Promise.all(enrollmentPromises);

                enrollmentResults.forEach((res, idx) => {
                    const enrollments = res.data.enrollments;
                    const course = courses[idx];

                    if (course.status === 'published') tAct++;
                    else tDft++;

                    tEnr += enrollments.length;
                    tEarn += enrollments.length * (course.price || 0);

                    enrollments.forEach((e: any) => {
                        allEnrollments.push({
                            name: e.student.name,
                            course: course.title,
                            date: new Date(e.createdAt).toLocaleDateString()
                        });
                    });
                });

                allEnrollments.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                setRecent(allEnrollments.slice(0, 5));
                setStats({ enrollments: tEnr, earnings: tEarn, active: tAct, draft: tDft });
            } catch (err) {
                toast.error('Failed to load dashboard data');
            } finally {
                setLoading(false);
            }
        };
        fetchDashboard();
    }, []);

    if (loading) return <div className="py-10 text-gray-500">Loading dashboard...</div>;

    return (
        <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-8">Dashboard</h1>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                    <p className="text-sm text-gray-500 mb-1">Total Enrollments</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.enrollments}</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                    <p className="text-sm text-gray-500 mb-1">Total Earnings</p>
                    <p className="text-3xl font-bold text-gray-900">${stats.earnings.toFixed(2)}</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                    <p className="text-sm text-gray-500 mb-1">Active Courses</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.active}</p>
                    <p className="text-xs text-gray-400 mt-2">{stats.draft} in draft</p>
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
                        {recent.map((row, i) => (
                            <tr key={i} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                <td className="py-4 px-6 text-gray-400">{i + 1}</td>
                                <td className="py-4 px-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs uppercase">
                                            {row.name.substring(0,2)}
                                        </div>
                                        <span className="text-gray-800">{row.name}</span>
                                    </div>
                                </td>
                                <td className="py-4 px-6 text-gray-600">{row.course}</td>
                                <td className="py-4 px-6 text-gray-400">{row.date}</td>
                            </tr>
                        ))}
                        {recent.length === 0 && (
                            <tr>
                                <td colSpan={4} className="py-10 text-center text-gray-500">No recent enrollments.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default Dashboard;
