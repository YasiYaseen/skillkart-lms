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
import { getErrorMessage } from '@/utils/errorUtils';
import {
  ClipboardDocumentListIcon,
  DocumentCheckIcon,
  ClockIcon,
  CheckCircleIcon,
  FolderIcon,
  LinkIcon,
  DocumentTextIcon,
  CalendarIcon,
  ArrowDownTrayIcon,
  XMarkIcon,
} from '@heroicons/react/20/solid';

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
    { criterion: 'Core Functionality & Requirements', maxPoints: 50 },
    { criterion: 'Code Quality & Structure', maxPoints: 30 },
    { criterion: 'UI/UX Polish & Documentation', maxPoints: 20 },
  ]);
  const [attachments, setAttachments] = useState<{ name: string; url: string }[]>([]);
  const [savingAssignment, setSavingAssignment] = useState(false);

  // Gradebook Submissions State
  const [submissions, setSubmissions] = useState<StudentSubmission[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Grading Modal State
  const [selectedSubmission, setSelectedSubmission] = useState<StudentSubmission | null>(null);
  const [gradeScore, setGradeScore] = useState<number>(0);
  const [gradeStatus, setGradeStatus] = useState<'under_review' | 'graded' | 'resubmission_requested'>('graded');
  const [instructorFeedback, setInstructorFeedback] = useState('');
  const [rubricScores, setRubricScores] = useState<{ criterion: string; pointsEarned: number }[]>([]);
  const [savingGrade, setSavingGrade] = useState(false);

  // Load Instructor Courses on Mount
  useEffect(() => {
    const loadCourses = async () => {
      try {
        setLoadingCourses(true);
        const res = await api.get('/courses/instructor');
        const coursesData = Array.isArray(res.data) ? res.data : res.data.courses || [];
        setCourses(coursesData);
        if (coursesData.length > 0) {
          setSelectedCourseId(coursesData[0]._id);
        }
      } catch (err: unknown) {
        const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to load courses';
        toast.error(msg);
      } finally {
        setLoadingCourses(false);
      }
    };
    loadCourses();
  }, []);

  // Load Assignments for Selected Course
  useEffect(() => {
    if (!selectedCourseId) return;

    const loadAssignments = async () => {
      try {
        setLoadingAssignments(true);
        const data = await fetchInstructorCourseAssignments(selectedCourseId);
        setAssignments(data);
      } catch (err: unknown) {
        const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to load assignments';
        toast.error(msg);
      } finally {
        setLoadingAssignments(false);
      }
    };
    loadAssignments();
  }, [selectedCourseId]);

  // Load Gradebook Submissions when switching to Gradebook tab
  useEffect(() => {
    if (activeView !== 'gradebook') return;

    const loadSubmissions = async () => {
      try {
        setLoadingSubmissions(true);
        const data = await fetchInstructorSubmissions({
          courseId: selectedCourseId || undefined,
          status: statusFilter === 'all' ? undefined : statusFilter,
        });
        setSubmissions(data);
      } catch (err: unknown) {
        const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to load submissions';
        toast.error(msg);
      } finally {
        setLoadingSubmissions(false);
      }
    };
    loadSubmissions();
  }, [activeView, selectedCourseId, statusFilter]);

  // Modal Helpers
  const openCreateModal = () => {
    setEditingAssignmentId(null);
    setTitle('');
    setDescription('');
    setInstructions('');
    setMaxScore(100);
    setDueDate('');
    setRubric([
      { criterion: 'Core Functionality & Requirements', maxPoints: 50 },
      { criterion: 'Code Quality & Structure', maxPoints: 30 },
      { criterion: 'UI/UX Polish & Documentation', maxPoints: 20 },
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
    setDueDate(assignment.dueDate ? new Date(assignment.dueDate).toISOString().split('T')[0] : '');
    setRubric(assignment.rubric && assignment.rubric.length > 0 ? assignment.rubric : []);
    setAttachments(assignment.attachments || []);
    setShowAssignmentModal(true);
  };

  const handleAddRubricCriterion = () => {
    setRubric([...rubric, { criterion: '', maxPoints: 10 }]);
  };

  const handleUpdateRubric = (index: number, field: keyof RubricCriterion, val: string | number) => {
    const updated = [...rubric];
    updated[index] = { ...updated[index], [field]: val };
    setRubric(updated);
  };

  const handleRemoveRubric = (index: number) => {
    setRubric(rubric.filter((_, idx) => idx !== index));
  };

  const handleSaveAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseId) {
      toast.error('Please select a course first.');
      return;
    }
    if (!title.trim() || !description.trim()) {
      toast.error('Title and description are required.');
      return;
    }

    try {
      setSavingAssignment(true);
      const payload = {
        title: title.trim(),
        description: description.trim(),
        instructions: instructions.trim(),
        maxScore,
        dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
        rubric: rubric.filter((r) => r.criterion.trim().length > 0),
        attachments,
      };

      if (editingAssignmentId) {
        const updated = await updateCourseAssignment(editingAssignmentId, payload);
        setAssignments((prev) => prev.map((a) => (a._id === editingAssignmentId ? updated : a)));
        toast.success('Assignment updated successfully!');
      } else {
        const created = await createCourseAssignment(selectedCourseId, payload);
        setAssignments((prev) => [created, ...prev]);
        toast.success('Assignment created successfully!');
      }
      setShowAssignmentModal(false);
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Failed to save assignment'));
    } finally {
      setSavingAssignment(false);
    }
  };

  const handleDeleteAssignment = async (assignmentId: string) => {
    if (!window.confirm('Are you sure you want to delete this assignment and all student submissions?')) return;
    try {
      await deleteCourseAssignment(assignmentId);
      setAssignments((prev) => prev.filter((a) => a._id !== assignmentId));
      toast.success('Assignment deleted.');
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Failed to delete assignment'));
    }
  };

  // Open Grading Modal
  const openGradingModal = (submission: StudentSubmission) => {
    setSelectedSubmission(submission);
    setGradeScore(submission.score ?? (submission.assignment?.maxScore || 100));
    setGradeStatus(submission.status === 'under_review' ? 'graded' : submission.status);
    setInstructorFeedback(submission.feedback || '');

    // Init rubric points
    const defaultRubricScores = (submission.assignment?.rubric || []).map((r) => {
      const existing = submission.rubricScores?.find((s) => s.criterion === r.criterion);
      return {
        criterion: r.criterion,
        pointsEarned: existing ? existing.pointsEarned : r.maxPoints,
      };
    });
    setRubricScores(defaultRubricScores);
  };

  const handleRubricScoreChange = (index: number, points: number) => {
    const next = [...rubricScores];
    next[index].pointsEarned = points;
    setRubricScores(next);

    // Auto-sum total
    const total = next.reduce((sum, item) => sum + item.pointsEarned, 0);
    setGradeScore(total);
  };

  const handleSaveGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubmission) return;

    try {
      setSavingGrade(true);
      const updated = await gradeStudentSubmission(selectedSubmission._id, {
        score: Number(gradeScore),
        status: gradeStatus,
        feedback: instructorFeedback,
        rubricScores,
      });

      setSubmissions((prev) =>
        prev.map((sub) => (sub._id === selectedSubmission._id ? updated : sub))
      );
      setSelectedSubmission(null);
      toast.success('Submission graded successfully!');
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Failed to submit grade'));
    } finally {
      setSavingGrade(false);
    }
  };

  // Filter Submissions
  const filteredSubmissions = submissions.filter((sub) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const studentMatch = sub.student?.name?.toLowerCase().includes(q) || sub.student?.email?.toLowerCase().includes(q);
      const assignmentMatch = sub.assignment?.title?.toLowerCase().includes(q);
      if (!studentMatch && !assignmentMatch) return false;
    }
    return true;
  });

  const totalPending = assignments.reduce((acc, a) => acc + (a.pendingCount || 0), 0);
  const totalGraded = assignments.reduce((acc, a) => acc + (a.gradedCount || 0), 0);

  if (loadingCourses) {
    return (
      <div className="flex items-center justify-center min-h-[300px] text-slate-500 text-xs">
        Loading instructor courses...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner & View Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Assignments & Gradebook</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Create practical project briefs, evaluate student work with custom rubrics, and provide feedback.
          </p>
        </div>

        {/* View Toggle Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg self-start sm:self-auto border border-slate-200 dark:border-slate-750">
          <button
            onClick={() => setActiveView('assignments')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeView === 'assignments'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-2xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <ClipboardDocumentListIcon className="w-3.5 h-3.5" />
            <span>Assignment Manager</span>
          </button>
          <button
            onClick={() => setActiveView('gradebook')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeView === 'gradebook'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-2xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <DocumentCheckIcon className="w-3.5 h-3.5" />
            <span>Gradebook & Submissions</span>
            {totalPending > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
            )}
          </button>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-2xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-200 dark:border-blue-800">
            <ClipboardDocumentListIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Total Course Assignments</div>
            <div className="text-xl font-bold text-slate-900 dark:text-white">{assignments.length}</div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-2xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-200 dark:border-amber-800">
            <ClockIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Pending Reviews</div>
            <div className="text-xl font-bold text-amber-600 dark:text-amber-400">{totalPending}</div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-2xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-200 dark:border-emerald-800">
            <CheckCircleIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Total Graded Submissions</div>
            <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{totalGraded}</div>
          </div>
        </div>
      </div>

      {/* Course Selector Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 shrink-0">Select Course:</label>
          <select
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
            className="text-xs font-medium px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-850 text-slate-900 dark:text-white focus:ring-1 focus:ring-blue-500 focus:outline-none max-w-md w-full cursor-pointer"
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
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition-colors shadow-2xs flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
          >
            <span>+ Create Assignment</span>
          </button>
        )}
      </div>

      {/* VIEW 1: ASSIGNMENTS MANAGER */}
      {activeView === 'assignments' && (
        <div className="space-y-4">
          {loadingAssignments ? (
            <div className="text-slate-500 dark:text-slate-400 py-12 text-center text-xs">Loading course assignments...</div>
          ) : assignments.length === 0 ? (
            <div className="text-center py-12 px-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
              <div className="w-12 h-12 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center mx-auto mb-3 border border-blue-200 dark:border-blue-800">
                <FolderIcon className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">No assignments for this course</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
                Create practical project requirements with rubrics for your enrolled students.
              </p>
              <button
                onClick={openCreateModal}
                className="mt-4 px-3.5 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-500 transition-colors shadow-2xs cursor-pointer"
              >
                Create First Assignment
              </button>
            </div>
          ) : (
            <div className="grid gap-3.5">
              {assignments.map((assignment) => (
                <div
                  key={assignment._id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        {assignment.title}
                      </h3>
                      <span className="text-xs px-2 py-0.5 rounded-md font-semibold bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/50">
                        {assignment.maxScore} Max Points
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
                      {assignment.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400 pt-1">
                      <span><strong>{assignment.totalSubmissions || 0}</strong> Submissions</span>
                      <span className="text-amber-600 font-medium"><strong>{assignment.pendingCount || 0}</strong> Pending</span>
                      <span className="text-emerald-600 font-medium"><strong>{assignment.gradedCount || 0}</strong> Graded</span>
                      {assignment.dueDate && (
                        <span className="flex items-center gap-1">
                          <CalendarIcon className="w-3.5 h-3.5" />
                          <span>Due: {new Date(assignment.dueDate).toLocaleDateString()}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                    <button
                      onClick={() => openEditModal(assignment)}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteAssignment(assignment._id)}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
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
          <div className="flex flex-col sm:flex-row gap-2.5">
            <input
              type="text"
              placeholder="Search by student name or assignment..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-1 focus:ring-blue-500 focus:outline-none"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-1 focus:ring-blue-500 focus:outline-none cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="submitted">Pending Review</option>
              <option value="graded">Graded</option>
              <option value="resubmission_requested">Resubmission Requested</option>
            </select>
          </div>

          {loadingSubmissions ? (
            <div className="text-slate-500 dark:text-slate-400 py-12 text-center text-xs">Loading gradebook submissions...</div>
          ) : filteredSubmissions.length === 0 ? (
            <div className="text-center py-12 px-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">No submissions match the filter</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Student submissions will show up here once turned in.</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                  <thead className="bg-slate-50 dark:bg-slate-850 text-slate-700 dark:text-slate-200 font-semibold border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="px-4 py-3">Student</th>
                      <th className="px-4 py-3">Assignment</th>
                      <th className="px-4 py-3">Submitted</th>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3">Status / Score</th>
                      <th className="px-4 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredSubmissions.map((sub) => (
                      <tr key={sub._id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <div className="font-semibold text-slate-900 dark:text-white">{sub.student?.name}</div>
                          <div className="text-[11px] text-slate-400">{sub.student?.email}</div>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="font-medium text-slate-900 dark:text-white max-w-xs truncate">{sub.assignment?.title}</div>
                          <div className="text-[11px] text-slate-400 max-w-xs truncate">{sub.course?.title}</div>
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap text-[11px]">
                          {new Date(sub.submittedAt).toLocaleString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-medium text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 capitalize border border-slate-200 dark:border-slate-700">
                            {sub.submissionType === 'file' && <FolderIcon className="w-3 h-3 text-blue-500" />}
                            {sub.submissionType === 'link' && <LinkIcon className="w-3 h-3 text-blue-500" />}
                            {sub.submissionType === 'text' && <DocumentTextIcon className="w-3 h-3 text-blue-500" />}
                            <span>{sub.submissionType === 'file' ? 'File' : sub.submissionType === 'link' ? 'URL' : 'Text'}</span>
                          </span>
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          {sub.status === 'graded' ? (
                            <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
                              <CheckCircleIcon className="w-3.5 h-3.5" />
                              <span>{sub.score} / {sub.assignment?.maxScore || 100} pts</span>
                            </span>
                          ) : sub.status === 'resubmission_requested' ? (
                            <span className="text-rose-600 font-medium">Resubmission Req.</span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-amber-600 font-medium">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                              <span>Pending Review</span>
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-right whitespace-nowrap">
                          <button
                            onClick={() => openGradingModal(sub)}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold text-xs transition-colors shadow-2xs cursor-pointer"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editingAssignmentId ? 'Edit Assignment' : 'Create Course Assignment'}
              </h3>
              <button
                onClick={() => setShowAssignmentModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-md cursor-pointer"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAssignment} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Assignment Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Build a Responsive E-Commerce Cart Component"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-850 text-slate-900 dark:text-white focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Short Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Brief summary of the goals and deliverables..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-855 text-slate-900 dark:text-white focus:ring-1 focus:ring-blue-500 focus:outline-none resize-none font-sans"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Detailed Instructions & Guidelines
                </label>
                <textarea
                  rows={3}
                  placeholder="Step-by-step instructions, submission format requirements, edge cases to handle..."
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-850 text-slate-900 dark:text-white focus:ring-1 focus:ring-blue-500 focus:outline-none resize-none font-sans"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Max Score / Points
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={maxScore}
                    onChange={(e) => setMaxScore(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-850 text-slate-900 dark:text-white focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Due Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-850 text-slate-900 dark:text-white focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Rubric Builder */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Grading Rubric Criteria
                  </label>
                  <button
                    type="button"
                    onClick={handleAddRubricCriterion}
                    className="text-blue-600 dark:text-blue-400 font-semibold hover:underline cursor-pointer"
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
                        className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-850 text-slate-900 dark:text-white"
                      />
                      <input
                        type="number"
                        min={1}
                        placeholder="Pts"
                        value={r.maxPoints}
                        onChange={(e) => handleUpdateRubric(index, 'maxPoints', Number(e.target.value))}
                        className="w-20 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-850 text-slate-900 dark:text-white"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveRubric(index)}
                        className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer"
                      >
                        <XMarkIcon className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Starter File Attachment */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
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
                      <div key={i} className="flex items-center justify-between text-[11px] bg-slate-50 dark:bg-slate-850 p-2 rounded-lg border border-slate-200 dark:border-slate-750">
                        <span className="truncate">{att.name}</span>
                        <button
                          type="button"
                          onClick={() => setAttachments(attachments.filter((_, idx) => idx !== i))}
                          className="text-rose-500 cursor-pointer p-0.5"
                        >
                          <XMarkIcon className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAssignmentModal(false)}
                  className="px-3.5 py-1.5 font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingAssignment}
                  className="px-4 py-1.5 font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg disabled:opacity-50 shadow-2xs cursor-pointer"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Grade Submission</span>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {selectedSubmission.assignment?.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedSubmission(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-md cursor-pointer"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Student Info & Submission Material */}
            <div className="bg-slate-50 dark:bg-slate-850 p-3.5 rounded-lg space-y-2.5 text-xs border border-slate-200 dark:border-slate-750">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <strong className="text-slate-900 dark:text-white">{selectedSubmission.student?.name}</strong>
                  <span className="text-slate-500 dark:text-slate-400 ml-1.5">({selectedSubmission.student?.email})</span>
                </div>
                <span className="text-[11px] text-slate-400">
                  Submitted: {new Date(selectedSubmission.submittedAt).toLocaleString()}
                </span>
              </div>

              {selectedSubmission.studentNote && (
                <div className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-750">
                  <span className="text-[10px] font-semibold text-slate-400 block mb-0.5">Student Note:</span>
                  <p className="italic text-slate-700 dark:text-slate-300">{selectedSubmission.studentNote}</p>
                </div>
              )}

              {/* Submitted file / link download */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-750 flex items-center gap-2.5 flex-wrap">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Deliverable:</span>
                {selectedSubmission.fileUrl && (
                  <a
                    href={selectedSubmission.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-500 transition-colors flex items-center gap-1 text-xs cursor-pointer shadow-2xs"
                  >
                    <ArrowDownTrayIcon className="w-3.5 h-3.5" />
                    <span>Download File</span>
                  </a>
                )}
                {selectedSubmission.externalLink && (
                  <a
                    href={selectedSubmission.externalLink}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 rounded-lg font-semibold border border-blue-200 dark:border-blue-800 hover:underline flex items-center gap-1 text-xs"
                  >
                    <LinkIcon className="w-3.5 h-3.5" />
                    <span>Open Project URL</span>
                  </a>
                )}
              </div>
            </div>

            {/* Grading Form */}
            <form onSubmit={handleSaveGrade} className="space-y-3.5 text-xs">
              {/* Rubric Evaluation */}
              {rubricScores.length > 0 && (
                <div className="space-y-2">
                  <label className="font-bold text-slate-700 dark:text-slate-300 block">
                    Rubric Scoring
                  </label>
                  <div className="space-y-1.5">
                    {rubricScores.map((r, i) => (
                      <div key={i} className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850">
                        <span className="font-medium text-slate-800 dark:text-slate-200">{r.criterion}</span>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            min={0}
                            value={r.pointsEarned}
                            onChange={(e) => handleRubricScoreChange(i, Number(e.target.value))}
                            className="w-16 px-2 py-1 rounded-md border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-right font-bold text-blue-600 dark:text-blue-400"
                          />
                          <span className="text-slate-400 text-[11px]">pts</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Total Score ({selectedSubmission.assignment?.maxScore || 100} max)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={gradeScore}
                    onChange={(e) => setGradeScore(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-850 text-slate-900 dark:text-white font-bold text-sm focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Submission Status
                  </label>
                  <select
                    value={gradeStatus}
                    onChange={(e) => setGradeStatus(e.target.value as 'under_review' | 'graded' | 'resubmission_requested')}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-850 text-slate-900 dark:text-white font-medium focus:ring-1 focus:ring-blue-500 focus:outline-none cursor-pointer"
                  >
                    <option value="graded">Graded & Accepted</option>
                    <option value="under_review">Under Review</option>
                    <option value="resubmission_requested">Request Resubmission</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Instructor Feedback & Guidance
                </label>
                <textarea
                  rows={3}
                  value={instructorFeedback}
                  onChange={(e) => setInstructorFeedback(e.target.value)}
                  placeholder="Give constructive feedback on what the student did well and what could be improved..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-850 text-slate-900 dark:text-white focus:ring-1 focus:ring-blue-500 focus:outline-none resize-none font-sans"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedSubmission(null)}
                  className="px-3.5 py-1.5 font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingGrade}
                  className="px-4 py-1.5 font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg disabled:opacity-50 shadow-2xs cursor-pointer"
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
