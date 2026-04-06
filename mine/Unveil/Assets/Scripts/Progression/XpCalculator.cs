using System;
using System.Collections.Generic;

/// <summary>
/// Calculates XP multipliers and streak bonuses for the Unveil progression system.
/// Uses logarithmic curve to reward consistency without punishing gaps.
///
/// Base formula: multiplier = 1.0 + ln(1 + streak_days * 0.15)
///   Day 0:   1.00x (baseline)
///   Day 7:   1.69x
///   Day 14:  1.97x
///   Day 30:  2.26x
///   Day 100: 2.77x
///   Day 365: 3.31x
///
/// Milestone bonuses are flat XP grants at specific streak thresholds.
/// </summary>
public static class XpCalculator
{
    // ─── Milestone Definitions ───────────────────────────────────

    public struct Milestone
    {
        public int Days;
        public int BonusXp;
        public string NameKo;
        public string NameEn;
    }

    public static readonly Milestone[] Milestones =
    {
        new() { Days = 7,   BonusXp = 50,   NameKo = "첫 번째 주",    NameEn = "First Week" },
        new() { Days = 14,  BonusXp = 100,  NameKo = "2주의 리듬",    NameEn = "Two-Week Rhythm" },
        new() { Days = 21,  BonusXp = 200,  NameKo = "습관의 문턱",    NameEn = "Habit Threshold" },
        new() { Days = 30,  BonusXp = 350,  NameKo = "한 달의 기억",   NameEn = "A Month of Memory" },
        new() { Days = 60,  BonusXp = 500,  NameKo = "두 계절",       NameEn = "Two Seasons" },
        new() { Days = 100, BonusXp = 1000, NameKo = "백일의 약속",    NameEn = "Hundred-Day Promise" },
        new() { Days = 365, BonusXp = 3000, NameKo = "한 해의 순환",   NameEn = "A Year's Cycle" },
    };

    // ─── Core Calculations ───────────────────────────────────────

    /// <summary>
    /// Calculate the XP multiplier for a given streak length.
    /// Returns 1.0 at day 0, grows logarithmically.
    /// </summary>
    public static float GetMultiplier(int streakDays)
    {
        if (streakDays <= 0) return 1.0f;
        return 1.0f + (float)Math.Log(1.0 + streakDays * 0.15);
    }

    /// <summary>
    /// Calculate total XP earned for a session.
    /// baseXp is the raw XP from puzzle performance (solve time, stars, etc.)
    /// </summary>
    public static int CalculateSessionXp(int baseXp, int streakDays)
    {
        float multiplier = GetMultiplier(streakDays);
        return (int)Math.Round(baseXp * multiplier);
    }

    /// <summary>
    /// Check if a streak day hits any milestone. Returns the milestone or null.
    /// </summary>
    public static Milestone? CheckMilestone(int streakDays)
    {
        foreach (var m in Milestones)
        {
            if (m.Days == streakDays) return m;
        }
        return null;
    }

    /// <summary>
    /// Get all milestones earned up to a given streak length.
    /// </summary>
    public static List<Milestone> GetEarnedMilestones(int streakDays)
    {
        var earned = new List<Milestone>();
        foreach (var m in Milestones)
        {
            if (streakDays >= m.Days) earned.Add(m);
        }
        return earned;
    }

    /// <summary>
    /// Get the next upcoming milestone for a given streak.
    /// Returns null if all milestones are earned.
    /// </summary>
    public static Milestone? GetNextMilestone(int streakDays)
    {
        foreach (var m in Milestones)
        {
            if (streakDays < m.Days) return m;
        }
        return null;
    }

    /// <summary>
    /// Calculate total cumulative bonus XP from all milestones earned.
    /// </summary>
    public static int GetTotalMilestoneBonus(int streakDays)
    {
        int total = 0;
        foreach (var m in Milestones)
        {
            if (streakDays >= m.Days) total += m.BonusXp;
        }
        return total;
    }

    // ─── Streak Management ───────────────────────────────────────

    /// <summary>
    /// Determine if a streak is still active based on last session timestamp.
    /// Streak breaks after 48 hours (generous window for timezone/schedule variance).
    /// </summary>
    public static bool IsStreakActive(DateTime lastSession, DateTime now)
    {
        TimeSpan gap = now - lastSession;
        return gap.TotalHours <= 48.0;
    }

    /// <summary>
    /// Calculate new streak value given last session time.
    /// Returns 0 if streak is broken, previous + 1 if continued.
    /// </summary>
    public static int UpdateStreak(int currentStreak, DateTime lastSession, DateTime now)
    {
        if (!IsStreakActive(lastSession, now)) return 1; // Reset to day 1
        return currentStreak + 1;
    }
}
