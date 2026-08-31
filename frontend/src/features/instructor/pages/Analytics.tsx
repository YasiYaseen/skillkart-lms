import { useState, useEffect } from 'react';
import {
  fetchInstructorAnalytics,
  type InstructorAnalyticsResponse,
} from '../api/analytics';
import { toast } from 'react-toastify';
import { useCurrency } from '@/context/CurrencyContext';
import {
  ChartBarIcon,
  AcademicCapIcon,
  ClipboardDocumentCheckIcon,
  UserGroupIcon,
  BanknotesIcon,
  ArrowTrendingDownIcon,
  TrophyIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/20/solid';

function Analytics() {
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [data, setData] = useState<InstructorAnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const { formatAmount } = useCurrency();

  const loadAnalytics = async (courseId?: string) => {
    try {
      setLoading(true);
      const res = await fetchInstructorAnalytics(courseId || undefined);
      setData(res);
    } catch {
      toast.error('Failed to load instructor analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics(selectedCourseId);
  }, [selectedCourseId]);

  if (loading && !data) {
    return (
      <div className="py-12 space-y-4 animate-pulse max-w-6xl mx-auto">
        <div className="h-7 bg-slate-200 dark:bg-slate-700 rounded-md w-64 mb-6"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-28 bg-slate-100 dark:bg-slate-800 rounded-xl"></div>
          ))}
        </div>
        <div className="h-64 bg-slate-100 dark:bg-slate-800 rounded-xl mt-6"></div>
      </div>
    );
  }

  const summary = data?.summary;
  const courses = data?.courses || [];
  const lessonDropOff = data?.lessonDropOff || [];
  const quizPerformance = data?.quizPerformance || [];
  const mostActiveStudents = data?.mostActiveStudents || [];

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Header & Course Filter Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ChartBarIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            Instructor Performance Analytics
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Monitor course retention rates, drop-off hotspots, quiz outcomes, and top learner engagement.
          </p>
        </div>

        {courses.length > 0 && (
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              Filter Course:
            </label>
            <select
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className="text-xs px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-850 text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-blue-500 max-w-xs"
            >
              <option value="">All Courses ({courses.length})</option>
              {courses.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {courses.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 max-w-lg mx-auto shadow-2xs space-y-3">
          <div className="w-12 h-12 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mx-auto">
            <ChartBarIcon className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">No Course Analytics Yet</h2>
          <p className="text-slate-500 dark:text-slate-400 text-xs">
            Create and publish courses to start seeing in-depth analytics, completion funnels, and student progress metrics.
          </p>
        </div>
      ) : (
        <>
          {/* Key Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Course Completion Rate */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-2xs relative overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Completion Rate
                </span>
                <span className="p-1.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-lg">
                  <AcademicCapIcon className="w-4 h-4" />
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-slate-900 dark:text-white">
                  {summary?.completionRate || 0}%
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  ({summary?.completedEnrollments || 0} finished)
                </span>
              </div>
              {/* Progress visual */}
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 mt-3 overflow-hidden">
                <div
                  className="bg-emerald-600 h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${summary?.completionRate || 0}%` }}
                ></div>
              </div>
            </div>

            {/* 2. Average Quiz Score */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-2xs relative overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Avg Quiz Score
                </span>
                <span className="p-1.5 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-lg">
                  <ClipboardDocumentCheckIcon className="w-4 h-4" />
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-slate-900 dark:text-white">
                  {summary?.averageQuizScore || 0}%
                </span>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded">
                  {summary?.quizPassRate || 0}% pass rate
                </span>
              </div>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-3">
                Across {summary?.totalQuizAttempts || 0} total attempts
              </p>
            </div>

            {/* 3. Total Enrollments */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-2xs relative overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Total Students
                </span>
                <span className="p-1.5 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-lg">
                  <UserGroupIcon className="w-4 h-4" />
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-slate-900 dark:text-white">
                  {summary?.totalEnrollments || 0}
                </span>
                <span className="text-[11px] text-blue-600 dark:text-blue-400 font-medium bg-blue-50 dark:bg-blue-950/60 px-1.5 py-0.5 rounded">
                  {summary?.activeEnrollments || 0} in-progress
                </span>
              </div>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-3">
                {summary?.totalCourses || 0} active courses
              </p>
            </div>

            {/* 4. Total Earnings */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-2xs relative overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Total Revenue
                </span>
                <span className="p-1.5 bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 rounded-lg">
                  <BanknotesIcon className="w-4 h-4" />
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-slate-900 dark:text-white">
                  {formatAmount(summary?.totalEarnings || 0)}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-3">
                Gross course enrollment value
              </p>
            </div>
          </div>

          {/* Section: Lesson Drop-Off & Retention Analysis */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 sm:p-6 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <ArrowTrendingDownIcon className="w-4 h-4 text-blue-600" />
                  <span>Lesson Drop-Off & Retention Tracking</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Track how far enrolled students progress and discover which lessons cause the highest drop-offs.
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs font-medium">
                <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block"></span> Completed
                </span>
                <span className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span> Drop-Off
                </span>
              </div>
            </div>

            {lessonDropOff.length === 0 ? (
              <div className="py-10 text-center text-slate-400 dark:text-slate-500 text-xs">
                No lesson data available to compute drop-off metrics yet.
              </div>
            ) : (
              <div className="space-y-3">
                {lessonDropOff.map((les) => {
                  const isHighDropOff = les.dropOffRate >= 50 && (summary?.totalEnrollments || 0) > 2;

                  return (
                    <div
                      key={les.lessonId}
                      className="bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-750 rounded-lg p-3.5 transition-colors hover:bg-slate-100/70"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-bold flex items-center justify-center">
                            {les.order}
                          </span>
                          <span className="font-semibold text-xs text-slate-900 dark:text-white">
                            {les.title}
                          </span>
                          <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-1.5 py-0.5 rounded">
                            {les.type}
                          </span>
                          {isHighDropOff && (
                            <span className="text-[10px] font-bold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 px-1.5 py-0.5 rounded-md flex items-center gap-1">
                              <ExclamationTriangleIcon className="w-3 h-3 text-rose-500" />
                              <span>High Drop-Off</span>
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-[11px] text-slate-600 dark:text-slate-400">
                          <span>
                            <strong>{les.completedCount}</strong> / {summary?.totalEnrollments || 0} completed (
                            <span className="font-bold text-emerald-600 dark:text-emerald-400">{les.completionRate}%</span>)
                          </span>
                          {les.lastAccessedCount > 0 && (
                            <span className="text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-1.5 py-0.5 rounded font-medium">
                              {les.lastAccessedCount} currently here
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Funnel Progress Bar */}
                      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 flex overflow-hidden">
                        <div
                          className="bg-emerald-600 h-full transition-all duration-500"
                          style={{ width: `${les.completionRate}%` }}
                          title={`Completed: ${les.completionRate}%`}
                        ></div>
                        <div
                          className="bg-rose-500/80 h-full transition-all duration-500"
                          style={{ width: `${les.dropOffRate}%` }}
                          title={`Drop-off: ${les.dropOffRate}%`}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section: Quiz Performance & Most Active Students Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Quiz Performance Breakdown */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 sm:p-6 shadow-2xs flex flex-col justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-0.5 flex items-center gap-1.5">
                  <ClipboardDocumentCheckIcon className="w-4 h-4 text-blue-600" />
                  <span>Quiz & Assessment Performance</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                  Average student score and pass rate by quiz lesson.
                </p>

                {quizPerformance.length === 0 ? (
                  <div className="py-10 text-center text-slate-400 dark:text-slate-500 text-xs">
                    No quizzes found in the selected course(s).
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {quizPerformance.map((q) => (
                      <div
                        key={q.lessonId}
                        className="bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-750 rounded-lg p-3 flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-xs text-slate-900 dark:text-white truncate">
                            {q.title}
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            {q.attemptsCount} student {q.attemptsCount === 1 ? 'attempt' : 'attempts'}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-bold text-slate-900 dark:text-white">
                            {q.averageScore}%
                          </p>
                          <span
                            className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${
                              q.passRate >= 70
                                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                                : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                            }`}
                          >
                            {q.passRate}% pass rate
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Most Active Students Leaderboard */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 sm:p-6 shadow-2xs flex flex-col justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-0.5 flex items-center gap-1.5">
                  <TrophyIcon className="w-4 h-4 text-amber-500" />
                  <span>Most Active Students</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                  Learners with the highest lesson completion and engagement in your courses.
                </p>

                {mostActiveStudents.length === 0 ? (
                  <div className="py-10 text-center text-slate-400 dark:text-slate-500 text-xs">
                    No active student activity recorded yet.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {mostActiveStudents.map((student, rank) => {
                      const avatar =
                        student.avatar ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(
                          student.name
                        )}&background=random`;

                      return (
                        <div
                          key={student.id}
                          className="bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-750 rounded-lg p-2.5 sm:p-3 flex items-center justify-between gap-3 transition-colors hover:bg-slate-100/70"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span
                              className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0 ${
                                rank === 0
                                  ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-300'
                                  : rank === 1
                                  ? 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300'
                                  : rank === 2
                                  ? 'bg-amber-100/60 dark:bg-amber-950/40 text-amber-800 dark:text-amber-400 border border-amber-200'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                              }`}
                            >
                              {rank + 1}
                            </span>
                            <img
                              src={avatar}
                              alt={student.name}
                              className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                            />
                            <div className="min-w-0">
                              <p className="font-semibold text-xs text-slate-900 dark:text-white truncate">
                                {student.name}
                              </p>
                              <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate">{student.email}</p>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <p className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                              {student.totalCompletedLessons} lessons
                            </p>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                              Avg {student.averageProgressPercentage}% progress
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default Analytics;
