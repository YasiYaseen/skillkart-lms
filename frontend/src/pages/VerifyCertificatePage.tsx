import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '@/lib/api';
import {
    CheckBadgeIcon,
    ExclamationCircleIcon,
    ArrowDownTrayIcon,
    ClipboardDocumentIcon,
    ArrowLeftIcon,
} from '@heroicons/react/20/solid';

interface CertificateData {
    certificateId: string;
    student: {
        _id: string;
        name: string;
        email: string;
    };
    course: {
        _id: string;
        title: string;
        instructor?: {
            name: string;
        };
    };
    issuedAt: string;
}

function VerifyCertificatePage() {
    const { certificateId } = useParams();
    const [cert, setCert] = useState<CertificateData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        if (!certificateId) return;
        api.get(`/certificates/verify/${certificateId}`)
            .then((res) => {
                setCert(res.data.certificate);
            })
            .catch(() => {
                setError(true);
            })
            .finally(() => setLoading(false));
    }, [certificateId]);

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 text-xs">
            Verifying credential authenticity...
        </div>
    );

    if (error || !cert) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-6 text-center">
            <div className="w-14 h-14 bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 rounded-full flex items-center justify-center mx-auto mb-4">
                <ExclamationCircleIcon className="w-8 h-8" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Certificate Not Found</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 max-w-sm">
                No verified educational certificate matches credential identifier{' '}
                <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-xs text-slate-800 dark:text-slate-200 font-mono">
                    {certificateId}
                </code>
            </p>
            <Link to="/" className="inline-flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 hover:underline font-semibold">
                <ArrowLeftIcon className="w-3.5 h-3.5" />
                <span>Return to Home</span>
            </Link>
        </div>
    );

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-6 transition-colors">
            <div className="w-full max-w-2xl">
                {/* Certificate Card */}
                <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                    <div className="p-8 sm:p-10 text-center">
                        {/* Seal */}
                        <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-200 dark:border-blue-800">
                            <CheckBadgeIcon className="w-9 h-9" />
                        </div>

                        <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-1.5">
                            Certificate of Completion
                        </p>
                        <p className="text-slate-500 dark:text-slate-400 text-xs mb-5">This is to certify that</p>

                        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">
                            {cert.student?.name || 'Student'}
                        </h1>
                        <p className="text-slate-400 dark:text-slate-500 text-xs mb-6">has successfully completed the curriculum</p>

                        <div className="bg-slate-50 dark:bg-slate-850 rounded-xl p-5 mb-6 border border-slate-200 dark:border-slate-800">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                                {cert.course?.title || 'Course'}
                            </h2>
                            {cert.course?.instructor?.name && (
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
                                    Instructed by <span className="font-semibold text-slate-700 dark:text-slate-300">{cert.course.instructor.name}</span>
                                </p>
                            )}
                        </div>

                        <div className="flex items-center justify-center gap-8 text-xs text-slate-500 dark:text-slate-400 mb-8">
                            <div className="text-center">
                                <p className="text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-0.5 font-semibold">Issued On</p>
                                <p className="font-semibold text-slate-700 dark:text-slate-200">
                                    {new Date(cert.issuedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                                </p>
                            </div>
                            <div className="w-px h-8 bg-slate-200 dark:bg-slate-800" />
                            <div className="text-center">
                                <p className="text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-0.5 font-semibold">Certificate ID</p>
                                <p className="font-mono font-semibold text-slate-700 dark:text-slate-200 text-xs">{cert.certificateId}</p>
                            </div>
                        </div>

                        {/* Verified badge & Actions */}
                        <div className="flex flex-wrap items-center justify-center gap-2.5">
                            <div className="inline-flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 rounded-lg px-3 py-1.5 text-xs font-semibold">
                                <CheckBadgeIcon className="w-4 h-4" />
                                <span>Verified Credential</span>
                            </div>

                            <button
                                type="button"
                                onClick={() => window.print()}
                                className="print:hidden inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg px-3.5 py-1.5 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                            >
                                <ArrowDownTrayIcon className="w-3.5 h-3.5" />
                                <span>Download / Print PDF</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    navigator.clipboard.writeText(window.location.href);
                                    alert('Certificate verification link copied to clipboard!');
                                }}
                                className="print:hidden inline-flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors border border-slate-200 dark:border-slate-700 cursor-pointer"
                            >
                                <ClipboardDocumentIcon className="w-3.5 h-3.5 text-slate-500" />
                                <span>Copy Link</span>
                            </button>

                            <a
                                href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="print:hidden inline-flex items-center gap-1.5 bg-[#0077b5] hover:bg-[#006097] text-white rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors"
                            >
                                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                                </svg>
                                <span>Share on LinkedIn</span>
                            </a>
                        </div>
                    </div>
                </div>

                <p className="text-center text-[11px] text-slate-400 dark:text-slate-500 mt-4 print:hidden">
                    Issued by <span className="font-semibold text-slate-600 dark:text-slate-400">SkillKart</span> · <Link to="/" className="hover:underline text-blue-600 dark:text-blue-400">skillkart.app</Link>
                </p>
            </div>
        </div>
    );
}

export default VerifyCertificatePage;
