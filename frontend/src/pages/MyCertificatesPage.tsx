import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';

export interface StudentCertificate {
    _id: string;
    certificateId: string;
    course?: {
        _id?: string;
        title?: string;
        thumbnailUrl?: string;
        instructor?: {
            name?: string;
        };
    };
    issuedAt: string;
}

function MyCertificatesPage() {
    const [certificates, setCertificates] = useState<StudentCertificate[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get<{ certificates: StudentCertificate[] }>('/certificates/me')
            .then(res => setCertificates(res.data.certificates || []))
            .catch(() => toast.error('Failed to load certificates'))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return (
        <div className="text-center py-20 text-gray-500 dark:text-gray-400">Loading your certificates...</div>
    );

    return (
        <div className="container py-10">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">My Certificates</h1>
            <p className="text-gray-500 dark:text-gray-400 mb-8">Certificates are earned by completing all lessons in a course.</p>

            {certificates.length === 0 ? (
                <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-2xl shadow-xs border border-gray-100 dark:border-gray-800">
                    <div className="text-6xl mb-4">🎓</div>
                    <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-2">No certificates yet</h2>
                    <p className="text-gray-500 dark:text-gray-400 mb-6">Complete a course to earn your first certificate!</p>
                    <Link to="/courses" className="inline-block bg-blue-600 text-white font-semibold px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors shadow-xs">
                        Browse Courses
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {certificates.map(cert => (
                        <div key={cert._id} className="bg-white dark:bg-gray-900 rounded-2xl shadow-xs border border-gray-200 dark:border-gray-800 overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group">
                            {/* Top brand blue bar */}
                            <div className="h-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500" />

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
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shrink-0">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Completed</span>
                                </div>

                                <h3 className="font-bold text-gray-900 dark:text-white mb-1 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                    {cert.course?.title || 'Course'}
                                </h3>
                                {cert.course?.instructor?.name && (
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">by {cert.course.instructor.name}</p>
                                )}

                                <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between gap-2">
                                    <div>
                                        <p className="text-xs text-gray-400 dark:text-gray-500">Issued On</p>
                                        <p className="text-xs font-semibold text-gray-700 dark:text-gray-200">
                                            {new Date(cert.issuedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                                        </p>
                                    </div>
                                    <Link
                                        to={`/certificates/verify/${cert.certificateId}`}
                                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-xs font-semibold transition-all shadow-2xs"
                                    >
                                        <span>View & Download PDF</span>
                                        <span>🎓</span>
                                    </Link>
                                </div>

                                <p className="text-[10px] font-mono text-gray-400 dark:text-gray-500 mt-2 truncate">ID: {cert.certificateId}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default MyCertificatesPage;
