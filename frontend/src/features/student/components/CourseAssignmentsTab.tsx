import React, { useState, useEffect } from 'react';
import {
  fetchCourseAssignments,
  submitStudentAssignment,
  type AssignmentItem,
} from '../api/assignments';
import FileUpload from '@/components/common/FileUpload';

interface CourseAssignmentsTabProps {
  courseId: string;
}

export default function CourseAssignmentsTab({ courseId }: CourseAssignmentsTabProps) {
  const [assignments, setAssignments] = useState<AssignmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAssignment, setSelectedAssignment] = useState<AssignmentItem | null>(null);
  
  // Submission Form State
  const [submissionType, setSubmissionType] = useState<'file' | 'link' | 'text'>('file');
  const [fileUrl, setFileUrl] = useState('');
  const [fileName, setFileName] = useState('');
  const [externalLink, setExternalLink] = useState('');
  const [studentNote, setStudentNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const loadAssignments = async () => {
    try {
      setLoading(true);
      const data = await fetchCourseAssignments(courseId);
      setAssignments(data);
    } catch {
      // Handled silently
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (courseId) {
      loadAssignments();
    }
  }, [courseId]);

  const openSubmissionModal = (assignment: AssignmentItem) => {
    setSelectedAssignment(assignment);
    setSubmissionType(assignment.mySubmission?.submissionType || 'file');
    setFileUrl(assignment.mySubmission?.fileUrl || '');
    setFileName(assignment.mySubmission?.fileName || '');
    setExternalLink(assignment.mySubmission?.externalLink || '');
    setStudentNote(assignment.mySubmission?.studentNote || '');
    setFormError(null);
    setSuccessMsg(null);
  };

  const closeSubmissionModal = () => {
    setSelectedAssignment(null);
    setFormError(null);
    setSuccessMsg(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignment) return;

    if (submissionType === 'file' && !fileUrl) {
      setFormError('Please upload a file before submitting.');
      return;
    }

    if (submissionType === 'link' && !externalLink) {
      setFormError('Please enter your project or repository URL.');
      return;
    }

    if (submissionType === 'text' && !studentNote) {
      setFormError('Please enter your submission text or response.');
      return;
    }

    setSubmitting(true);
    setFormError(null);

    try {
      await submitStudentAssignment(selectedAssignment._id, {
        submissionType,
        fileUrl: submissionType === 'file' ? fileUrl : undefined,
        fileName: submissionType === 'file' ? fileName || 'Uploaded File' : undefined,
        externalLink: submissionType === 'link' ? externalLink : undefined,
        studentNote,
      });

      setSuccessMsg('Your project was submitted successfully!');
      setTimeout(() => {
        closeSubmissionModal();
        loadAssignments();
      }, 1200);
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to submit assignment.';
      setFormError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (assignment: AssignmentItem) => {
    const sub = assignment.mySubmission;
    if (!sub) {
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
          Not Submitted
        </span>
      );
    }

    if (sub.status === 'graded') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          Graded ({sub.score !== undefined ? `${sub.score}/${assignment.maxScore}` : 'Complete'})
        </span>
      );
    }

    if (sub.status === 'resubmission_requested') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
          Resubmission Requested
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
        Submitted &bull; Pending Review
      </span>
    );
  };

  if (loading) {
    return (
      <div className="py-12 flex flex-col items-center justify-center space-y-3">
        <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm text-gray-500 dark:text-gray-400">Loading assignments...</p>
      </div>
    );
  }

  if (assignments.length === 0) {
    return (
      <div className="text-center py-16 px-4 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-xs">
        <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
          </svg>
        </div>
        <h3 className="text-base font-semibold text-gray-900 dark:text-white">No assignments posted yet</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto mt-1">
          The instructor has not added practical project assignments to this course yet. Check back later!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-indigo-50/60 dark:bg-indigo-950/20 p-5 rounded-2xl border border-indigo-100 dark:border-indigo-900/50">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <span>Course Assignments & Projects</span>
            <span className="text-xs bg-indigo-600 text-white font-medium px-2 py-0.5 rounded-full">
              {assignments.length}
            </span>
          </h2>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            Submit your practical coursework, receive rubric evaluations, and get feedback from your instructor.
          </p>
        </div>
      </div>

      {/* Assignments List */}
      <div className="grid gap-5">
        {assignments.map((assignment) => {
          const sub = assignment.mySubmission;
          return (
            <div
              key={assignment._id}
              className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-xs transition-all hover:border-indigo-200 dark:hover:border-indigo-800"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-bold text-gray-900 dark:text-white">
                      {assignment.title}
                    </h3>
                    {getStatusBadge(assignment)}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                    {assignment.description}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => openSubmissionModal(assignment)}
                    className="px-4 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-colors shadow-xs"
                  >
                    {sub ? (sub.status === 'graded' ? 'View Submission' : 'Edit Submission') : 'Submit Work'}
                  </button>
                </div>
              </div>

              {/* Assignment Meta Details */}
              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 flex flex-wrap items-center gap-y-2 gap-x-6 text-xs text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-1.5">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-indigo-500">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 0 1 3 3h-15a3 3 0 0 1 3-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.004 0H9.496m5.004 0a3 3 0 0 0 3-3v-2.25a3 3 0 0 0-3-3m-5.004 0a3 3 0 0 0-3 3v2.25a3 3 0 0 0 3 3m0-6V3.375c0-.621.504-1.125 1.125-1.125h1.75c.621 0 1.125.504 1.125 1.125V6" />
                  </svg>
                  <span>Max Score: <strong className="text-gray-700 dark:text-gray-200">{assignment.maxScore} pts</strong></span>
                </div>

                {assignment.dueDate && (
                  <div className="flex items-center gap-1.5">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-amber-500">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                    </svg>
                    <span>Due: {new Date(assignment.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                )}

                {assignment.rubric && assignment.rubric.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-emerald-500">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                    </svg>
                    <span>{assignment.rubric.length} Rubric Criteria</span>
                  </div>
                )}
              </div>

              {/* Graded Feedback Box if already graded */}
              {sub && sub.status === 'graded' && (
                <div className="mt-4 p-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wide">
                      Evaluation & Feedback
                    </span>
                    <span className="text-sm font-extrabold text-emerald-700 dark:text-emerald-300">
                      {sub.score} / {assignment.maxScore} pts
                    </span>
                  </div>
                  {sub.instructorFeedback && (
                    <p className="text-xs text-gray-700 dark:text-gray-300 italic bg-white/70 dark:bg-gray-900/50 p-2.5 rounded-lg border border-emerald-100 dark:border-emerald-900/40">
                      &ldquo;{sub.instructorFeedback}&rdquo;
                    </p>
                  )}
                  {sub.rubricScores && sub.rubricScores.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      {sub.rubricScores.map((r, i) => (
                        <div key={i} className="flex justify-between items-center text-xs px-2.5 py-1.5 rounded-md bg-white dark:bg-gray-900 border border-emerald-100 dark:border-gray-800">
                          <span className="text-gray-600 dark:text-gray-300">{r.criterion}</span>
                          <span className="font-semibold text-emerald-600 dark:text-emerald-400">+{r.pointsEarned} pts</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Submission / View Modal */}
      {selectedAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200 dark:border-gray-800 p-6 space-y-6">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-gray-100 dark:border-gray-800 pb-4">
              <div>
                <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                  Assignment Submission
                </span>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  {selectedAssignment.title}
                </h3>
              </div>
              <button
                onClick={closeSubmissionModal}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Assignment Details Brief */}
            <div className="space-y-3 bg-gray-50 dark:bg-gray-800/40 p-4 rounded-xl text-xs text-gray-600 dark:text-gray-300">
              <div>
                <strong className="text-gray-900 dark:text-white block mb-1">Description:</strong>
                <p className="whitespace-pre-line">{selectedAssignment.description}</p>
              </div>

              {selectedAssignment.instructions && (
                <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                  <strong className="text-gray-900 dark:text-white block mb-1">Instructions & Guidelines:</strong>
                  <p className="whitespace-pre-line text-gray-600 dark:text-gray-300">{selectedAssignment.instructions}</p>
                </div>
              )}

              {selectedAssignment.rubric && selectedAssignment.rubric.length > 0 && (
                <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                  <strong className="text-gray-900 dark:text-white block mb-1.5">Grading Rubric:</strong>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {selectedAssignment.rubric.map((r, i) => (
                      <div key={i} className="flex justify-between items-center bg-white dark:bg-gray-900 p-2 rounded-lg border border-gray-200 dark:border-gray-700">
                        <span>{r.criterion}</span>
                        <span className="font-semibold text-indigo-600 dark:text-indigo-400">Max {r.maxPoints} pts</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Submission Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Submission Format
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['file', 'link', 'text'] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setSubmissionType(type)}
                      className={`py-2 px-3 rounded-xl text-xs font-semibold capitalize border transition-all ${
                        submissionType === type
                          ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-600 text-indigo-700 dark:text-indigo-300 shadow-xs'
                          : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                      }`}
                    >
                      {type === 'file' ? '📁 File Upload' : type === 'link' ? '🔗 External URL' : '📝 Text Entry'}
                    </button>
                  ))}
                </div>
              </div>

              {submissionType === 'file' && (
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                    Upload Project Archive / Document (ZIP, PDF, DOCX, Code)
                  </label>
                  <FileUpload
                    accept=".zip,.pdf,.docx,.doc,.tar,.gz,.txt,.png,.jpg,.jpeg"
                    label=""
                    maxSizeMB={25}
                    onUploadSuccess={(url) => {
                      setFileUrl(url);
                      setFileName(url.split('/').pop() || 'uploaded-file');
                    }}
                  />
                  {fileUrl && (
                    <div className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 mt-1 bg-emerald-50 dark:bg-emerald-950/40 p-2 rounded-lg">
                      <span>✓ Ready:</span>
                      <a href={fileUrl} target="_blank" rel="noreferrer" className="underline truncate max-w-xs font-mono">
                        {fileName || fileUrl}
                      </a>
                    </div>
                  )}
                </div>
              )}

              {submissionType === 'link' && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Repository or Project URL (GitHub, GitLab, Figma, CodeSandbox, etc.)
                  </label>
                  <input
                    type="url"
                    value={externalLink}
                    onChange={(e) => setExternalLink(e.target.value)}
                    placeholder="https://github.com/username/project"
                    className="w-full text-xs px-3 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Student Comments / Submission Notes (Optional)
                </label>
                <textarea
                  rows={3}
                  value={studentNote}
                  onChange={(e) => setStudentNote(e.target.value)}
                  placeholder="Notes for instructor regarding execution steps, architecture choices, or challenges faced..."
                  className="w-full text-xs px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              {formError && (
                <div className="p-3 text-xs text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 rounded-xl border border-rose-200 dark:border-rose-900">
                  {formError}
                </div>
              )}

              {successMsg && (
                <div className="p-3 text-xs text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-900">
                  {successMsg}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                <button
                  type="button"
                  onClick={closeSubmissionModal}
                  className="px-4 py-2 text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-xl transition-colors shadow-xs"
                >
                  {submitting ? 'Submitting...' : 'Submit Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
