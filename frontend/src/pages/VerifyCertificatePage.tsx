import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import {
    CheckBadgeIcon,
    ExclamationCircleIcon,
    ExclamationTriangleIcon,
    ArrowDownTrayIcon,
    ClipboardDocumentIcon,
    ArrowLeftIcon,
    SparklesIcon,
    AcademicCapIcon,
} from '@heroicons/react/20/solid';
import { SkillKartIcon } from '@/assets/icons';

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
    revokedAt?: string | null;
    isRevoked?: boolean;
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
                const certData = res.data.certificate;
                const isRevoked = res.data.isRevoked ?? Boolean(certData?.revokedAt);
                setCert({
                    ...certData,
                    isRevoked,
                });
            })
            .catch(() => {
                setError(true);
            })
            .finally(() => setLoading(false));
    }, [certificateId]);

    const handleCopyLink = () => {
        navigator.clipboard.writeText(window.location.href);
        toast.success('Certificate verification link copied to clipboard!');
    };

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

    const isRevoked = Boolean(cert.isRevoked || cert.revokedAt);

    const formattedDate = new Date(cert.issuedAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    const formattedRevokedDate = cert.revokedAt
        ? new Date(cert.revokedAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
          })
        : '';

    const shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`;

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-100/70 dark:bg-slate-950 py-8 px-4 sm:px-6 transition-colors print:min-h-0 print:h-auto print:py-0 print:px-0 print:bg-white print:dark:bg-white">
            
            {/* Top Toolbar / Action Controls (Hidden when printing) */}
            <div className="w-full max-w-4xl mb-6 flex flex-col sm:flex-row items-center justify-between gap-4 print:hidden">
                <Link
                    to="/my-certificates"
                    className="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors"
                >
                    <ArrowLeftIcon className="w-3.5 h-3.5" />
                    <span>My Certificates</span>
                </Link>

                <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2.5">
                    {isRevoked ? (
                        <div className="inline-flex items-center gap-1.5 bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800 rounded-lg px-3 py-1.5 text-xs font-semibold shadow-2xs">
                            <ExclamationTriangleIcon className="w-4 h-4" />
                            <span>Revoked Credential</span>
                        </div>
                    ) : (
                        <div className="inline-flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 rounded-lg px-3 py-1.5 text-xs font-semibold shadow-2xs">
                            <CheckBadgeIcon className="w-4 h-4" />
                            <span>Verified Credential</span>
                        </div>
                    )}

                    <button
                        type="button"
                        onClick={() => window.print()}
                        className={`inline-flex items-center gap-1.5 ${
                            isRevoked
                                ? 'bg-slate-700 hover:bg-slate-600 dark:bg-slate-800 dark:hover:bg-slate-700'
                                : 'bg-blue-600 hover:bg-blue-500'
                        } text-white rounded-lg px-3.5 py-1.5 text-xs font-semibold shadow-2xs transition-colors cursor-pointer`}
                    >
                        <ArrowDownTrayIcon className="w-3.5 h-3.5" />
                        <span>{isRevoked ? 'Print Revoked Record' : 'Download / Print PDF'}</span>
                    </button>

                    <button
                        type="button"
                        onClick={handleCopyLink}
                        className="inline-flex items-center gap-1.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors border border-slate-200 dark:border-slate-700 shadow-2xs cursor-pointer"
                    >
                        <ClipboardDocumentIcon className="w-3.5 h-3.5 text-slate-500" />
                        <span>Copy Link</span>
                    </button>

                    {!isRevoked && (
                        <a
                            href={shareUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 bg-[#0077b5] hover:bg-[#006097] text-white rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors shadow-2xs"
                        >
                            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                            </svg>
                            <span>Share on LinkedIn</span>
                        </a>
                    )}
                </div>
            </div>

            {/* AUDIT-98: Revoked Certificate Alert Banner */}
            {isRevoked && (
                <div className="w-full max-w-4xl mb-6 bg-rose-50 dark:bg-rose-950/70 border-2 border-rose-500/80 rounded-xl p-4 sm:p-5 flex items-start sm:items-center gap-3.5 text-rose-900 dark:text-rose-200 shadow-sm print:border-rose-600 print:bg-rose-50 print:text-rose-900">
                    <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-900/80 flex items-center justify-center shrink-0 text-rose-600 dark:text-rose-300">
                        <ExclamationTriangleIcon className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-bold text-rose-800 dark:text-rose-300 uppercase tracking-wide">
                            Revoked Credential Notice
                        </h3>
                        <p className="text-xs sm:text-sm text-rose-700 dark:text-rose-300 font-medium mt-0.5">
                            This certificate was revoked on <span className="font-semibold">{formattedRevokedDate || formattedDate}</span> and is no longer a valid credential.
                        </p>
                    </div>
                </div>
            )}

            {/* Certificate Card Frame */}
            <div className="w-full max-w-4xl certificate-card-print print:w-full print:max-w-none print:m-0">
                <div className={`relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border-4 border-double ${
                    isRevoked
                        ? 'border-rose-600/40 dark:border-rose-500/30 print:border-rose-600'
                        : 'border-amber-600/30 dark:border-amber-500/20 print:border-amber-600'
                } p-6 sm:p-10 md:p-12 text-center overflow-hidden transition-colors print:shadow-none print:rounded-none print:border-4 print:border-double print:bg-white print:p-8 print:text-slate-900`}>
                    
                    {/* AUDIT-98: Revoked Watermark Overlay */}
                    {isRevoked && (
                        <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden z-20 select-none">
                            <div className="transform -rotate-12 border-4 border-dashed border-rose-600/30 dark:border-rose-500/20 text-rose-600/30 dark:text-rose-500/20 font-black text-4xl sm:text-6xl md:text-7xl uppercase tracking-[0.25em] px-8 py-4 rounded-2xl print:text-rose-600/40 print:border-rose-600/40">
                                REVOKED
                            </div>
                        </div>
                    )}

                    {/* Inner Ornamental Border */}
                    <div className={`border ${
                        isRevoked
                            ? 'border-rose-600/20 dark:border-rose-500/15 print:border-rose-600/30'
                            : 'border-amber-600/20 dark:border-amber-500/15 print:border-amber-600/30'
                    } rounded-xl p-6 sm:p-8 md:p-10 relative print:p-6`}>
                        
                        {/* Decorative Corner Accents */}
                        <div className={`absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 ${isRevoked ? 'border-rose-600/40 print:border-rose-600' : 'border-amber-600/40 print:border-amber-600'}`} />
                        <div className={`absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 ${isRevoked ? 'border-rose-600/40 print:border-rose-600' : 'border-amber-600/40 print:border-amber-600'}`} />
                        <div className={`absolute bottom-2 left-2 w-3 h-2.5 border-b-2 border-l-2 ${isRevoked ? 'border-rose-600/40 print:border-rose-600' : 'border-amber-600/40 print:border-amber-600'}`} />
                        <div className={`absolute bottom-2 right-2 w-3 h-2.5 border-b-2 border-r-2 ${isRevoked ? 'border-rose-600/40 print:border-rose-600' : 'border-amber-600/40 print:border-amber-600'}`} />

                        {/* Top Brand & Header */}
                        <div className="flex items-center justify-center gap-2 mb-4">
                            <div className="w-7 h-7 rounded-md bg-blue-600 text-white flex items-center justify-center shadow-xs">
                                <SkillKartIcon className="w-4 h-4 text-white" />
                            </div>
                            <span className="text-xs font-bold uppercase tracking-[0.2em] text-slate-800 dark:text-slate-200 print:text-slate-900">
                                SkillKart Academy of Learning
                            </span>
                        </div>

                        {/* Certificate Title */}
                        {isRevoked ? (
                            <div className="mb-6">
                                <div className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400 print:text-rose-700 text-xs font-semibold uppercase tracking-[0.25em] mb-1">
                                    <ExclamationTriangleIcon className="w-3.5 h-3.5" />
                                    <span>Revoked Certificate</span>
                                    <ExclamationTriangleIcon className="w-3.5 h-3.5" />
                                </div>
                                <h2 className="text-xs uppercase tracking-widest text-rose-500 dark:text-rose-400 print:text-rose-600 font-bold">
                                    Invalid Credential — Revoked Status
                                </h2>
                            </div>
                        ) : (
                            <div className="mb-6">
                                <div className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 print:text-amber-700 text-xs font-semibold uppercase tracking-[0.25em] mb-1">
                                    <SparklesIcon className="w-3.5 h-3.5" />
                                    <span>Certificate of Completion</span>
                                    <SparklesIcon className="w-3.5 h-3.5" />
                                </div>
                                <h2 className="text-xs uppercase tracking-widest text-slate-400 dark:text-slate-500 print:text-slate-500 font-medium">
                                    Official Educational Credential
                                </h2>
                            </div>
                        )}

                        {/* Presentation statement */}
                        <p className="text-xs text-slate-500 dark:text-slate-400 print:text-slate-600 mb-3 italic">
                            This is to certify that
                        </p>

                        {/* Recipient Student Name */}
                        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 dark:text-white print:text-slate-900 mb-3 tracking-tight font-serif">
                            {cert.student?.name || 'Student'}
                        </h1>

                        <p className="text-xs text-slate-500 dark:text-slate-400 print:text-slate-600 max-w-md mx-auto mb-6 leading-relaxed">
                            has successfully completed all curricular requirements, practical projects, and assessments for
                        </p>

                        {/* Course Title Banner */}
                        <div className="bg-slate-50 dark:bg-slate-850 print:bg-slate-50 rounded-xl py-4 px-6 mb-8 border border-slate-200 dark:border-slate-800 print:border-slate-200 max-w-2xl mx-auto shadow-2xs">
                            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white print:text-slate-900">
                                {cert.course?.title || 'Course'}
                            </h2>
                            {cert.course?.instructor?.name && (
                                <p className="text-xs text-slate-500 dark:text-slate-400 print:text-slate-600 mt-1">
                                    Instructed by <span className="font-semibold text-slate-700 dark:text-slate-300 print:text-slate-800">{cert.course.instructor.name}</span>
                                </p>
                            )}
                        </div>

                        {/* Bottom Metadata & Signatures Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-end pt-4 border-t border-slate-100 dark:border-slate-800 print:border-slate-200">
                            {/* Left: Issue Date & Verification URL */}
                            <div className="text-center sm:text-left space-y-1">
                                <p className="text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500 print:text-slate-500 font-semibold">
                                    Issued On
                                </p>
                                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 print:text-slate-800">
                                    {formattedDate}
                                </p>
                                {isRevoked && formattedRevokedDate && (
                                    <p className="text-[10px] font-semibold text-rose-600 dark:text-rose-400">
                                        Revoked: {formattedRevokedDate}
                                    </p>
                                )}
                                <p className="text-[10px] text-slate-400 dark:text-slate-500 print:text-slate-500 font-mono break-all">
                                    skillkart.app/verify
                                </p>
                            </div>

                            {/* Center: Official Seal */}
                            <div className="flex flex-col items-center justify-center">
                                {isRevoked ? (
                                    <>
                                        <div className="w-14 h-14 rounded-full bg-rose-50 dark:bg-rose-950/40 print:bg-rose-50 border-2 border-rose-500/60 print:border-rose-600 flex items-center justify-center shadow-xs mb-1.5">
                                            <ExclamationTriangleIcon className="w-8 h-8 text-rose-600 dark:text-rose-400 print:text-rose-600" />
                                        </div>
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400 print:text-rose-700">
                                            Revoked Seal
                                        </span>
                                    </>
                                ) : (
                                    <>
                                        <div className="w-14 h-14 rounded-full bg-amber-50 dark:bg-amber-950/40 print:bg-amber-50 border-2 border-amber-500/60 print:border-amber-600 flex items-center justify-center shadow-xs mb-1.5">
                                            <CheckBadgeIcon className="w-8 h-8 text-amber-600 dark:text-amber-400 print:text-amber-600" />
                                        </div>
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 print:text-amber-700">
                                            Verified Seal
                                        </span>
                                    </>
                                )}
                            </div>

                            {/* Right: Instructor & Certificate ID */}
                            <div className="text-center sm:text-right space-y-1">
                                <p className="text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500 print:text-slate-500 font-semibold">
                                    Certificate ID
                                </p>
                                <p className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200 print:text-slate-800">
                                    {cert.certificateId}
                                </p>
                                <p className={`text-[10px] ${isRevoked ? 'text-rose-500 dark:text-rose-400 font-semibold' : 'text-slate-400 dark:text-slate-500 font-medium'}`}>
                                    {isRevoked ? 'Revoked Status' : 'Authorized Credential'}
                                </p>
                            </div>
                        </div>

                    </div>
                </div>
            </div>

            {/* Bottom Footer Attribution (Screen only) */}
            <p className="text-center text-[11px] text-slate-400 dark:text-slate-500 mt-5 print:hidden">
                Issued by <span className="font-semibold text-slate-600 dark:text-slate-400">SkillKart LMS</span> · Official Public Verification Link
            </p>
        </div>
    );
}

export default VerifyCertificatePage;
