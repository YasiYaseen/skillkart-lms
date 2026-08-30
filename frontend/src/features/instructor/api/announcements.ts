import { api } from '@/lib/api';

export interface Announcement {
  _id: string;
  course: string;
  instructor: string;
  title: string;
  body: string;
  createdAt: string;
  updatedAt: string;
}

export async function fetchAnnouncements(courseId: string): Promise<Announcement[]> {
  const res = await api.get(`/courses/${courseId}/announcements`);
  return res.data.announcements as Announcement[];
}

export async function createAnnouncement(
  courseId: string,
  data: { title: string; body: string }
): Promise<Announcement> {
  const res = await api.post(`/courses/${courseId}/announcements`, data);
  return res.data.announcement as Announcement;
}

export async function deleteAnnouncement(
  courseId: string,
  announcementId: string
): Promise<void> {
  await api.delete(`/courses/${courseId}/announcements/${announcementId}`);
}
