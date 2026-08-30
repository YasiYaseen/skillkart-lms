import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { toast } from 'react-toastify';

export function StudentsEnrolled() {
    const [students, setStudents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCourse, setSelectedCourse] = useState('all');

    useEffect(() => {
        const fetchStudents = async () => {
            try {
                const res = await api.get('/instructor/students');
                setStudents(res.data?.students || []);
            } catch {
                toast.error('Failed to load students list');
            } finally {
                setLoading(false);
            }
        };

        fetchStudents();
    }, []);

    const courses = Array.from(new Set(students.map((s) => s.courseTitle).filter(Boolean)));

    const filteredStudents = students.filter((s) => {
        const q = searchQuery.toLowerCase();
        const matchesQuery = s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q) || s.courseTitle.toLowerCase().includes(q);
        const matchesCourse = selectedCourse === 'all' || s.courseTitle === selectedCourse;
        return matchesQuery && matchesCourse;
    });

    if (loading) {
        return <div className="text-gray-500 dark:text-gray-400 py-16 text-center">Loading enrolled students...</div>;
    }

    return (
        <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Students Enrolled</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Track and monitor student progress across all your courses.</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                    <input
                        type="text"
                        placeholder="Search student or course..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="px-3.5 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    {courses.length > 0 && (
                        <select
                            value={selectedCourse}
                            onChange={(e) => setSelectedCourse(e.target.value)}
                            className="px-3.5 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="all">All Courses</option>
                            {courses.map((course) => (
                                <option key={course} value={course}>{course}</option>
                            ))}
                        </select>
                    )}
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50/75 dark:bg-gray-900/50">
                                <th className="text-left py-3.5 px-6 text-gray-600 dark:text-gray-300 font-semibold">Student</th>
                                <th className="text-left py-3.5 px-6 text-gray-600 dark:text-gray-300 font-semibold">Course Title</th>
                                <th className="text-left py-3.5 px-6 text-gray-600 dark:text-gray-300 font-semibold">Progress</th>
                                <th className="text-left py-3.5 px-6 text-gray-600 dark:text-gray-300 font-semibold">Enrolled Date</th>
                                <th className="text-right py-3.5 px-6 text-gray-600 dark:text-gray-300 font-semibold">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700 bg-white dark:bg-gray-800">
                            {filteredStudents.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="py-12 text-center text-gray-500 dark:text-gray-400">
                                        {searchQuery || selectedCourse !== 'all' ? 'No students matching your filter.' : 'No students enrolled yet.'}
                                    </td>
                                </tr>
                            )}
                            {filteredStudents.map((student) => (
                                <tr key={student.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors">
                                    <td className="py-4 px-6">
                                        <div className="flex items-center gap-3">
                                            <img
                                                src={student.avatar}
                                                alt={student.name}
                                                className="w-9 h-9 rounded-full object-cover border border-gray-200 dark:border-gray-700"
                                            />
                                            <div>
                                                <span className="text-gray-900 dark:text-white font-semibold block">{student.name}</span>
                                                <span className="text-gray-400 dark:text-gray-500 text-xs">{student.email}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-4 px-6 text-gray-800 dark:text-gray-200 font-medium">{student.courseTitle}</td>
                                    <td className="py-4 px-6">
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                                <div
                                                    className={`h-2 rounded-full transition-all duration-300 ${
                                                        student.progressPercentage === 100 ? 'bg-emerald-500' : 'bg-indigo-600'
                                                    }`}
                                                    style={{ width: `${student.progressPercentage}%` }}
                                                />
                                            </div>
                                            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                                                {student.progressPercentage}%
                                            </span>
                                        </div>
                                    </td>
                                    <td className="py-4 px-6 text-gray-500 dark:text-gray-400 text-xs">
                                        {new Date(student.enrolledAt).toLocaleDateString()}
                                    </td>
                                    <td className="py-4 px-6 text-right">
                                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                            student.status === 'completed' || student.progressPercentage === 100
                                                ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300'
                                                : 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                                        }`}>
                                            {student.status === 'completed' || student.progressPercentage === 100 ? 'Completed' : 'In Progress'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default StudentsEnrolled;
