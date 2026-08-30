import { useState, useEffect } from 'react';
import {
  fetchInstructorAnalytics,
  type InstructorAnalyticsResponse,
} from '../api/analytics';
import { toast } from 'react-toastify';
import { useCurrency } from '@/context/CurrencyContext';

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
      <div className="py-12 space-y-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded-md w-64 mb-6"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-32 bg-gray-100 dark:bg-gray-800 rounded-2xl"></div>
          ))}
        </div>
        <div className="h-64 bg-gray-100 dark:bg-gray-800 rounded-2xl mt-8"></div>
      </div>
    );
  }

  const summary = data?.summary;
  const courses = data?.courses || [];
  const lessonDropOff = data?.lessonDropOff || [];
  const mostActiveStudents = data?.mostActiveStudents || [];
  const quizPerformance = data?.quizPerformance || [];

  return (
    <div className="space-y-8">
      {/* Top Header & Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Advanced Analytics</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Deep insights into course completions, quiz performance, active learners, and drop-off rates.
          </p>
        </div>

        {courses.length > 0 && (
          <div className="flex items-center gap-3">
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Filter Course:
            </label>
            <select
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-2 text-sm text-gray-800 dark:text-gray-200 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs"
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
        <div className="text-center py-20 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-8 max-w-lg mx-auto">
          <div className="w-16 h-16 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl">
            📊
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No Course Analytics Yet</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
            Create and publish courses to start seeing in-depth analytics, completion funnels, and student progress metrics.
          </p>
        </div>
      ) : (
        <>
          {/* Key Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* 1. Course Completion Rate */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Completion Rate
                </span>
                <span className="p-2 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-xl text-lg">
                  🎓
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-gray-900 dark:text-white">
                  {summary?.completionRate || 0}%
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                  ({summary?.completedEnrollments || 0} finished)
                </span>
              </div>
              {/* Progress visual */}
              <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2 mt-4 overflow-hidden">
                <div
                  className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${summary?.completionRate || 0}%` }}
                ></div>
              </div>
            </div>

            {/* 2. Average Quiz Score */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Avg Quiz Score
                </span>
                <span className="p-2 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-xl text-lg">
                  📝
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-gray-900 dark:text-white">
                  {summary?.averageQuizScore || 0}%
                </span>
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
                  {summary?.quizPassRate || 0}% pass rate
                </span>
              </div>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-4">
                Across {summary?.totalQuizAttempts || 0} total attempts
              </p>
            </div>

            {/* 3. Total Enrollments */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Total Students
                </span>
                <span className="p-2 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-xl text-lg">
                  👥
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-gray-900 dark:text-white">
                  {summary?.totalEnrollments || 0}
                </span>
                <span className="text-xs text-blue-600 dark:text-blue-400 font-medium bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-full">
                  {summary?.activeEnrollments || 0} in-progress
                </span>
              </div>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-4">
                {summary?.totalCourses || 0} active courses
              </p>
            </div>

            {/* 4. Total Earnings */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Total Revenue
                </span>
                <span className="p-2 bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 rounded-xl text-lg">
                  💰
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-gray-900 dark:text-white">
                  {formatAmount(summary?.totalEarnings || 0)}
                </span>
              </div>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-4">
                Gross course enrollment value
              </p>
            </div>
          </div>

          {/* Section: Lesson Drop-Off & Retention Analysis */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 sm:p-8 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-gray-100 dark:border-gray-800">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <span>📉 Lesson Drop-Off & Retention Tracking</span>
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Track how far enrolled students progress and discover which lessons cause the highest drop-offs.
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs font-medium">
                <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span> Completed
                </span>
                <span className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400">
                  <span className="w-3 h-3 rounded-full bg-rose-400 inline-block"></span> Drop-Off
                </span>
              </div>
            </div>

            {lessonDropOff.length === 0 ? (
              <div className="py-12 text-center text-gray-400 dark:text-gray-500 text-sm">
                No lesson data available to compute drop-off metrics yet.
              </div>
            ) : (
              <div className="space-y-4">
                {lessonDropOff.map((les) => {
                  const isHighDropOff = les.dropOffRate >= 50 && (summary?.totalEnrollments || 0) > 2;

                  return (
                    <div
                      key={les.lessonId}
                      className="bg-gray-50/70 dark:bg-gray-800/50 border border-gray-200/70 dark:border-gray-700/60 rounded-xl p-4 transition-all hover:bg-gray-50 dark:hover:bg-gray-800/80"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-bold flex items-center justify-center">
                            {les.order}
                          </span>
                          <span className="font-semibold text-sm text-gray-900 dark:text-white">
                            {les.title}
                          </span>
                          <span className="text-[11px] uppercase font-bold text-gray-400 dark:text-gray-500 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 px-2 py-0.5 rounded-md">
                            {les.type}
                          </span>
                          {isHighDropOff && (
                            <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                              ⚠️ High Drop-Off
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400">
                          <span>
                            <strong>{les.completedCount}</strong> / {summary?.totalEnrollments || 0} completed (
                            <span className="font-bold text-emerald-600 dark:text-emerald-400">{les.completionRate}%</span>)
                          </span>
                          {les.lastAccessedCount > 0 && (
                            <span className="text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-md font-medium">
                              {les.lastAccessedCount} currently here
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Funnel Progress Bar */}
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 flex overflow-hidden">
                        <div
                          className="bg-emerald-500 h-full transition-all duration-500"
                          style={{ width: `${les.completionRate}%` }}
                          title={`Completed: ${les.completionRate}%`}
                        ></div>
                        <div
                          className="bg-rose-400/80 h-full transition-all duration-500"
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Quiz Performance Breakdown */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 sm:p-8 shadow-xs flex flex-col justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
                  <span>📝 Quiz & Assessment Performance</span>
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-6">
                  Average student score and pass rate by quiz lesson.
                </p>

                {quizPerformance.length === 0 ? (
                  <div className="py-12 text-center text-gray-400 dark:text-gray-500 text-sm">
                    No quizzes found in the selected course(s).
                  </div>
                ) : (
                  <div className="space-y-3">
                    {quizPerformance.map((q) => (
                      <div
                        key={q.lessonId}
                        className="bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700/60 rounded-xl p-4 flex items-center justify-between gap-4"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-sm text-gray-900 dark:text-white truncate">
                            {q.title}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            {q.attemptsCount} student {q.attemptsCount === 1 ? 'attempt' : 'attempts'}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-base font-extrabold text-gray-900 dark:text-white">
                            {q.averageScore}%
                          </p>
                          <span
                            className={`text-[11px] font-bold px-2 py-0.5 rounded-full inline-block ${
                              q.passRate >= 70
                                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                                : 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400'
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
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 sm:p-8 shadow-xs flex flex-col justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
                  <span>🏆 Most Active Students</span>
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-6">
                  Learners with the highest lesson completion and engagement in your courses.
                </p>

                {mostActiveStudents.length === 0 ? (
                  <div className="py-12 text-center text-gray-400 dark:text-gray-500 text-sm">
                    No active student activity recorded yet.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {mostActiveStudents.map((student, rank) => {
                      const avatar =
                        student.avatar ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(
                          student.name
                        )}&background=random`;

                      return (
                        <div
                          key={student.id}
                          className="bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700/60 rounded-xl p-3 sm:p-4 flex items-center justify-between gap-3 hover:bg-gray-100/70 dark:hover:bg-gray-800/90 transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span
                              className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center shrink-0 ${
                                rank === 0
                                  ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400'
                                  : rank === 1
                                  ? 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                                  : rank === 2
                                  ? 'bg-amber-200/60 dark:bg-amber-950/40 text-amber-800 dark:text-amber-400'
                                  : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                              }`}
                            >
                              {rank + 1}
                            </span>
                            <img
                              src={avatar}
                              alt={student.name}
                              className="w-9 h-9 rounded-full object-cover border border-gray-200 dark:border-gray-700 shrink-0"
                            />
                            <div className="min-w-0">
                              <p className="font-semibold text-sm text-gray-900 dark:text-white truncate">
                                {student.name}
                              </p>
                              <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{student.email}</p>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <p className="text-xs font-bold text-blue-600 dark:text-blue-400">
                              {student.totalCompletedLessons} lessons completed
                            </p>
                            <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">
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
