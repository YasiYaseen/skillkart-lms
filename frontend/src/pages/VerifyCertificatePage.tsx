import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '@/lib/api';

export interface VerifiedCertificate {
    certificateId: string;
    student?: {
        name?: string;
    };
    course?: {
        title?: string;
        instructor?: {
            name?: string;
        };
    };
    issuedAt: string;
}

function VerifyCertificatePage() {
    const { certificateId } = useParams<{ certificateId: string }>();
    const [cert, setCert] = useState<VerifiedCertificate | null>(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        api.get<{ certificate: VerifiedCertificate }>(`/certificates/verify/${certificateId}`)
            .then(res => setCert(res.data.certificate))
            .catch(() => setNotFound(true))
            .finally(() => setLoading(false));
    }, [certificateId]);

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
            <div className="text-gray-500 dark:text-gray-400">Verifying certificate...</div>
        </div>
    );

    if (notFound || !cert) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-950 p-8">
            <div className="text-6xl mb-4">❌</div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Certificate Not Found</h1>
            <p className="text-gray-500 dark:text-gray-400 mb-6">No certificate matches ID <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-sm text-gray-800 dark:text-gray-200">{certificateId}</code></p>
            <Link to="/" className="text-blue-600 dark:text-blue-400 hover:underline">← Back to Home</Link>
        </div>
    );

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50/50 via-slate-50 to-indigo-50/50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 p-6 transition-colors">
            <div className="w-full max-w-2xl">
                {/* Certificate Card */}
                <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border-4 border-blue-100 dark:border-gray-800 overflow-hidden">
                    {/* Top band */}
                    <div className="h-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500" />

                    <div className="p-10 text-center">
                        {/* Seal */}
                        <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-lg">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-white" viewBox="0 0 24 24" fill="currentColor">
                                <path fillRule="evenodd" d="M8.603 3.799A4.49 4.49 0 0112 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 013.498 1.307 4.491 4.491 0 011.307 3.497A4.49 4.49 0 0121.75 12a4.49 4.49 0 01-1.549 3.397 4.491 4.491 0 01-1.307 3.497 4.491 4.491 0 01-3.497 1.307A4.49 4.49 0 0112 21.75a4.49 4.49 0 01-3.397-1.549 4.49 4.49 0 01-3.498-1.306 4.491 4.491 0 01-1.307-3.498A4.49 4.49 0 012.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 011.307-3.497 4.49 4.49 0 013.497-1.307zm7.007 6.387a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
                            </svg>
                        </div>

                        <p className="text-sm font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-2">Certificate of Completion</p>
                        <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">This is to certify that</p>

                        <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-2">
                            {cert.student?.name || 'Student'}
                        </h1>
                        <p className="text-gray-400 dark:text-gray-500 text-sm mb-8">has successfully completed the course</p>

                        <div className="bg-gradient-to-r from-blue-50/70 to-indigo-50/70 dark:from-blue-950/40 dark:to-slate-900 rounded-2xl p-6 mb-8 border border-blue-100 dark:border-gray-800">
                            <h2 className="text-2xl font-bold text-blue-900 dark:text-blue-300">
                                {cert.course?.title || 'Course'}
                            </h2>
                            {cert.course?.instructor?.name && (
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                                    Instructed by <span className="font-semibold text-gray-700 dark:text-gray-200">{cert.course.instructor.name}</span>
                                </p>
                            )}
                        </div>

                        <div className="flex items-center justify-center gap-8 text-sm text-gray-500 dark:text-gray-400 mb-8">
                            <div className="text-center">
                                <p className="text-xs uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1">Issued On</p>
                                <p className="font-semibold text-gray-700 dark:text-gray-200">
                                    {new Date(cert.issuedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                                </p>
                            </div>
                            <div className="w-px h-10 bg-gray-200 dark:bg-gray-800" />
                            <div className="text-center">
                                <p className="text-xs uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1">Certificate ID</p>
                                <p className="font-mono font-semibold text-gray-700 dark:text-gray-200 text-xs">{cert.certificateId}</p>
                            </div>
                        </div>

                        {/* Verified badge & Actions */}
                        <div className="flex flex-wrap items-center justify-center gap-3">
                            <div className="inline-flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-full px-4 py-1.5 text-sm font-semibold">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                Verified Certificate
                            </div>

                            <button
                                type="button"
                                onClick={() => window.print()}
                                className="print:hidden inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full px-5 py-1.5 text-sm font-semibold shadow-xs transition-all"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                                Download / Print PDF
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    navigator.clipboard.writeText(window.location.href);
                                    alert('Certificate verification link copied to clipboard!');
                                }}
                                className="print:hidden inline-flex items-center gap-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-full px-4 py-1.5 text-sm font-semibold transition-all border border-gray-200 dark:border-gray-700"
                            >
                                <span>📋</span>
                                <span>Copy Link</span>
                            </button>

                            <a
                                href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="print:hidden inline-flex items-center gap-1.5 bg-[#0077b5] hover:bg-[#006097] text-white rounded-full px-4 py-1.5 text-sm font-semibold transition-all"
                            >
                                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                                </svg>
                                <span>Share on LinkedIn</span>
                            </a>
                        </div>
                    </div>

                    {/* Bottom band */}
                    <div className="h-3 bg-gradient-to-r from-blue-500 via-indigo-600 to-blue-600" />
                </div>

                <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-4 print:hidden">
                    Issued by <span className="font-semibold text-gray-600 dark:text-gray-400">SkillKart</span> · <Link to="/" className="hover:underline text-blue-600 dark:text-blue-400">skillkart.app</Link>
                </p>
            </div>
        </div>
    );
}

export default VerifyCertificatePage;
