import { useEffect, useState } from "react";
import { FireIcon, TrophyIcon, CheckCircleIcon } from "@heroicons/react/24/solid";
import { api } from "@/lib/api";

interface DayActivity {
  date: string;
  dayName: string;
  isActive: boolean;
}

interface StreakData {
  currentStreak: number;
  longestStreak: number;
  isActiveToday: boolean;
  totalActiveDays: number;
  past7Days: DayActivity[];
}

export default function LearningStreakCard() {
  const [streak, setStreak] = useState<StreakData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStreak() {
      try {
        setLoading(true);
        const res = await api.get("/me/streak");
        setStreak(res.data);
      } catch (err) {
        console.error("Failed to load streak:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchStreak();
  }, []);

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 animate-pulse">
        <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
        <div className="h-10 bg-gray-100 dark:bg-gray-750 rounded-xl"></div>
      </div>
    );
  }

  if (!streak) return null;

  const { currentStreak, longestStreak, isActiveToday, past7Days } = streak;

  let motivationMessage = "Start learning today to build your streak!";
  if (currentStreak >= 30) {
    motivationMessage = "🏆 Legendary dedication! A month-long streak!";
  } else if (currentStreak >= 7) {
    motivationMessage = "🔥 Incredible work! Over a week in a row!";
  } else if (currentStreak >= 3) {
    motivationMessage = "⚡ Great momentum! Keep the daily habit alive!";
  } else if (currentStreak >= 1) {
    motivationMessage = "✨ Nice job today! Keep going tomorrow!";
  }

  return (
    <div className="bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent dark:from-amber-950/20 dark:via-orange-950/10 bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-amber-200/60 dark:border-amber-900/40">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left Side: Streak Count & Motivation */}
        <div className="flex items-center gap-4">
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-md ${
              currentStreak > 0
                ? "bg-gradient-to-tr from-orange-500 to-amber-400 text-white"
                : "bg-gray-100 dark:bg-gray-700 text-gray-400"
            }`}
          >
            <FireIcon className="w-8 h-8" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white">
                {currentStreak}
              </span>
              <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">
                {currentStreak === 1 ? "Day Streak" : "Days Streak"}
              </span>
              {isActiveToday && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300">
                  <CheckCircleIcon className="w-3.5 h-3.5" /> Active Today
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{motivationMessage}</p>
          </div>
        </div>

        {/* Right Side: 7-Day Activity Calendar & Longest Streak */}
        <div className="flex items-center gap-6">
          {/* 7-Day Activity Dots */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {past7Days.map((day, idx) => (
              <div key={idx} className="flex flex-col items-center gap-1">
                <div
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    day.isActive
                      ? "bg-amber-500 text-white shadow-sm ring-2 ring-amber-200 dark:ring-amber-800"
                      : "bg-gray-100 dark:bg-gray-700/60 text-gray-400 dark:text-gray-500"
                  }`}
                  title={`${day.date}: ${day.isActive ? "Active" : "Inactive"}`}
                >
                  {day.isActive ? <FireIcon className="w-4 h-4" /> : "·"}
                </div>
                <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">
                  {day.dayName}
                </span>
              </div>
            ))}
          </div>

          {/* Longest Streak Trophy */}
          {longestStreak > 0 && (
            <div className="hidden lg:flex flex-col items-center border-l border-gray-200 dark:border-gray-700 pl-4">
              <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-bold text-sm">
                <TrophyIcon className="w-4 h-4" /> {longestStreak}
              </div>
              <span className="text-[10px] text-gray-400">Best Streak</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
