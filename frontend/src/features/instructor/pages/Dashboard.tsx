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

    if (loading) {
        return (
            <div className="space-y-8 animate-pulse">
                <div className="flex justify-between items-center">
                    <div className="space-y-2">
                        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-lg w-48" />
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-64" />
                    </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 h-32" />
                    ))}
                </div>
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 h-64" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Instructor Dashboard</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Overview of your courses, earnings, and students</p>
                </div>
                <div className="flex items-center gap-3">
                    <Link
                        to="/instructor/create-course"
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                    >
                        <span>+</span>
                        <span>New Course</span>
                    </Link>
                    <Link
                        to="/instructor/analytics"
                        className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-medium text-sm rounded-xl transition-colors border border-indigo-100 dark:border-indigo-800/60"
                    >
                        View Analytics →
                    </Link>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-xs hover:border-indigo-200 dark:hover:border-indigo-800 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Enrollments</p>
                        <span className="p-2 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-sm">👥</span>
                    </div>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.enrollments}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">All time student enrollments</p>
                </div>

                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-xs hover:border-emerald-200 dark:hover:border-emerald-800 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Earnings</p>
                        <span className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-sm">💰</span>
                    </div>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">${stats.earnings.toFixed(2)}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">Net course sales revenue</p>
                </div>

                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-xs hover:border-indigo-200 dark:hover:border-indigo-800 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Active Courses</p>
                        <span className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-sm">📚</span>
                    </div>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.active}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">{stats.draft} in draft status</p>
                </div>
            </div>

            {/* Most Active Students */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden shadow-xs">
                <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Most Active Students</h2>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Top learners progressing through your courses</p>
                    </div>
                    <Link to="/instructor/students" className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-semibold flex items-center gap-1">
                        <span>View all students</span>
                        <span>→</span>
                    </Link>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50/75 dark:bg-gray-900/50">
                                <th className="text-left py-3 px-6 text-gray-500 dark:text-gray-400 font-semibold">#</th>
                                <th className="text-left py-3 px-6 text-gray-500 dark:text-gray-400 font-semibold">Student</th>
                                <th className="text-left py-3 px-6 text-gray-500 dark:text-gray-400 font-semibold">Lessons Done</th>
                                <th className="text-left py-3 px-6 text-gray-500 dark:text-gray-400 font-semibold">Average Progress</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700/60 bg-white dark:bg-gray-800">
                            {recent.map((row, i) => (
                                <tr key={row.id || i} className="hover:bg-gray-50/60 dark:hover:bg-gray-700/30 transition-colors">
                                    <td className="py-4 px-6 text-gray-400 dark:text-gray-500 font-mono text-xs">{i + 1}</td>
                                    <td className="py-4 px-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs uppercase border border-indigo-200 dark:border-indigo-800/50">
                                                {row.name.substring(0, 2)}
                                            </div>
                                            <div>
                                                <span className="text-gray-900 dark:text-white font-medium block">{row.name}</span>
                                                <span className="text-gray-400 dark:text-gray-500 text-xs">{row.email}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-4 px-6 text-gray-700 dark:text-gray-300 font-semibold">{row.totalCompletedLessons}</td>
                                    <td className="py-4 px-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-28 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                                <div
                                                    className={`h-2 rounded-full transition-all ${row.averageProgressPercentage === 100 ? 'bg-emerald-500' : 'bg-indigo-600'}`}
                                                    style={{ width: `${Math.min(100, row.averageProgressPercentage || 0)}%` }}
                                                />
                                            </div>
                                            <span className="text-xs text-gray-700 dark:text-gray-300 font-semibold">
                                                {row.averageProgressPercentage}%
                                            </span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {recent.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="py-12 text-center text-gray-500 dark:text-gray-400">
                                        No active students yet.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default Dashboard;
