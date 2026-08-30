import User from "../models/User";

/**
 * Calculates date difference in days between two YYYY-MM-DD strings.
 */
function getDaysDiff(dateStrA: string, dateStrB: string): number {
  const dateA = new Date(dateStrA + "T00:00:00Z");
  const dateB = new Date(dateStrB + "T00:00:00Z");
  const diffTime = Math.abs(dateB.getTime() - dateA.getTime());
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Returns today's date formatted as YYYY-MM-DD.
 */
export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Records daily user learning activity and updates streaks idempotently.
 */
export async function recordUserActivity(userId: string): Promise<{ currentStreak: number; longestStreak: number }> {
  try {
    const user = await User.findById(userId);
    if (!user) return { currentStreak: 0, longestStreak: 0 };

    const today = getTodayDateString();

    if (user.lastActiveDate === today) {
      return {
        currentStreak: user.currentStreak || 1,
        longestStreak: user.longestStreak || 1,
      };
    }

    let newCurrentStreak = 1;
    if (user.lastActiveDate) {
      const daysDiff = getDaysDiff(user.lastActiveDate, today);
      if (daysDiff === 1) {
        newCurrentStreak = (user.currentStreak || 0) + 1;
      } else {
        newCurrentStreak = 1;
      }
    }

    const newLongestStreak = Math.max(user.longestStreak || 0, newCurrentStreak);

    user.currentStreak = newCurrentStreak;
    user.longestStreak = newLongestStreak;
    user.lastActiveDate = today;

    if (!user.activeDates) {
      user.activeDates = [];
    }
    if (!user.activeDates.includes(today)) {
      user.activeDates.push(today);
      // Keep up to 60 days of historical active dates
      if (user.activeDates.length > 60) {
        user.activeDates = user.activeDates.slice(-60);
      }
    }

    await user.save();

    return {
      currentStreak: user.currentStreak,
      longestStreak: user.longestStreak,
    };
  } catch (error) {
    console.error("[STREAK] Error updating user streak:", error);
    return { currentStreak: 0, longestStreak: 0 };
  }
}
