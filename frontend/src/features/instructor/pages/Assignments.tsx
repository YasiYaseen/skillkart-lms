import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { toast } from 'react-toastify';
import {
  fetchInstructorCourseAssignments,
  createCourseAssignment,
  updateCourseAssignment,
  deleteCourseAssignment,
  fetchInstructorSubmissions,
  gradeStudentSubmission,
  type InstructorAssignment,
  type StudentSubmission,
  type RubricCriterion,
} from '../api/assignments';
import FileUpload from '@/components/common/FileUpload';

interface Course {
  _id: string;
  title: string;
}

export function Assignments() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [activeView, setActiveView] = useState<'assignments' | 'gradebook'>('assignments');
  const [loadingCourses, setLoadingCourses] = useState(true);

  // Assignments Manager State
  const [assignments, setAssignments] = useState<InstructorAssignment[]>([]);
  const [loadingAssignments, setLoadingAssignments] = useState(false);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [editingAssignmentId, setEditingAssignmentId] = useState<string | null>(null);

  // Assignment Modal Form Fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [instructions, setInstructions] = useState('');
  const [maxScore, setMaxScore] = useState<number>(100);
  const [dueDate, setDueDate] = useState<string>('');
  const [rubric, setRubric] = useState<RubricCriterion[]>([
    { criterion: 'Core Functionality', maxPoints: 50 },
    { criterion: 'Code Quality & Structure', maxPoints: 30 },
    { criterion: 'Testing & Documentation', maxPoints: 20 },
  ]);
  const [attachments, setAttachments] = useState<{ name: string; url: string }[]>([]);
  const [savingAssignment, setSavingAssignment] = useState(false);

  // Gradebook State
  const [submissions, setSubmissions] = useState<StudentSubmission[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubmission, setSelectedSubmission] = useState<StudentSubmission | null>(null);

  // Grading Modal Form State
  const [gradeScore, setGradeScore] = useState<number>(0);
  const [gradeStatus, setGradeStatus] = useState<'under_review' | 'graded' | 'resubmission_requested'>('graded');
  const [rubricScores, setRubricScores] = useState<{ criterion: string; pointsEarned: number }[]>([]);
  const [instructorFeedback, setInstructorFeedback] = useState('');
  const [savingGrade, setSavingGrade] = useState(false);

  // Load instructor's courses
  useEffect(() => {
    const loadCourses = async () => {
      try {
        const res = await api.get('/courses?mine=true');
        const list: Course[] = res.data.courses ?? [];
        setCourses(list);
        if (list.length > 0) {
          setSelectedCourseId(list[0]._id);
        }
      } catch {
        toast.error('Failed to load courses');
      } finally {
        setLoadingCourses(false);
      }
    };
    loadCourses();
  }, []);

  // Load assignments for selected course
  const loadAssignments = async (courseId: string) => {
    if (!courseId) return;
    setLoadingAssignments(true);
    try {
      const data = await fetchInstructorCourseAssignments(courseId);
      setAssignments(data);
    } catch {
      toast.error('Failed to load assignments');
    } finally {
      setLoadingAssignments(false);
    }
  };

  // Load submissions for gradebook
  const loadSubmissions = async () => {
    setLoadingSubmissions(true);
    try {
      const data = await fetchInstructorSubmissions({
        courseId: selectedCourseId || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
      });
      setSubmissions(data);
    } catch {
      toast.error('Failed to load student submissions');
    } finally {
      setLoadingSubmissions(false);
    }
  };

  useEffect(() => {
    if (selectedCourseId) {
      if (activeView === 'assignments') {
        loadAssignments(selectedCourseId);
      } else {
        loadSubmissions();
      }
    }
  }, [selectedCourseId, activeView, statusFilter]);

  // Open Create/Edit Assignment Modal
  const openCreateModal = () => {
    setEditingAssignmentId(null);
    setTitle('');
    setDescription('');
    setInstructions('');
    setMaxScore(100);
    setDueDate('');
    setRubric([
      { criterion: 'Core Functionality', maxPoints: 50 },
      { criterion: 'Code Quality & Structure', maxPoints: 30 },
      { criterion: 'Testing & Documentation', maxPoints: 20 },
    ]);
    setAttachments([]);
    setShowAssignmentModal(true);
  };

  const openEditModal = (assignment: InstructorAssignment) => {
    setEditingAssignmentId(assignment._id);
    setTitle(assignment.title);
    setDescription(assignment.description);
    setInstructions(assignment.instructions || '');
    setMaxScore(assignment.maxScore);
    setDueDate(assignment.dueDate ? assignment.dueDate.split('T')[0] : '');
    setRubric(assignment.rubric && assignment.rubric.length > 0 ? assignment.rubric : []);
    setAttachments(assignment.attachments || []);
    setShowAssignmentModal(true);
  };

  const handleSaveAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseId) {
      toast.error('Please select a course first');
      return;
    }

    if (!title.trim() || !description.trim()) {
      toast.error('Title and description are required');
      return;
    }

    setSavingAssignment(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        instructions: instructions.trim(),
        maxScore: Number(maxScore) || 100,
        dueDate: dueDate ? new Date(dueDate).toISOString() : null,
        rubric,
        attachments,
      };

      if (editingAssignmentId) {
        await updateCourseAssignment(editingAssignmentId, payload);
        toast.success('Assignment updated successfully');
      } else {
        await createCourseAssignment(selectedCourseId, payload);
        toast.success('Assignment created and published to students!');
      }

      setShowAssignmentModal(false);
      loadAssignments(selectedCourseId);
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to save assignment';
      toast.error(message);
    } finally {
      setSavingAssignment(false);
    }
  };

  const handleDeleteAssignment = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this assignment and all student submissions?')) return;
    try {
      await deleteCourseAssignment(id);
      toast.success('Assignment deleted');
      loadAssignments(selectedCourseId);
    } catch {
      toast.error('Failed to delete assignment');
    }
  };

  // Rubric editing helpers
  const handleAddRubricCriterion = () => {
    setRubric([...rubric, { criterion: '', maxPoints: 10 }]);
  };

  const handleUpdateRubric = (index: number, field: keyof RubricCriterion, value: string | number) => {
    const updated = [...rubric];
    updated[index] = { ...updated[index], [field]: value };
    setRubric(updated);
  };

  const handleRemoveRubric = (index: number) => {
    setRubric(rubric.filter((_, i) => i !== index));
  };

  // Open Grading Modal
  const openGradingModal = (sub: StudentSubmission) => {
    setSelectedSubmission(sub);
    setGradeScore(sub.score !== undefined ? sub.score : 0);
    setGradeStatus(sub.status === 'submitted' ? 'graded' : sub.status);
    setInstructorFeedback(sub.instructorFeedback || '');

    // Setup initial rubric scores based on assignment rubric
    if (sub.assignment?.rubric && sub.assignment.rubric.length > 0) {
      const initialRubricScores = sub.assignment.rubric.map((r) => {
        const existing = sub.rubricScores?.find((s) => s.criterion === r.criterion);
        return {
          criterion: r.criterion,
          pointsEarned: existing ? existing.pointsEarned : r.maxPoints,
        };
      });
      setRubricScores(initialRubricScores);
      if (sub.score === undefined) {
        const sum = initialRubricScores.reduce((acc, curr) => acc + curr.pointsEarned, 0);
        setGradeScore(sum);
      }
    } else {
      setRubricScores([]);
    }
  };

  const handleRubricScoreChange = (index: number, points: number) => {
    const updated = [...rubricScores];
    updated[index].pointsEarned = points;
    setRubricScores(updated);
    const sum = updated.reduce((acc, curr) => acc + Number(curr.pointsEarned || 0), 0);
    setGradeScore(sum);
  };

  const handleSaveGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubmission) return;

    setSavingGrade(true);
    try {
      await gradeStudentSubmission(selectedSubmission._id, {
        score: Number(gradeScore),
        status: gradeStatus,
        rubricScores,
        instructorFeedback: instructorFeedback.trim(),
      });
      toast.success('Grade and feedback returned to student!');
      setSelectedSubmission(null);
      loadSubmissions();
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to submit grade';
      toast.error(message);
    } finally {
      setSavingGrade(false);
    }
  };

  // Filtered submissions for search
  const filteredSubmissions = submissions.filter((s) => {
    const q = searchQuery.toLowerCase();
    const studentName = s.student?.name?.toLowerCase() || '';
    const studentEmail = s.student?.email?.toLowerCase() || '';
    const assignTitle = s.assignment?.title?.toLowerCase() || '';
    return studentName.includes(q) || studentEmail.includes(q) || assignTitle.includes(q);
  });

  const totalPending = submissions.filter((s) => s.status === 'submitted' || s.status === 'under_review').length;
  const totalGraded = submissions.filter((s) => s.status === 'graded').length;

  if (loadingCourses) {
    return <div className="text-gray-500 dark:text-gray-400 py-16 text-center">Loading instructor assignments portal...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Top Banner & View Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Assignments & Gradebook</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Create practical project briefs, evaluate student work with custom rubrics, and provide feedback.
          </p>
        </div>

        {/* View Toggle Tabs */}
        <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 p-1.5 rounded-xl self-start sm:self-auto">
          <button
            onClick={() => setActiveView('assignments')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeView === 'assignments'
                ? 'bg-white dark:bg-gray-900 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            📋 Assignment Manager
          </button>
          <button
            onClick={() => setActiveView('gradebook')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
              activeView === 'gradebook'
                ? 'bg-white dark:bg-gray-900 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <span>📝 Gradebook & Submissions</span>
            {totalPending > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
            )}
          </button>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xl font-bold">
            📋
          </div>
          <div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Total Course Assignments</div>
            <div className="text-2xl font-extrabold text-gray-900 dark:text-white">{assignments.length}</div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center text-xl font-bold">
            ⏳
          </div>
          <div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Pending Reviews</div>
            <div className="text-2xl font-extrabold text-amber-600 dark:text-amber-400">{totalPending}</div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xl font-bold">
            ✓
          </div>
          <div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Total Graded Submissions</div>
            <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">{totalGraded}</div>
          </div>
        </div>
      </div>

      {/* Course Selector Bar */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1">
          <label className="text-xs font-bold text-gray-700 dark:text-gray-300 shrink-0">Select Course:</label>
          <select
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
            className="text-xs font-medium px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden max-w-md w-full"
          >
            {courses.map((c) => (
              <option key={c._id} value={c._id}>
                {c.title}
              </option>
            ))}
          </select>
        </div>

        {activeView === 'assignments' && (
          <button
            onClick={openCreateModal}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition-colors shadow-xs flex items-center gap-1.5 self-start sm:self-auto"
          >
            <span>+ Create Assignment</span>
          </button>
        )}
      </div>

      {/* VIEW 1: ASSIGNMENTS MANAGER */}
      {activeView === 'assignments' && (
        <div className="space-y-4">
          {loadingAssignments ? (
            <div className="text-gray-500 dark:text-gray-400 py-12 text-center">Loading course assignments...</div>
          ) : assignments.length === 0 ? (
            <div className="text-center py-16 px-4 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800">
              <div className="w-12 h-12 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mx-auto mb-3 text-xl">
                📂
              </div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">No assignments for this course</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-xs mx-auto">
                Create practical project requirements with rubrics for your enrolled students.
              </p>
              <button
                onClick={openCreateModal}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition-colors shadow-xs"
              >
                Create First Assignment
              </button>
            </div>
          ) : (
            <div className="grid gap-4">
              {assignments.map((assignment) => (
                <div
                  key={assignment._id}
                  className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-bold text-gray-900 dark:text-white">
                        {assignment.title}
                      </h3>
                      <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50">
                        {assignment.maxScore} Max Points
                      </span>
                    </div>

                    <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2">
                      {assignment.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 dark:text-gray-400 pt-1">
                      <span>📥 <strong>{assignment.totalSubmissions || 0}</strong> Submissions</span>
                      <span className="text-amber-600">⏳ <strong>{assignment.pendingCount || 0}</strong> Pending Review</span>
                      <span className="text-emerald-600">✓ <strong>{assignment.gradedCount || 0}</strong> Graded</span>
                      {assignment.dueDate && (
                        <span>📅 Due: {new Date(assignment.dueDate).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                    <button
                      onClick={() => openEditModal(assignment)}
                      className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200 transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteAssignment(assignment._id)}
                      className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: GRADEBOOK & SUBMISSIONS */}
      {activeView === 'gradebook' && (
        <div className="space-y-4">
          {/* Submissions Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="Search by student name or assignment..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 text-xs px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs px-3 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            >
              <option value="all">All Statuses</option>
              <option value="submitted">Pending Review</option>
              <option value="graded">Graded</option>
              <option value="resubmission_requested">Resubmission Requested</option>
            </select>
          </div>

          {loadingSubmissions ? (
            <div className="text-gray-500 dark:text-gray-400 py-12 text-center">Loading gradebook submissions...</div>
          ) : filteredSubmissions.length === 0 ? (
            <div className="text-center py-16 px-4 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">No submissions match the filter</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Student submissions will show up here once turned in.</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-gray-600 dark:text-gray-300">
                  <thead className="bg-gray-50 dark:bg-gray-800/60 text-gray-700 dark:text-gray-200 font-semibold border-b border-gray-200 dark:border-gray-800 uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="px-5 py-3.5">Student</th>
                      <th className="px-5 py-3.5">Assignment</th>
                      <th className="px-5 py-3.5">Submitted</th>
                      <th className="px-5 py-3.5">Type</th>
                      <th className="px-5 py-3.5">Status / Score</th>
                      <th className="px-5 py-3.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {filteredSubmissions.map((sub) => (
                      <tr key={sub._id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/40 transition-colors">
                        <td className="px-5 py-4 whitespace-nowrap">
                          <div className="font-semibold text-gray-900 dark:text-white">{sub.student?.name}</div>
                          <div className="text-[11px] text-gray-400">{sub.student?.email}</div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="font-medium text-gray-900 dark:text-white max-w-xs truncate">{sub.assignment?.title}</div>
                          <div className="text-[11px] text-gray-400 max-w-xs truncate">{sub.course?.title}</div>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap text-[11px]">
                          {new Date(sub.submittedAt).toLocaleString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md font-medium text-[10px] bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 capitalize">
                            {sub.submissionType === 'file' ? '📁 File' : sub.submissionType === 'link' ? '🔗 URL' : '📝 Text'}
                          </span>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          {sub.status === 'graded' ? (
                            <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
                              <span>✓</span> {sub.score} / {sub.assignment?.maxScore || 100} pts
                            </span>
                          ) : sub.status === 'resubmission_requested' ? (
                            <span className="text-rose-600 font-medium">Resubmission Req.</span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-amber-600 font-medium">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> Pending Review
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-right whitespace-nowrap">
                          <button
                            onClick={() => openGradingModal(sub)}
                            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold text-xs transition-colors shadow-xs"
                          >
                            {sub.status === 'graded' ? 'Re-Grade' : 'Review & Grade'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* CREATE / EDIT ASSIGNMENT MODAL */}
      {showAssignmentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200 dark:border-gray-800 p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                {editingAssignmentId ? 'Edit Assignment' : 'Create Course Assignment'}
              </h3>
              <button
                onClick={() => setShowAssignmentModal(false)}
                className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveAssignment} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Assignment Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Build a Responsive E-Commerce Cart Component"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Short Description *
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Brief summary of the goals and deliverables..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Detailed Instructions & Guidelines
                </label>
                <textarea
                  rows={4}
                  placeholder="Step-by-step instructions, submission format requirements, edge cases to handle..."
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Max Score / Points
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={maxScore}
                    onChange={(e) => setMaxScore(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Due Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Rubric Builder */}
              <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
                <div className="flex items-center justify-between mb-2">
                  <label className="font-semibold text-gray-700 dark:text-gray-300">
                    Grading Rubric Criteria
                  </label>
                  <button
                    type="button"
                    onClick={handleAddRubricCriterion}
                    className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
                  >
                    + Add Criterion
                  </button>
                </div>

                <div className="space-y-2">
                  {rubric.map((r, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="e.g. Code Quality"
                        value={r.criterion}
                        onChange={(e) => handleUpdateRubric(index, 'criterion', e.target.value)}
                        className="flex-1 px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      />
                      <input
                        type="number"
                        min={1}
                        placeholder="Pts"
                        value={r.maxPoints}
                        onChange={(e) => handleUpdateRubric(index, 'maxPoints', Number(e.target.value))}
                        className="w-20 px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveRubric(index)}
                        className="text-rose-500 hover:text-rose-700 p-1"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Starter File Attachment */}
              <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
                <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Starter Files / Templates (Optional)
                </label>
                <FileUpload
                  accept=".zip,.pdf,.docx,.txt"
                  label=""
                  onUploadSuccess={(url) => {
                    setAttachments([...attachments, { name: url.split('/').pop() || 'file', url }]);
                  }}
                />
                {attachments.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {attachments.map((att, i) => (
                      <div key={i} className="flex items-center justify-between text-[11px] bg-gray-50 dark:bg-gray-800 p-1.5 rounded-lg">
                        <span className="truncate">{att.name}</span>
                        <button
                          type="button"
                          onClick={() => setAttachments(attachments.filter((_, idx) => idx !== i))}
                          className="text-rose-500"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => setShowAssignmentModal(false)}
                  className="px-4 py-2 font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingAssignment}
                  className="px-5 py-2 font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl disabled:opacity-50 shadow-xs"
                >
                  {savingAssignment ? 'Saving...' : editingAssignmentId ? 'Update Assignment' : 'Publish Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* GRADING MODAL */}
      {selectedSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200 dark:border-gray-800 p-6 space-y-5">
            <div className="flex items-start justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
              <div>
                <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider">Grade Submission</span>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  {selectedSubmission.assignment?.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedSubmission(null)}
                className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>

            {/* Student Info & Submission Material */}
            <div className="bg-gray-50 dark:bg-gray-800/40 p-4 rounded-xl space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <strong className="text-gray-900 dark:text-white">{selectedSubmission.student?.name}</strong>
                  <span className="text-gray-500 dark:text-gray-400 ml-2">({selectedSubmission.student?.email})</span>
                </div>
                <span className="text-[11px] text-gray-400">
                  Submitted: {new Date(selectedSubmission.submittedAt).toLocaleString()}
                </span>
              </div>

              {selectedSubmission.studentNote && (
                <div className="bg-white dark:bg-gray-900 p-2.5 rounded-lg border border-gray-200 dark:border-gray-700">
                  <span className="text-[11px] font-semibold text-gray-400 block mb-0.5">Student's Note:</span>
                  <p className="italic text-gray-700 dark:text-gray-300">{selectedSubmission.studentNote}</p>
                </div>
              )}

              {/* Submitted file / link download */}
              <div className="pt-2 border-t border-gray-200 dark:border-gray-700 flex items-center gap-3">
                <span className="font-semibold text-gray-700 dark:text-gray-300">Deliverable:</span>
                {selectedSubmission.fileUrl && (
                  <a
                    href={selectedSubmission.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-500 transition-colors flex items-center gap-1 text-[11px]"
                  >
                    <span>⬇ Download Submitted File</span>
                  </a>
                )}
                {selectedSubmission.externalLink && (
                  <a
                    href={selectedSubmission.externalLink}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 rounded-lg font-semibold border border-indigo-200 dark:border-indigo-800 hover:underline flex items-center gap-1 text-[11px]"
                  >
                    <span>🔗 Open Project URL</span>
                  </a>
                )}
              </div>
            </div>

            {/* Grading Form */}
            <form onSubmit={handleSaveGrade} className="space-y-4 text-xs">
              {/* Rubric Evaluation */}
              {rubricScores.length > 0 && (
                <div className="space-y-2">
                  <label className="font-bold text-gray-700 dark:text-gray-300 block">
                    Rubric Scoring
                  </label>
                  <div className="space-y-2">
                    {rubricScores.map((r, i) => (
                      <div key={i} className="flex items-center justify-between p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                        <span className="font-medium text-gray-800 dark:text-gray-200">{r.criterion}</span>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            min={0}
                            value={r.pointsEarned}
                            onChange={(e) => handleRubricScoreChange(i, Number(e.target.value))}
                            className="w-16 px-2 py-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-right font-bold text-indigo-600 dark:text-indigo-400"
                          />
                          <span className="text-gray-400 text-[11px]">pts</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Total Score ({selectedSubmission.assignment?.maxScore || 100} max)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={gradeScore}
                    onChange={(e) => setGradeScore(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-extrabold text-base focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Submission Status
                  </label>
                  <select
                    value={gradeStatus}
                    onChange={(e) => setGradeStatus(e.target.value as 'under_review' | 'graded' | 'resubmission_requested')}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  >
                    <option value="graded">Graded & Accepted</option>
                    <option value="under_review">Under Review</option>
                    <option value="resubmission_requested">Request Resubmission</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Instructor Feedback & Guidance
                </label>
                <textarea
                  rows={3}
                  value={instructorFeedback}
                  onChange={(e) => setInstructorFeedback(e.target.value)}
                  placeholder="Give constructive feedback on what the student did well and what could be improved..."
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => setSelectedSubmission(null)}
                  className="px-4 py-2 font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingGrade}
                  className="px-5 py-2 font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl disabled:opacity-50 shadow-xs"
                >
                  {savingGrade ? 'Saving Grade...' : 'Save & Return Grade'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Assignments;
