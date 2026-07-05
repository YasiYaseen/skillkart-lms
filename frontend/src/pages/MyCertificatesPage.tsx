import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/features/auth/AuthContext';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';

function MyCertificatesPage() {
    const { user } = useAuth();
    const [certificates, setCertificates] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/certificates/me')
            .then(res => setCertificates(res.data.certificates || []))
            .catch(() => toast.error('Failed to load certificates'))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return (
        <div className="text-center py-20 text-gray-500">Loading your certificates...</div>
    );

    return (
        <div className="container py-10">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">My Certificates</h1>
            <p className="text-gray-500 mb-8">Certificates are earned by completing all lessons in a course.</p>

            {certificates.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl shadow-sm border border-gray-100">
                    <div className="text-6xl mb-4">🎓</div>
                    <h2 className="text-xl font-semibold text-gray-700 mb-2">No certificates yet</h2>
                    <p className="text-gray-500 mb-6">Complete a course to earn your first certificate!</p>
                    <Link to="/courses" className="inline-block bg-indigo-600 text-white font-semibold px-6 py-3 rounded-xl hover:bg-indigo-700 transition-colors">
                        Browse Courses
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {certificates.map(cert => (
                        <div key={cert._id} className="bg-white rounded-2xl shadow-sm border border-indigo-100 overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group">
                            {/* Top gradient bar */}
                            <div className="h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

                            <div className="p-6">
                                {/* Course thumbnail */}
                                {cert.course?.thumbnailUrl && (
                                    <img
                                        src={cert.course.thumbnailUrl}
                                        alt={cert.course.title}
                                        className="w-full h-32 object-cover rounded-xl mb-4 opacity-90"
                                    />
                                )}

                                {/* Badge */}
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">Completed</span>
                                </div>

                                <h3 className="font-bold text-gray-900 mb-1 line-clamp-2 group-hover:text-indigo-700 transition-colors">
                                    {cert.course?.title || 'Course'}
                                </h3>
                                {cert.course?.instructor?.name && (
                                    <p className="text-sm text-gray-500 mb-4">by {cert.course.instructor.name}</p>
                                )}

                                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                                    <div>
                                        <p className="text-xs text-gray-400">Issued</p>
                                        <p className="text-sm font-medium text-gray-700">
                                            {new Date(cert.issuedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                                        </p>
                                    </div>
                                    <Link
                                        to={`/certificates/verify/${cert.certificateId}`}
                                        className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 hover:underline"
                                    >
                                        View ↗
                                    </Link>
                                </div>

                                <p className="text-xs font-mono text-gray-300 mt-2">{cert.certificateId}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default MyCertificatesPage;
