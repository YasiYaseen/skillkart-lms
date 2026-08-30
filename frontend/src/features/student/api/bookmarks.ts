import { api } from '@/lib/api';

export interface BookmarkItem {
  _id: string;
  user: string;
  course: string | { _id: string; title: string; thumbnail?: string };
  lesson: {
    _id: string;
    title: string;
    order: number;
    section?: string;
    durationMinutes?: number;
    type?: string;
    isPreview?: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

export async function fetchLessonBookmarkStatus(lessonId: string): Promise<boolean> {
  const res = await api.get(`/lessons/${lessonId}/bookmark`);
  return Boolean(res.data.bookmarked);
}

export async function toggleLessonBookmark(
  lessonId: string
): Promise<{ bookmarked: boolean; message: string; bookmark?: BookmarkItem }> {
  const res = await api.post(`/lessons/${lessonId}/bookmark`);
  return res.data;
}

export async function fetchCourseBookmarks(courseId: string): Promise<BookmarkItem[]> {
  const res = await api.get(`/me/courses/${courseId}/bookmarks`);
  return res.data.bookmarks || [];
}

export async function fetchAllUserBookmarks(): Promise<BookmarkItem[]> {
  const res = await api.get('/me/bookmarks');
  return res.data.bookmarks || [];
}
