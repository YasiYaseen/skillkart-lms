import { api } from '@/lib/api';

export interface RubricCriterion {
  criterion: string;
  maxPoints: number;
}

export interface RubricScore {
  criterion: string;
  pointsEarned: number;
}

export interface Attachment {
  name: string;
  url: string;
}

export interface InstructorAssignment {
  _id: string;
  course: string | { _id: string; title: string };
  section?: string;
  title: string;
  description: string;
  instructions?: string;
  rubric: RubricCriterion[];
  maxScore: number;
  dueDate?: string;
  attachments: Attachment[];
  totalSubmissions?: number;
  pendingCount?: number;
  gradedCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface StudentSubmission {
  _id: string;
  assignment: {
    _id: string;
    title: string;
    maxScore: number;
    rubric?: RubricCriterion[];
    dueDate?: string;
  };
  course: {
    _id: string;
    title: string;
  };
  student: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  submissionType: 'file' | 'link' | 'text';
  fileUrl?: string;
  fileName?: string;
  externalLink?: string;
  studentNote?: string;
  status: 'submitted' | 'under_review' | 'graded' | 'resubmission_requested';
  score?: number;
  rubricScores: RubricScore[];
  instructorFeedback?: string;
  submittedAt: string;
  gradedAt?: string;
}

export async function fetchInstructorCourseAssignments(courseId: string): Promise<InstructorAssignment[]> {
  const res = await api.get(`/assignments/course/${courseId}`);
  return res.data.assignments || [];
}

export async function createCourseAssignment(
  courseId: string,
  payload: {
    title: string;
    description: string;
    instructions?: string;
    rubric?: RubricCriterion[];
    maxScore: number;
    dueDate?: string | null;
    attachments?: Attachment[];
  }
): Promise<InstructorAssignment> {
  const res = await api.post(`/assignments/course/${courseId}`, payload);
  return res.data.assignment;
}

export async function updateCourseAssignment(
  assignmentId: string,
  payload: Partial<{
    title: string;
    description: string;
    instructions?: string;
    rubric?: RubricCriterion[];
    maxScore: number;
    dueDate?: string | null;
    attachments?: Attachment[];
  }>
): Promise<InstructorAssignment> {
  const res = await api.put(`/assignments/${assignmentId}`, payload);
  return res.data.assignment;
}

export async function deleteCourseAssignment(assignmentId: string): Promise<void> {
  await api.delete(`/assignments/${assignmentId}`);
}

export async function fetchInstructorSubmissions(params?: {
  courseId?: string;
  assignmentId?: string;
  status?: string;
}): Promise<StudentSubmission[]> {
  const res = await api.get('/assignments/instructor/submissions', { params });
  return res.data.submissions || [];
}

export async function gradeStudentSubmission(
  submissionId: string,
  payload: {
    score: number;
    status: 'under_review' | 'graded' | 'resubmission_requested';
    rubricScores?: RubricScore[];
    instructorFeedback?: string;
  }
): Promise<StudentSubmission> {
  const res = await api.put(`/assignments/submissions/${submissionId}/grade`, payload);
  return res.data.submission;
}
