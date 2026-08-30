import { api } from '@/lib/api';

export interface NoteItem {
  _id: string;
  user: string;
  course: string | { _id: string; title: string; thumbnail?: string };
  lesson: string | { _id: string; title: string; order: number; section?: string; type?: string };
  content: string;
  createdAt: string;
  updatedAt: string;
}

export async function fetchLessonNotes(lessonId: string): Promise<NoteItem[]> {
  const res = await api.get(`/lessons/${lessonId}/notes`);
  return res.data.notes || [];
}

export async function createLessonNote(lessonId: string, content: string): Promise<NoteItem> {
  const res = await api.post(`/lessons/${lessonId}/notes`, { content });
  return res.data.note;
}

export async function updateNote(noteId: string, content: string): Promise<NoteItem> {
  const res = await api.patch(`/notes/${noteId}`, { content });
  return res.data.note;
}

export async function deleteNote(noteId: string): Promise<void> {
  await api.delete(`/notes/${noteId}`);
}

export async function fetchCourseNotes(courseId: string): Promise<NoteItem[]> {
  const res = await api.get(`/me/courses/${courseId}/notes`);
  return res.data.notes || [];
}

export async function fetchAllUserNotes(): Promise<NoteItem[]> {
  const res = await api.get('/me/notes');
  return res.data.notes || [];
}
