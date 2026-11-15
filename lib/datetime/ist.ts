/**
 * India Standard Time helpers.
 *
 * Always use Intl with Asia/Kolkata instead of manual UTC+5:30 arithmetic.
 * Manual math often forgets the +30 minutes and/or calendar-day rollover,
 * which breaks weekday task lists and checklist date keys near IST midnight.
 */

export const IST_TIME_ZONE = "Asia/Kolkata";

export type WeekdayName =
  | "sunday"
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday";

const WEEKDAY_NAMES: WeekdayName[] = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

const istPartsFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: IST_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

const istWeekdayFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: IST_TIME_ZONE,
  weekday: "long",
});

const readPart = (
  parts: Intl.DateTimeFormatPart[],
  type: Intl.DateTimeFormatPartTypes,
) => parts.find((part) => part.type === type)?.value ?? "0";

export type IstParts = {
  year: number;
  month: number; // 1-12
  day: number;
  hours: number;
  minutes: number;
};

/** Calendar + clock fields for a moment, expressed in Asia/Kolkata. */
export const getIstParts = (date: Date = new Date()): IstParts => {
  const parts = istPartsFormatter.formatToParts(date);
  return {
    year: Number(readPart(parts, "year")),
    month: Number(readPart(parts, "month")),
    day: Number(readPart(parts, "day")),
    hours: Number(readPart(parts, "hour")),
    minutes: Number(readPart(parts, "minute")),
  };
};

/** YYYY-MM-DD for the IST calendar day of `date`. */
export const toIstDateKey = (date: Date = new Date()): string => {
  const { year, month, day } = getIstParts(date);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
};

/** Lowercase weekday name for the IST calendar day of `date`. */
export const getIstDayName = (date: Date = new Date()): WeekdayName => {
  return istWeekdayFormatter.format(date).toLowerCase() as WeekdayName;
};

export const getIstClock = (date: Date = new Date()) => {
  const { hours, minutes } = getIstParts(date);
  return { hours, minutes };
};

export const getIstMinutesOfDay = (date: Date = new Date()) => {
  const { hours, minutes } = getIstClock(date);
  return hours * 60 + minutes;
};

/** Add/subtract whole calendar days on a YYYY-MM-DD key (timezone-agnostic). */
export const shiftDateKey = (dateKey: string, days: number): string => {
  const [yearText, monthText, dayText] = dateKey.split("-");
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const shifted = new Date(Date.UTC(year, month - 1, day + days, 12, 0, 0));
  return `${shifted.getUTCFullYear()}-${String(shifted.getUTCMonth() + 1).padStart(2, "0")}-${String(shifted.getUTCDate()).padStart(2, "0")}`;
};

/**
 * Local-midnight Date for a YYYY-MM-DD key.
 * Used by calendar UI that still needs Date objects; pair with toIstDateKey /
 * getIstDayName rather than local getDay()/getDate() for IST logic.
 */
export const dateFromDateKey = (dateKey: string): Date | null => {
  const [yearText, monthText, dayText] = dateKey.split("-");
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);

  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return null;
  }

  const date = new Date(year, month - 1, day);
  date.setHours(0, 0, 0, 0);
  return date;
};

export const getIstMondayDateKey = (date: Date = new Date()): string => {
  const dayName = getIstDayName(date);
  const dayIndex = WEEKDAY_NAMES.indexOf(dayName);
  const daysToMonday = dayIndex === 0 ? 6 : dayIndex - 1;
  return shiftDateKey(toIstDateKey(date), -daysToMonday);
};

export const getIstSundayDateKey = (date: Date = new Date()): string => {
  return shiftDateKey(getIstMondayDateKey(date), 6);
};

export const buildIstWeekRange = (date: Date = new Date()) => ({
  startDate: getIstMondayDateKey(date),
  endDate: getIstSundayDateKey(date),
});

/** Most recent IST calendar days: [today, yesterday, ...] length `count`. */
export const buildRecentIstDateKeys = (
  count: number,
  from: Date = new Date(),
): string[] => {
  const todayKey = toIstDateKey(from);
  return Array.from({ length: count }, (_, index) =>
    shiftDateKey(todayKey, -index),
  );
};

/** Weekday for an IST YYYY-MM-DD key (noon UTC keeps the same calendar day in IST). */
export const getDayNameFromDateKey = (dateKey: string): WeekdayName => {
  const [yearText, monthText, dayText] = dateKey.split("-");
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  return getIstDayName(new Date(Date.UTC(year, month - 1, day, 12, 0, 0)));
};

export const getMondayStartFromDate = (date: Date = new Date()): Date => {
  const monday = dateFromDateKey(getIstMondayDateKey(date));
  if (!monday) {
    const fallback = new Date(date);
    fallback.setHours(0, 0, 0, 0);
    return fallback;
  }
  return monday;
};
