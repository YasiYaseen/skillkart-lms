import { api } from '@/lib/api';

export interface AnalyticsSummary {
  totalCourses: number;
  totalEnrollments: number;
  activeEnrollments: number;
  completedEnrollments: number;
  completionRate: number;
  totalEarnings: number;
  averageQuizScore: number;
  totalQuizAttempts: number;
  quizPassRate: number;
}

export interface CourseOption {
  _id: string;
  title: string;
}

export interface CoursePerformance {
  courseId: string;
  title: string;
  status: string;
  price: number | null;
  level: string;
  thumbnailUrl?: string;
  totalEnrollments: number;
  activeEnrollments: number;
  completedEnrollments: number;
  completionRate: number;
  earnings: number;
}

export interface ActiveStudent {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  totalCompletedLessons: number;
  totalEnrolledCourses: number;
  completedCoursesCount: number;
  averageProgressPercentage: number;
  lastActivity: string;
}

export interface LessonDropOff {
  lessonId: string;
  order: number;
  title: string;
  type: string;
  completedCount: number;
  lastAccessedCount: number;
  completionRate: number;
  dropOffCount: number;
  dropOffRate: number;
}

export interface QuizPerformanceItem {
  lessonId: string;
  title: string;
  attemptsCount: number;
  averageScore: number;
  passRate: number;
}

export interface InstructorAnalyticsResponse {
  summary: AnalyticsSummary;
  courses: CourseOption[];
  coursePerformance: CoursePerformance[];
  mostActiveStudents: ActiveStudent[];
  lessonDropOff: LessonDropOff[];
  quizPerformance: QuizPerformanceItem[];
}

export async function fetchInstructorAnalytics(
  courseId?: string
): Promise<InstructorAnalyticsResponse> {
  const url = courseId ? `/instructor/analytics?courseId=${courseId}` : '/instructor/analytics';
  const res = await api.get(url);
  return res.data as InstructorAnalyticsResponse;
}
