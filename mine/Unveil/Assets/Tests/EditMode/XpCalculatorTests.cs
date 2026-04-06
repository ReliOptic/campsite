using System;
using NUnit.Framework;

[TestFixture]
public class XpCalculatorTests
{
    // ─── Multiplier Curve ────────────────────────────────────────

    [Test]
    public void Multiplier_Day0_Returns1()
    {
        Assert.AreEqual(1.0f, XpCalculator.GetMultiplier(0), 0.01f);
    }

    [Test]
    public void Multiplier_Day7_ApproxCorrect()
    {
        // 1.0 + ln(1 + 7 * 0.15) = 1.0 + ln(2.05) ≈ 1.718
        float result = XpCalculator.GetMultiplier(7);
        Assert.AreEqual(1.72f, result, 0.05f);
    }

    [Test]
    public void Multiplier_Day30_ApproxCorrect()
    {
        // 1.0 + ln(1 + 30 * 0.15) = 1.0 + ln(5.5) ≈ 2.705
        float result = XpCalculator.GetMultiplier(30);
        Assert.AreEqual(2.70f, result, 0.1f);
    }

    [Test]
    public void Multiplier_NegativeDays_Returns1()
    {
        Assert.AreEqual(1.0f, XpCalculator.GetMultiplier(-5));
    }

    [Test]
    public void Multiplier_Monotonically_Increasing()
    {
        float prev = XpCalculator.GetMultiplier(0);
        for (int d = 1; d <= 365; d++)
        {
            float current = XpCalculator.GetMultiplier(d);
            Assert.Greater(current, prev, $"Multiplier should increase at day {d}");
            prev = current;
        }
    }

    // ─── Session XP ──────────────────────────────────────────────

    [Test]
    public void SessionXp_Day0_EqualsBase()
    {
        Assert.AreEqual(100, XpCalculator.CalculateSessionXp(100, 0));
    }

    [Test]
    public void SessionXp_Day7_AppliesMultiplier()
    {
        int result = XpCalculator.CalculateSessionXp(100, 7);
        Assert.Greater(result, 100);
        Assert.Less(result, 200);
    }

    // ─── Milestones ──────────────────────────────────────────────

    [Test]
    public void CheckMilestone_Day7_ReturnsFirstWeek()
    {
        var m = XpCalculator.CheckMilestone(7);
        Assert.IsNotNull(m);
        Assert.AreEqual(50, m.Value.BonusXp);
    }

    [Test]
    public void CheckMilestone_Day8_ReturnsNull()
    {
        Assert.IsNull(XpCalculator.CheckMilestone(8));
    }

    [Test]
    public void GetEarnedMilestones_Day21_Returns3()
    {
        var earned = XpCalculator.GetEarnedMilestones(21);
        Assert.AreEqual(3, earned.Count); // 7, 14, 21
    }

    [Test]
    public void GetNextMilestone_Day15_Returns21()
    {
        var next = XpCalculator.GetNextMilestone(15);
        Assert.IsNotNull(next);
        Assert.AreEqual(21, next.Value.Days);
    }

    [Test]
    public void GetNextMilestone_Day365_ReturnsNull()
    {
        Assert.IsNull(XpCalculator.GetNextMilestone(365));
    }

    [Test]
    public void TotalMilestoneBonus_Day100_Correct()
    {
        // 50 + 100 + 200 + 350 + 500 + 1000 = 2200
        Assert.AreEqual(2200, XpCalculator.GetTotalMilestoneBonus(100));
    }

    // ─── Streak ──────────────────────────────────────────────────

    [Test]
    public void IsStreakActive_Within48Hours_True()
    {
        var last = new DateTime(2026, 4, 5, 10, 0, 0);
        var now = new DateTime(2026, 4, 6, 20, 0, 0); // 34h later
        Assert.IsTrue(XpCalculator.IsStreakActive(last, now));
    }

    [Test]
    public void IsStreakActive_After48Hours_False()
    {
        var last = new DateTime(2026, 4, 5, 10, 0, 0);
        var now = new DateTime(2026, 4, 7, 11, 0, 0); // 49h later
        Assert.IsFalse(XpCalculator.IsStreakActive(last, now));
    }

    [Test]
    public void UpdateStreak_Active_Increments()
    {
        var last = new DateTime(2026, 4, 5, 10, 0, 0);
        var now = new DateTime(2026, 4, 6, 10, 0, 0);
        Assert.AreEqual(8, XpCalculator.UpdateStreak(7, last, now));
    }

    [Test]
    public void UpdateStreak_Broken_ResetsTo1()
    {
        var last = new DateTime(2026, 4, 1, 10, 0, 0);
        var now = new DateTime(2026, 4, 5, 10, 0, 0); // 4 days gap
        Assert.AreEqual(1, XpCalculator.UpdateStreak(30, last, now));
    }
}
