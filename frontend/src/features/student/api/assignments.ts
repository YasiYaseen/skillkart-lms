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

export interface AssignmentSubmission {
  _id: string;
  assignment: string;
  course: string;
  student: string | { _id: string; name: string; email: string; avatar?: string };
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

export interface AssignmentItem {
  _id: string;
  course: string;
  section?: string;
  title: string;
  description: string;
  instructions?: string;
  rubric: RubricCriterion[];
  maxScore: number;
  dueDate?: string;
  attachments: Attachment[];
  mySubmission?: AssignmentSubmission | null;
  createdAt: string;
  updatedAt: string;
}

export async function fetchCourseAssignments(courseId: string): Promise<AssignmentItem[]> {
  const res = await api.get(`/assignments/course/${courseId}`);
  return res.data.assignments || [];
}

export async function submitStudentAssignment(
  assignmentId: string,
  payload: {
    submissionType: 'file' | 'link' | 'text';
    fileUrl?: string;
    fileName?: string;
    externalLink?: string;
    studentNote?: string;
  }
): Promise<AssignmentSubmission> {
  const res = await api.post(`/assignments/${assignmentId}/submit`, payload);
  return res.data.submission;
}
