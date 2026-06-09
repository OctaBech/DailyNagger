using DailyNagger.Server.Domain;

namespace DailyNagger.Server.Scheduling;

public sealed class NagOccurrenceCalculator
{
    public DateOnly? GetNextOccurrence(Nag nag, DateOnly fromDate)
    {
        if (nag.IsDeactivated)
        {
            return null;
        }

        if (nag.ExpiresOn is not null && fromDate > nag.ExpiresOn)
        {
            return null;
        }

        if (nag.NagTimes.Count == 0)
        {
            return DateOnly.MaxValue;
        }

        var nextOccurrence = nag.NagTimes
            .Select(rule => GetNextOccurrence(rule, fromDate))
            .Where(date => date is not null)
            .Min();

        if (nextOccurrence is null)
        {
            return null;
        }

        if (nag.ExpiresOn is not null && nextOccurrence > nag.ExpiresOn)
        {
            return null;
        }

        return nextOccurrence;
    }

    private static DateOnly? GetNextOccurrence(
        NagTime rule,
        DateOnly fromDate) =>
        rule.TimeType switch
        {
            NagTimeType.Weekly => GetNextWeeklyOccurrence(rule, fromDate),
            NagTimeType.MonthlyDay => GetNextMonthlyOccurrence(rule, fromDate),
            NagTimeType.YearlyDate => GetNextYearlyOccurrence(rule, fromDate),
            _ => throw new ArgumentOutOfRangeException(nameof(rule), rule.TimeType, null)
        };

    private static DateOnly? GetNextWeeklyOccurrence(
        NagTime rule,
        DateOnly fromDate)
    {
        if (rule.DayOfWeek is null)
        {
            return null;
        }

        var daysUntilTarget = ((int)rule.DayOfWeek.Value - (int)fromDate.DayOfWeek + 7) % 7;

        return fromDate.AddDays(daysUntilTarget);
    }

    private static DateOnly? GetNextMonthlyOccurrence(
        NagTime rule,
        DateOnly fromDate)
    {
        if (rule.DayOfMonth is null)
        {
            return null;
        }

        var year = fromDate.Year;
        var month = fromDate.Month;

        while (true)
        {
            if (rule.DayOfMonth <= DateTime.DaysInMonth(year, month))
            {
                var candidate = new DateOnly(year, month, rule.DayOfMonth.Value);

                if (candidate >= fromDate)
                {
                    return candidate;
                }
            }

            if (month == 12)
            {
                year++;
                month = 1;
            }
            else
            {
                month++;
            }
        }
    }

    private static DateOnly? GetNextYearlyOccurrence(
        NagTime rule,
        DateOnly fromDate)
    {
        if (rule.DayOfMonth is null || rule.MonthOfYear is null)
        {
            return null;
        }

        var year = fromDate.Year;

        while (true)
        {
            if (rule.DayOfMonth <= DateTime.DaysInMonth(year, rule.MonthOfYear.Value))
            {
                var candidate = new DateOnly(
                    year,
                    rule.MonthOfYear.Value,
                    rule.DayOfMonth.Value);

                if (candidate >= fromDate)
                {
                    return candidate;
                }
            }

            year++;
        }
    }
}
