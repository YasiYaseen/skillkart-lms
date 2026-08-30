import { api } from '@/lib/api';

export interface CommentUser {
  _id: string;
  name: string;
  role: 'student' | 'instructor' | 'admin';
  avatar?: string;
}

export interface LessonComment {
  _id: string;
  lesson: string;
  course: string;
  user: CommentUser;
  content: string;
  parentComment?: string | null;
  createdAt: string;
  updatedAt: string;
}

export async function fetchLessonComments(lessonId: string): Promise<LessonComment[]> {
  const res = await api.get(`/lessons/${lessonId}/comments`);
  return res.data.comments as LessonComment[];
}

export async function createLessonComment(
  lessonId: string,
  data: { content: string; parentCommentId?: string | null }
): Promise<LessonComment> {
  const res = await api.post(`/lessons/${lessonId}/comments`, data);
  return res.data.comment as LessonComment;
}

export async function deleteLessonComment(
  lessonId: string,
  commentId: string
): Promise<void> {
  await api.delete(`/lessons/${lessonId}/comments/${commentId}`);
}
