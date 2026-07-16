const CST_OFFSET_MS = 8 * 60 * 60 * 1000;
const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

export type CalendarDate = `${number}-${number}-${number}`;

export function parseCalendarDate(value: string) {
  const match = DATE_PATTERN.exec(value);
  if (!match) throw new Error("日期格式必须为 YYYY-MM-DD");
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const candidate = new Date(Date.UTC(year, month - 1, day));
  if (candidate.getUTCFullYear() !== year || candidate.getUTCMonth() !== month - 1 || candidate.getUTCDate() !== day) {
    throw new Error("日期不存在");
  }
  return { year, month, day };
}

export function cstCalendarDate(now = new Date()): CalendarDate {
  const shifted = new Date(now.getTime() + CST_OFFSET_MS);
  return formatCalendarDate(shifted.getUTCFullYear(), shifted.getUTCMonth() + 1, shifted.getUTCDate());
}

export function cstDateToUnlockInstant(value: string): Date {
  const { year, month, day } = parseCalendarDate(value);
  return new Date(Date.UTC(year, month - 1, day) - CST_OFFSET_MS);
}

export function addYearsToCalendarDate(value: string, years: 1 | 5 | 10): CalendarDate {
  const { year, month, day } = parseCalendarDate(value);
  const targetYear = year + years;
  const lastDay = new Date(Date.UTC(targetYear, month, 0)).getUTCDate();
  return formatCalendarDate(targetYear, month, Math.min(day, lastDay));
}

export function isAllowedUnlockDate(value: string, now = new Date()): boolean {
  try {
    const today = cstCalendarDate(now);
    const tomorrow = addDays(today, 1);
    const latest = addYearsToCalendarDate(today, 10);
    return value >= tomorrow && value <= latest;
  } catch {
    return false;
  }
}

export function addDays(value: string, amount: number): CalendarDate {
  const { year, month, day } = parseCalendarDate(value);
  const result = new Date(Date.UTC(year, month - 1, day + amount));
  return formatCalendarDate(result.getUTCFullYear(), result.getUTCMonth() + 1, result.getUTCDate());
}

export function canUnlock(unlockAt: Date, now = new Date()): boolean {
  return now.getTime() >= unlockAt.getTime();
}

function formatCalendarDate(year: number, month: number, day: number): CalendarDate {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}` as CalendarDate;
}
