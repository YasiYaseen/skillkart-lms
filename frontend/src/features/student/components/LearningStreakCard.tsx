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
      <div className="bg-white dark:bg-slate-900 rounded-xl p-5 shadow-2xs border border-slate-200 dark:border-slate-800 animate-pulse">
        <div className="h-5 w-32 bg-slate-200 dark:bg-slate-800 rounded mb-3"></div>
        <div className="h-10 bg-slate-100 dark:bg-slate-800 rounded-lg"></div>
      </div>
    );
  }

  if (!streak) return null;

  const { currentStreak, longestStreak, isActiveToday, past7Days } = streak;

  let motivationMessage = "Start learning today to build your streak!";
  if (currentStreak >= 30) {
    motivationMessage = "Outstanding dedication — month-long streak!";
  } else if (currentStreak >= 7) {
    motivationMessage = "Incredible consistency — over a full week in a row!";
  } else if (currentStreak >= 3) {
    motivationMessage = "Great momentum — keep your daily learning habit active!";
  } else if (currentStreak >= 1) {
    motivationMessage = "Good work today — continue your momentum tomorrow!";
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl p-5 sm:p-6 shadow-2xs border border-slate-200 dark:border-slate-800">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left Side: Streak Count & Motivation */}
        <div className="flex items-center gap-3.5">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              currentStreak > 0
                ? "bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60"
                : "bg-slate-100 dark:bg-slate-800 text-slate-400"
            }`}
          >
            <FireIcon className="w-6 h-6" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-slate-900 dark:text-white">
                {currentStreak}
              </span>
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                {currentStreak === 1 ? "Day Streak" : "Days Streak"}
              </span>
              {isActiveToday && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  <CheckCircleIcon className="w-3 h-3" /> Active Today
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{motivationMessage}</p>
          </div>
        </div>

        {/* Right Side: 7-Day Activity Calendar & Longest Streak */}
        <div className="flex items-center gap-5">
          {/* 7-Day Activity Dots */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {past7Days.map((day, idx) => (
              <div key={idx} className="flex flex-col items-center gap-1">
                <div
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-xs font-semibold transition-all ${
                    day.isActive
                      ? "bg-amber-500 text-white shadow-2xs"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500"
                  }`}
                  title={`${day.date}: ${day.isActive ? "Active" : "Inactive"}`}
                >
                  {day.isActive ? <FireIcon className="w-3.5 h-3.5" /> : "·"}
                </div>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                  {day.dayName}
                </span>
              </div>
            ))}
          </div>

          {/* Longest Streak Trophy */}
          {longestStreak > 0 && (
            <div className="hidden lg:flex flex-col items-center border-l border-slate-200 dark:border-slate-800 pl-4">
              <div className="flex items-center gap-1 text-slate-700 dark:text-slate-300 font-bold text-xs">
                <TrophyIcon className="w-3.5 h-3.5 text-amber-500" /> {longestStreak}
              </div>
              <span className="text-[10px] text-slate-400">Best Streak</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
