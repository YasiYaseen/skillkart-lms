import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';

export interface ActiveStudent {
    id?: string;
    name: string;
    email: string;
    totalCompletedLessons: number;
    averageProgressPercentage: number;
}

interface InstructorCourseItem {
    _id: string;
    title: string;
    status: string;
}

function Dashboard() {
    const [stats, setStats] = useState({ enrollments: 0, earnings: 0, active: 0, draft: 0 });
    const [recent, setRecent] = useState<ActiveStudent[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                const [analyticsRes, coursesRes] = await Promise.all([
                    api.get('/instructor/analytics'),
                    api.get<{ courses: InstructorCourseItem[] }>('/courses?mine=true')
                ]);

                const summary = analyticsRes.data?.summary || {};
                const courses: InstructorCourseItem[] = coursesRes.data?.courses || [];

                let tAct = 0, tDft = 0;
                courses.forEach((c: InstructorCourseItem) => {
                    if (c.status === 'published') tAct++;
                    else tDft++;
                });

                const activeStudents = analyticsRes.data?.mostActiveStudents || [];
                setRecent(activeStudents.slice(0, 5));

                setStats({
                    enrollments: summary.totalEnrollments || 0,
                    earnings: summary.totalEarnings || 0,
                    active: tAct,
                    draft: tDft,
                });
            } catch {
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
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                    <p className="text-sm text-gray-500 mt-1">Overview of your courses and students</p>
                </div>
                <div className="flex gap-3">
                    <Link
                        to="/instructor/analytics"
                        className="px-4 py-2 bg-blue-50 text-blue-600 font-medium text-sm rounded-lg hover:bg-blue-100 transition-colors"
                    >
                        View Full Analytics →
                    </Link>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-xs">
                    <p className="text-sm text-gray-500 mb-1">Total Enrollments</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.enrollments}</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-xs">
                    <p className="text-sm text-gray-500 mb-1">Total Earnings</p>
                    <p className="text-3xl font-bold text-gray-900">${stats.earnings.toFixed(2)}</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-xs">
                    <p className="text-sm text-gray-500 mb-1">Active Courses</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.active}</p>
                    <p className="text-xs text-gray-400 mt-2">{stats.draft} in draft</p>
                </div>
            </div>

            {/* Most Active Students */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-xs">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-gray-900">Most Active Students</h2>
                    <Link to="/instructor/students" className="text-xs text-blue-600 hover:underline font-medium">
                        View all students →
                    </Link>
                </div>
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-gray-100 bg-gray-50/50">
                            <th className="text-left py-3 px-6 text-gray-500 font-medium">#</th>
                            <th className="text-left py-3 px-6 text-gray-500 font-medium">Student name</th>
                            <th className="text-left py-3 px-6 text-gray-500 font-medium">Lessons Done</th>
                            <th className="text-left py-3 px-6 text-gray-500 font-medium">Average Progress</th>
                        </tr>
                    </thead>
                    <tbody>
                        {recent.map((row, i) => (
                            <tr key={row.id || i} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                <td className="py-4 px-6 text-gray-400">{i + 1}</td>
                                <td className="py-4 px-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs uppercase">
                                            {row.name.substring(0, 2)}
                                        </div>
                                        <div>
                                            <span className="text-gray-800 font-medium block">{row.name}</span>
                                            <span className="text-gray-400 text-xs">{row.email}</span>
                                        </div>
                                    </div>
                                </td>
                                <td className="py-4 px-6 text-gray-700 font-medium">{row.totalCompletedLessons}</td>
                                <td className="py-4 px-6">
                                    <div className="flex items-center gap-2">
                                        <div className="w-24 bg-gray-200 rounded-full h-2">
                                            <div
                                                className="bg-blue-600 h-2 rounded-full"
                                                style={{ width: `${Math.min(100, row.averageProgressPercentage || 0)}%` }}
                                            ></div>
                                        </div>
                                        <span className="text-xs text-gray-500 font-medium">
                                            {row.averageProgressPercentage}%
                                        </span>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {recent.length === 0 && (
                            <tr>
                                <td colSpan={4} className="py-10 text-center text-gray-500">
                                    No active students yet.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default Dashboard;
