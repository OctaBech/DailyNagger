import { getCurrentAppDate } from "./appDay";

export type DueDateFormatMode = "section" | "card";

const weekdayFormatter = new Intl.DateTimeFormat("en-GB", {
  weekday: "long",
  timeZone: "UTC",
});

const shortWeekdayFormatter = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  timeZone: "UTC",
});

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});

// Both arguments are YYYY-MM-DD dates; today is the app's day, not necessarily the calendar day.
export function formatDueDate(
  dueOn: string | null,
  mode: DueDateFormatMode,
  today: string = getCurrentAppDate(),
): string {
  if (dueOn === null) return "No scheduled date";

  const dueTime = Date.parse(`${dueOn}T00:00:00Z`);
  const todayTime = Date.parse(`${today}T00:00:00Z`);
  if (!Number.isFinite(dueTime) || !Number.isFinite(todayTime)) {
    throw new Error("Cannot format due date: expected YYYY-MM-DD dates.");
  }

  // UTC calendar dates avoid 23/25-hour days when daylight saving time changes.
  const daysUntil = (dueTime - todayTime) / 86_400_000;
  const dueDate = new Date(dueTime);
  const weekday = mode === "card" ? shortWeekdayFormatter : weekdayFormatter;
  const dateLabel = `${weekday.format(dueDate)}, ${dateFormatter.format(dueDate)}`;
  const relativeLabel = getRelativeLabel(daysUntil);

  if (mode === "card") {
    if (daysUntil === 0) return "Due today";
    if (daysUntil === 1) return "Due tomorrow";
    const days = Math.abs(daysUntil);
    const countdown = `${days}Day${days === 1 ? "" : "s"}`;
    return `Due ${dateLabel} ${countdown}${daysUntil < 0 ? " ago" : ""}`;
  }

  const sectionLabel = relativeLabel.charAt(0).toUpperCase() + relativeLabel.slice(1);
  return `${sectionLabel} · ${dateLabel}`;
}

function getRelativeLabel(daysUntil: number): string {
  if (daysUntil === 0) return "today";
  if (daysUntil === 1) return "tomorrow";
  if (daysUntil === -1) return "yesterday";
  if (daysUntil < -1) return `${-daysUntil} days ago`;
  return `in ${daysUntil} days`;
}
