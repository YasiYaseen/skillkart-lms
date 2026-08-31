import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import {
    AcademicCapIcon,
    ArrowDownTrayIcon,
    CheckBadgeIcon,
    ArrowRightIcon,
} from '@heroicons/react/20/solid';

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
        <div className="container py-20 text-center text-xs text-slate-500 dark:text-slate-400">Loading your certificates...</div>
    );

    return (
        <div className="container py-10 space-y-6">
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">My Certificates</h1>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">Verified certificates earned by completing courses and passing assessments.</p>
            </div>

            {certificates.length === 0 ? (
                <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-xl shadow-2xs border border-slate-200 dark:border-slate-800 p-8 max-w-md mx-auto space-y-3">
                    <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
                        <AcademicCapIcon className="w-6 h-6" />
                    </div>
                    <h2 className="text-base font-semibold text-slate-900 dark:text-white">No certificates yet</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Complete all lessons and assessments in a course to earn a verified certificate.</p>
                    <div className="pt-2">
                        <Link to="/courses" className="inline-flex items-center gap-1.5 bg-blue-600 text-white text-xs font-medium px-4 py-2 rounded-lg hover:bg-blue-500 transition-colors shadow-2xs">
                            <span>Browse Courses</span>
                            <ArrowRightIcon className="w-3.5 h-3.5" />
                        </Link>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {certificates.map(cert => (
                        <div key={cert._id} className="bg-white dark:bg-slate-900 rounded-xl shadow-2xs border border-slate-200 dark:border-slate-800 overflow-hidden hover:border-slate-300 dark:hover:border-slate-700 transition-all group flex flex-col">
                            {/* Course thumbnail */}
                            {cert.course?.thumbnailUrl ? (
                                <div className="aspect-16/10 bg-slate-100 dark:bg-slate-800 overflow-hidden">
                                    <img
                                        src={cert.course.thumbnailUrl}
                                        alt={cert.course.title}
                                        className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                                    />
                                </div>
                            ) : (
                                <div className="aspect-16/10 bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                                    <AcademicCapIcon className="w-10 h-10" />
                                </div>
                            )}

                            <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                                <div>
                                    <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold mb-2">
                                        <CheckBadgeIcon className="w-4 h-4" />
                                        <span>Verified Completion</span>
                                    </div>

                                    <h3 className="font-semibold text-sm text-slate-900 dark:text-white line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                        {cert.course?.title || 'Course Certificate'}
                                    </h3>
                                    {cert.course?.instructor?.name && (
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Instructor: {cert.course.instructor.name}</p>
                                    )}
                                </div>

                                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                                    <div>
                                        <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider">Issued On</p>
                                        <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
                                            {new Date(cert.issuedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                                        </p>
                                    </div>
                                    <Link
                                        to={`/certificates/verify/${cert.certificateId}`}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 text-blue-600 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-xs font-medium transition-colors shadow-2xs"
                                    >
                                        <ArrowDownTrayIcon className="w-3.5 h-3.5" />
                                        <span>View Certificate</span>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default MyCertificatesPage;
