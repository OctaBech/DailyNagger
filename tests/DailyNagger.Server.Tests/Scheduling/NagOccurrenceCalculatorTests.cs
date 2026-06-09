using DailyNagger.Server.Domain;
using DailyNagger.Server.Scheduling;

namespace DailyNagger.Server.Tests.Scheduling;

public sealed class NagOccurrenceCalculatorTests
{
    private readonly NagOccurrenceCalculator calculator = new();

    [Fact]
    public void GetNextOccurrence_returns_today_when_weekly_rule_matches_from_date()
    {
        var nag = CreateNag(
            new NagTime
            {
                TimeType = NagTimeType.Weekly,
                DayOfWeek = DayOfWeek.Monday
            });

        var result = calculator.GetNextOccurrence(
            nag,
            new DateOnly(2026, 6, 1));

        Assert.Equal(new DateOnly(2026, 6, 1), result);
    }

    [Fact]
    public void GetNextOccurrence_returns_next_weekly_day_after_from_date()
    {
        var nag = CreateNag(
            new NagTime
            {
                TimeType = NagTimeType.Weekly,
                DayOfWeek = DayOfWeek.Monday
            });

        var result = calculator.GetNextOccurrence(
            nag,
            new DateOnly(2026, 6, 2));

        Assert.Equal(new DateOnly(2026, 6, 8), result);
    }

    [Fact]
    public void GetNextOccurrence_returns_next_monthly_day()
    {
        var nag = CreateNag(
            new NagTime
            {
                TimeType = NagTimeType.MonthlyDay,
                DayOfMonth = 15
            });

        var result = calculator.GetNextOccurrence(
            nag,
            new DateOnly(2026, 6, 20));

        Assert.Equal(new DateOnly(2026, 7, 15), result);
    }

    [Fact]
    public void GetNextOccurrence_skips_months_without_requested_day()
    {
        var nag = CreateNag(
            new NagTime
            {
                TimeType = NagTimeType.MonthlyDay,
                DayOfMonth = 31
            });

        var result = calculator.GetNextOccurrence(
            nag,
            new DateOnly(2026, 2, 1));

        Assert.Equal(new DateOnly(2026, 3, 31), result);
    }

    [Fact]
    public void GetNextOccurrence_returns_next_yearly_date()
    {
        var nag = CreateNag(
            new NagTime
            {
                TimeType = NagTimeType.YearlyDate,
                DayOfMonth = 24,
                MonthOfYear = 12
            });

        var result = calculator.GetNextOccurrence(
            nag,
            new DateOnly(2026, 12, 25));

        Assert.Equal(new DateOnly(2027, 12, 24), result);
    }

    [Fact]
    public void GetNextOccurrence_returns_max_value_when_nag_has_no_time_rules()
    {
        var nag = CreateNag();

        var result = calculator.GetNextOccurrence(
            nag,
            new DateOnly(2026, 6, 1));

        Assert.Equal(DateOnly.MaxValue, result);
    }

    [Fact]
    public void GetNextOccurrence_returns_null_when_nag_is_deactivated()
    {
        var nag = CreateNag(
            true,
            null,
            new NagTime
            {
                TimeType = NagTimeType.Weekly,
                DayOfWeek = DayOfWeek.Monday
            });

        var result = calculator.GetNextOccurrence(
            nag,
            new DateOnly(2026, 6, 1));

        Assert.Null(result);
    }

    [Fact]
    public void GetNextOccurrence_returns_null_when_next_date_is_after_expiry()
    {
        var nag = CreateNag(
            false,
            new DateOnly(2026, 6, 7),
            new NagTime
            {
                TimeType = NagTimeType.Weekly,
                DayOfWeek = DayOfWeek.Monday
            });

        var result = calculator.GetNextOccurrence(
            nag,
            new DateOnly(2026, 6, 8));

        Assert.Null(result);
    }

    private static Nag CreateNag(params NagTime[] rules) =>
        CreateNag(false, null, rules);

    private static Nag CreateNag(
        bool isDeactivated,
        DateOnly? expiresOn,
        params NagTime[] rules) =>
        new()
        {
            Title = "Test nag",
            ScheduleUpdatedAt = DateTimeOffset.UtcNow,
            ExpiresOn = expiresOn,
            IsDeactivated = isDeactivated,
            NagTimes = rules.ToList()
        };
}
