/**
 * Calendar-date helpers that avoid UTC shift bugs from `new Date("YYYY-MM-DD")`.
 */

/** Parse YYYY-MM-DD as a local calendar date (noon local to avoid DST edges). */
export function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y!, (m ?? 1) - 1, d ?? 1, 12, 0, 0, 0);
}

/** Format a Date as YYYY-MM-DD in local time. */
export function toLocalDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Today's YYYY-MM-DD in local timezone. */
export function todayLocalDateStr(): string {
  return toLocalDateStr(new Date());
}
