import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { toast } from 'react-toastify';

function StudentsEnrolled() {
    const [students, setStudents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStudents = async () => {
            try {
                // 1. Get instructor's courses
                const coursesRes = await api.get('/courses?mine=true');
                const courses = coursesRes.data.courses;

                if (courses.length === 0) {
                    setStudents([]);
                    setLoading(false);
                    return;
                }

                // 2. For each course, fetch students
                const studentsPromises = courses.map((c: any) =>
                    api.get(`/courses/${c._id}/students`).then(res => {
                        return res.data.data.map((enrollment: any) => ({
                            id: enrollment._id,
                            name: enrollment.student?.name || 'Unknown Student',
                            course: c.title,
                            date: new Date(enrollment.enrolledAt).toLocaleDateString(),
                            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(enrollment.student?.name || 'User')}&background=random`
                        }));
                    }).catch(() => [])
                );

                const results = await Promise.all(studentsPromises);
                const allStudents = results.flat();

                setStudents(allStudents);
            } catch (err: any) {
                toast.error('Failed to load students list');
            } finally {
                setLoading(false);
            }
        };

        fetchStudents();
    }, []);

    if (loading) {
        return <div className="text-gray-500 py-10">Loading students...</div>;
    }

    return (
        <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-8">Students Enrolled</h1>

            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-gray-100 bg-gray-50">
                            <th className="text-left py-4 px-6 text-gray-500 font-medium">Student name</th>
                            <th className="text-left py-4 px-6 text-gray-500 font-medium">Course Title</th>
                            <th className="text-left py-4 px-6 text-gray-500 font-medium">Enrolled Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        {students.length === 0 && (
                            <tr>
                                <td colSpan={3} className="py-10 text-center text-gray-500">
                                    No students enrolled yet.
                                </td>
                            </tr>
                        )}
                        {students.map((student) => (
                            <tr key={student.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                <td className="py-4 px-6">
                                    <div className="flex items-center gap-3">
                                        <img
                                            src={student.avatar}
                                            alt={student.name}
                                            className="w-8 h-8 rounded-full object-cover"
                                        />
                                        <span className="text-gray-800 font-medium">{student.name}</span>
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
