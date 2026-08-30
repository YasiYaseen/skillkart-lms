import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '@/lib/api';

function VerifyCertificatePage() {
    const { certificateId } = useParams<{ certificateId: string }>();
    const [cert, setCert] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        api.get(`/certificates/verify/${certificateId}`)
            .then(res => setCert(res.data.certificate))
            .catch(() => setNotFound(true))
            .finally(() => setLoading(false));
    }, [certificateId]);

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50">
            <div className="text-gray-500">Verifying certificate...</div>
        </div>
    );

    if (notFound || !cert) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-red-50 to-orange-50 p-8">
            <div className="text-6xl mb-4">❌</div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Certificate Not Found</h1>
            <p className="text-gray-500 mb-6">No certificate matches ID <code className="bg-gray-100 px-2 py-1 rounded text-sm">{certificateId}</code></p>
            <Link to="/" className="text-blue-600 hover:underline">← Back to Home</Link>
        </div>
    );

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-6">
            <div className="w-full max-w-2xl">
                {/* Certificate Card */}
                <div className="bg-white rounded-3xl shadow-2xl border-4 border-indigo-100 overflow-hidden">
                    {/* Top band */}
                    <div className="h-3 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

                    <div className="p-10 text-center">
                        {/* Seal */}
                        <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-white" viewBox="0 0 24 24" fill="currentColor">
                                <path fillRule="evenodd" d="M8.603 3.799A4.49 4.49 0 0112 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 013.498 1.307 4.491 4.491 0 011.307 3.497A4.49 4.49 0 0121.75 12a4.49 4.49 0 01-1.549 3.397 4.491 4.491 0 01-1.307 3.497 4.491 4.491 0 01-3.497 1.307A4.49 4.49 0 0112 21.75a4.49 4.49 0 01-3.397-1.549 4.49 4.49 0 01-3.498-1.306 4.491 4.491 0 01-1.307-3.498A4.49 4.49 0 012.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 011.307-3.497 4.49 4.49 0 013.497-1.307zm7.007 6.387a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
                            </svg>
                        </div>

                        <p className="text-sm font-semibold text-indigo-500 uppercase tracking-widest mb-2">Certificate of Completion</p>
                        <p className="text-gray-500 text-sm mb-6">This is to certify that</p>

                        <h1 className="text-4xl font-extrabold text-gray-900 mb-2">
                            {cert.student?.name || 'Student'}
                        </h1>
                        <p className="text-gray-400 text-sm mb-8">has successfully completed the course</p>

                        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-6 mb-8 border border-indigo-100">
                            <h2 className="text-2xl font-bold text-indigo-800">
                                {cert.course?.title || 'Course'}
                            </h2>
                            {cert.course?.instructor?.name && (
                                <p className="text-sm text-gray-500 mt-2">
                                    Instructed by <span className="font-semibold text-gray-700">{cert.course.instructor.name}</span>
                                </p>
                            )}
                        </div>

                        <div className="flex items-center justify-center gap-8 text-sm text-gray-500 mb-8">
                            <div className="text-center">
                                <p className="text-xs uppercase tracking-wider text-gray-400 mb-1">Issued On</p>
                                <p className="font-semibold text-gray-700">
                                    {new Date(cert.issuedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                                </p>
                            </div>
                            <div className="w-px h-10 bg-gray-200" />
                            <div className="text-center">
                                <p className="text-xs uppercase tracking-wider text-gray-400 mb-1">Certificate ID</p>
                                <p className="font-mono font-semibold text-gray-700 text-xs">{cert.certificateId}</p>
                            </div>
                        </div>

                        {/* Verified badge & Actions */}
                        <div className="flex flex-wrap items-center justify-center gap-4">
                            <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 border border-green-200 rounded-full px-4 py-1.5 text-sm font-semibold">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                Verified Certificate
                            </div>

                            <button
                                type="button"
                                onClick={() => window.print()}
                                className="print:hidden inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-5 py-1.5 text-sm font-semibold shadow-sm transition-all"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                                Download / Print PDF
                            </button>
                        </div>
                    </div>

                    {/* Bottom band */}
                    <div className="h-3 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500" />
                </div>

                <p className="text-center text-xs text-gray-400 mt-4 print:hidden">
                    Issued by <span className="font-semibold text-gray-600">SkillKart</span> · <Link to="/" className="hover:underline text-indigo-400">skillkart.app</Link>
                </p>
            </div>
        </div>
    );
}

export default VerifyCertificatePage;
