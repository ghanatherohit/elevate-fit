"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import RoutineItem from "./RoutineItem";
import GlassCard from "@/components/shared/GlassCard";
import { OpenHint } from "@/components/shared/DataSurfaces";
import OverlaySheet from "@/components/shared/OverlaySheet";
import { routineItems, type RoutineItem as RoutineItemType } from "@/lib/data/routines";
import { recipes } from "@/lib/data/recipes";
import { workouts } from "@/lib/data/workouts";
import {
  dateFromDateKey,
  getIstDayName,
  getIstMinutesOfDay,
  getMondayStartFromDate,
  toIstDateKey,
  type WeekdayName,
} from "@/lib/datetime/ist";

type RoutineType = RoutineItemType["type"];

type CustomItemForm = {
  time: string;
  endTime: string;
  title: string;
  type: RoutineType;
  targetId: string;
};

type CompletionMap = Record<string, Record<string, boolean>>;

type ProgressEntry = {
  routineDone: boolean;
  workoutDone: boolean;
  water: number;
  tasksDone: number;
  tasksTotal: number;
};

type WeeklyConsistencyDay = {
  done: number;
  total: number;
  completed: boolean;
  updatedAt: string;
};

type WeeklyConsistencyEntry = {
  programType: "7-days-consistency";
  days: Record<string, WeeklyConsistencyDay>;
};

type WeeklyConsistencyMap = Record<string, WeeklyConsistencyEntry>;

type RoutineListClientProps = {
  onOpenItem?: (itemId: string) => void;
};

type TasksByDay = {
  monday: RoutineItemType[];
  tuesday: RoutineItemType[];
  wednesday: RoutineItemType[];
  thursday: RoutineItemType[];
  friday: RoutineItemType[];
  saturday: RoutineItemType[];
  sunday: RoutineItemType[];
};

type DayName = WeekdayName;

type DayPlanEntry = {
  date: Date;
  dateKey: string;
  items: RoutineItemType[];
};

const progressKey = "ef-progress";
const weeklyTrackingConsentKey = "ef-weekly-tracking-consent";
const weeklyTrackingConsentCookieKey = "ef_weekly_tracking_consent";
const weeklyConsistencyKey = "ef-weekly-consistency";
const weeklyTrackingStartDateKey = "ef-weekly-tracking-start-date";

const weekdayOverrides: Record<string, number[]> = {
  "workout-mon-push": [1],
  "workout-tue-pull": [2],
  "workout-wed-legs": [3],
  "workout-thu-recovery": [4],
  "workout-fri-upper": [5],
  "workout-sat-lower-core": [6],
  "workout-sun-rest": [0],
  "sunday-weekly-review": [0],
  "sunday-next-week-plan": [0],
  "sunday-meal-prep": [0],
  "sunday-pack-bag": [0],
};

const dayNames: DayName[] = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

const createEmptyTasksByDay = (): TasksByDay => ({
  monday: [],
  tuesday: [],
  wednesday: [],
  thursday: [],
  friday: [],
  saturday: [],
  sunday: [],
});

const normalizeTasksByDay = (tasksByDay?: Partial<TasksByDay> | null): TasksByDay => ({
  monday: tasksByDay?.monday ?? [],
  tuesday: tasksByDay?.tuesday ?? [],
  wednesday: tasksByDay?.wednesday ?? [],
  thursday: tasksByDay?.thursday ?? [],
  friday: tasksByDay?.friday ?? [],
  saturday: tasksByDay?.saturday ?? [],
  sunday: tasksByDay?.sunday ?? [],
});

const getDayName = (date: Date): DayName => getIstDayName(date);

const addTaskToDay = (tasksByDay: TasksByDay, dayName: DayName, task: RoutineItemType) => {
  const nextDayItems = [...tasksByDay[dayName], task].sort(
    (first, second) => parseTimeToMinutes(first.time) - parseTimeToMinutes(second.time),
  );

  return {
    ...tasksByDay,
    [dayName]: nextDayItems,
  };
};

const parseTimeToMinutes = (value: string) => {
  const text = value.trim().toUpperCase();

  if (/^\d{1,2}:\d{2}$/.test(text)) {
    const [hoursText, minutesText] = text.split(":");
    return Number(hoursText) * 60 + Number(minutesText);
  }

  const match = text.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/);
  if (!match) {
    return Number.MAX_SAFE_INTEGER;
  }

  const [, hoursText, minutesText, ampm] = match;
  let hours = Number(hoursText) % 12;
  if (ampm === "PM") {
    hours += 12;
  }

  return hours * 60 + Number(minutesText);
};

const getNowMinutes = () => getIstMinutesOfDay();

const toDateKey = (date: Date) => toIstDateKey(date);

const parseDateKey = (value: string) => dateFromDateKey(value);

const getMondayStart = (date: Date) => getMondayStartFromDate(date);

const buildDayPlan = (dates: Date[], tasksByDay: TasksByDay): DayPlanEntry[] => {
  return dates.map((date) => {
    const dateKey = toDateKey(date);
    const dayName = getDayName(date);
    const items = [...(tasksByDay[dayName] ?? [])].sort(
      (first, second) => parseTimeToMinutes(first.time) - parseTimeToMinutes(second.time),
    );

    return { date, dateKey, items };
  });
};

const buildTasksByDayFromItems = (items: RoutineItemType[]): TasksByDay => {
  const tasksByDay = createEmptyTasksByDay();

  items.forEach((item) => {
    const allowedDays = weekdayOverrides[item.id];
    if (allowedDays?.length) {
      allowedDays.forEach((dayIndex) => {
        const dayName = dayNames[dayIndex];
        tasksByDay[dayName].push(item);
      });
      return;
    }

    dayNames.forEach((dayName) => {
      tasksByDay[dayName].push(item);
    });
  });

  (Object.keys(tasksByDay) as DayName[]).forEach((dayName) => {
    tasksByDay[dayName].sort(
      (first, second) => parseTimeToMinutes(first.time) - parseTimeToMinutes(second.time),
    );
  });

  return tasksByDay;
};

export default function RoutineListClient({ onOpenItem }: RoutineListClientProps) {
  const [tasksByDay, setTasksByDay] = useState<TasksByDay>(() => createEmptyTasksByDay());
  const [showForm, setShowForm] = useState(false);
  const [completionByDate, setCompletionByDate] = useState<CompletionMap>({});
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);
  const [weekOffset, setWeekOffset] = useState(0);
  const [monthOffset, setMonthOffset] = useState(0);
  const [viewMode, setViewMode] = useState<"week" | "month">("week");
  const [weeklyTrackingConsent, setWeeklyTrackingConsent] = useState<boolean | null>(null);
  const [weeklyTrackingStartDate, setWeeklyTrackingStartDate] = useState<string | null>(
    null,
  );
  const [deleteDialog, setDeleteDialog] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const lastLoadedRangeRef = useRef("");
  const taskRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const currentTaskKeyRef = useRef<string | null>(null);
  const [nowMinutes, setNowMinutes] = useState(getNowMinutes);
  const [form, setForm] = useState<CustomItemForm>({
    time: "07:00",
    endTime: "08:00",
    title: "",
    type: "general",
    targetId: "",
  });

  const targets = useMemo(() => {
    if (form.type === "recipe") {
      return recipes.map((item) => ({ id: item.id, label: item.title }));
    }
    if (form.type === "workout") {
      return workouts.map((item) => ({ id: item.id, label: item.title }));
    }
    return [];
  }, [form.type]);

  useEffect(() => {
    let cancelled = false;

    const loadRoutineTasks = async () => {
      try {
        const response = await fetch("/api/routine/tasks", { cache: "no-store" });
        if (!response.ok) {
          throw new Error("Failed to load tasks");
        }
        const data = (await response.json()) as { tasksByDay?: Partial<TasksByDay> };
        if (!cancelled) {
          setTasksByDay(normalizeTasksByDay(data.tasksByDay));
        }
      } catch {
        if (!cancelled) {
          setTasksByDay(buildTasksByDayFromItems(routineItems));
        }
      }
    };

    loadRoutineTasks();

    return () => {
      cancelled = true;
    };
  }, []);

  const writeConsentFallback = useCallback((granted: boolean) => {
    const status = granted ? "granted" : "denied";
    localStorage.setItem(weeklyTrackingConsentKey, status);
    document.cookie = `${weeklyTrackingConsentCookieKey}=${status}; path=/; max-age=31536000; samesite=lax`;
  }, []);

  const readConsentFallback = useCallback(() => {
    const fromLocal = localStorage.getItem(weeklyTrackingConsentKey);
    if (fromLocal === "granted") {
      return true;
    }
    if (fromLocal === "denied") {
      return false;
    }

    const cookieEntry = document.cookie
      .split(";")
      .map((entry) => entry.trim())
      .find((entry) => entry.startsWith(`${weeklyTrackingConsentCookieKey}=`));

    const cookieValue = cookieEntry?.split("=")[1];
    if (cookieValue === "granted") {
      return true;
    }
    if (cookieValue === "denied") {
      return false;
    }

    return null;
  }, []);

  const writeStartDateFallback = useCallback((dateKey: string | null) => {
    if (!dateKey) {
      localStorage.removeItem(weeklyTrackingStartDateKey);
      return;
    }

    localStorage.setItem(weeklyTrackingStartDateKey, dateKey);
  }, []);

  const readStartDateFallback = useCallback(() => {
    return localStorage.getItem(weeklyTrackingStartDateKey);
  }, []);

  const persistConsentPreference = useCallback(
    async (granted: boolean, startDate?: string | null) => {
      writeConsentFallback(granted);
      if (startDate) {
        writeStartDateFallback(startDate);
      }

      try {
        await fetch("/api/routine/weekly-program", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            trackWeeklyProgram: granted,
            programType: "7-days-consistency",
            ...(startDate ? { startDate } : {}),
          }),
        });
      } catch {}
    },
    [writeConsentFallback, writeStartDateFallback],
  );

  useEffect(() => {
    let cancelled = false;

    const loadTrackingConsent = async () => {
      try {
        const response = await fetch("/api/routine/weekly-program", {
          method: "GET",
          cache: "no-store",
        });

        if (response.ok) {
          const data = (await response.json()) as {
            preference?: {
              trackWeeklyProgram?: boolean;
              startDate?: string | null;
            } | null;
          };
          const dbConsent = data.preference?.trackWeeklyProgram;
          const dbStartDate = data.preference?.startDate
            ? toDateKey(new Date(data.preference.startDate))
            : null;

          if (typeof dbConsent === "boolean") {
            writeConsentFallback(dbConsent);
            const fallbackStartDate = readStartDateFallback();
            const resolvedStartDate =
              dbStartDate ??
              fallbackStartDate ??
              (dbConsent ? toDateKey(new Date()) : null);

            if (resolvedStartDate) {
              writeStartDateFallback(resolvedStartDate);
              if (!cancelled) {
                setWeeklyTrackingStartDate(resolvedStartDate);
              }
            }
            if (!cancelled) {
              setWeeklyTrackingConsent(dbConsent);
            }
            return;
          }
        }
      } catch {}

      const fallbackConsent = readConsentFallback();
      if (fallbackConsent !== null) {
        if (!cancelled) {
          setWeeklyTrackingConsent(fallbackConsent);
        }

        const fallbackStartDate = readStartDateFallback();
        if (fallbackStartDate && !cancelled) {
          setWeeklyTrackingStartDate(fallbackStartDate);
        }

        if (!fallbackStartDate && fallbackConsent) {
          const derivedStartDate = toDateKey(new Date());
          writeStartDateFallback(derivedStartDate);
          if (!cancelled) {
            setWeeklyTrackingStartDate(derivedStartDate);
          }
        }
        return;
      }

      if (!cancelled) {
        setWeeklyTrackingConsent(false);
      }
    };

    loadTrackingConsent();

    return () => {
      cancelled = true;
    };
  }, [readConsentFallback, readStartDateFallback, writeConsentFallback, writeStartDateFallback]);

  const handleWeeklyTrackingDecision = useCallback(
    async (granted: boolean) => {
      setWeeklyTrackingConsent(granted);
      if (granted) {
        const startDate = weeklyTrackingStartDate ?? toDateKey(new Date());
        setWeeklyTrackingStartDate(startDate);
        await persistConsentPreference(granted, startDate);
        return;
      }

      await persistConsentPreference(granted);
    },
    [persistConsentPreference, weeklyTrackingStartDate],
  );

  const defaultTaskIdSet = useMemo(
    () => new Set(routineItems.map((item) => item.id)),
    [],
  );

  // Anchor "today" to the IST calendar day, not the browser's local midnight.
  const todayKey = useMemo(() => toIstDateKey(), []);
  const today = useMemo(() => {
    return dateFromDateKey(todayKey) ?? (() => {
      const date = new Date();
      date.setHours(0, 0, 0, 0);
      return date;
    })();
  }, [todayKey]);
  const trackingStartDate = useMemo(() => {
    return weeklyTrackingStartDate ? parseDateKey(weeklyTrackingStartDate) : null;
  }, [weeklyTrackingStartDate]);

  const isFutureDate = useCallback(
    (date: Date) => {
      const compareDate = new Date(date);
      compareDate.setHours(0, 0, 0, 0);
      return compareDate.getTime() > today.getTime();
    },
    [today],
  );

  const isFutureDateKey = useCallback(
    (dateKey: string) => {
      const parsedDate = parseDateKey(dateKey);
      if (!parsedDate) {
        return true;
      }
      return isFutureDate(parsedDate);
    },
    [isFutureDate],
  );

  const isBeforeTrackingStartDate = useCallback(
    (dateKey: string) => {
      if (!weeklyTrackingConsent || !trackingStartDate) {
        return false;
      }

      const targetDate = parseDateKey(dateKey);
      if (!targetDate) {
        return true;
      }

      return targetDate.getTime() < trackingStartDate.getTime();
    },
    [trackingStartDate, weeklyTrackingConsent],
  );

  const getTrackingStartLockMessage = useCallback(
    (dateKey: string) => {
      if (!isBeforeTrackingStartDate(dateKey) || !trackingStartDate) {
        return null;
      }

      const lockLabel = trackingStartDate.toLocaleDateString(undefined, {
        weekday: "short",
        day: "2-digit",
        month: "short",
      });

      return `Tracking starts on ${lockLabel}. Earlier dates are locked.`;
    },
    [isBeforeTrackingStartDate, trackingStartDate],
  );

  const weekDates = useMemo(() => {
    const monday = getMondayStart(today);
    monday.setDate(monday.getDate() + weekOffset * 7);

    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + index);
      return date;
    });
  }, [today, weekOffset]);

  const currentMonthDate = useMemo(() => {
    const month = new Date(today);
    month.setDate(1);
    month.setMonth(month.getMonth() + monthOffset);
    return month;
  }, [monthOffset, today]);

  const monthDates = useMemo(() => {
    const gridStart = getMondayStart(currentMonthDate);

    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(gridStart);
      date.setDate(gridStart.getDate() + index);
      return date;
    });
  }, [currentMonthDate]);

  const weekPlan = useMemo(() => {
    return buildDayPlan(weekDates, tasksByDay);
  }, [tasksByDay, weekDates]);

  const monthPlan = useMemo(() => {
    return buildDayPlan(monthDates, tasksByDay);
  }, [tasksByDay, monthDates]);

  const activePlan = viewMode === "week" ? weekPlan : monthPlan;

  const toWeekOffset = (date: Date) => {
    const baseMonday = getMondayStart(today);
    const targetMonday = getMondayStart(date);
    const dayDiff = Math.round((targetMonday.getTime() - baseMonday.getTime()) / (1000 * 60 * 60 * 24));
    return Math.round(dayDiff / 7);
  };

  const toMonthOffset = (date: Date) => {
    return (date.getFullYear() - today.getFullYear()) * 12 + (date.getMonth() - today.getMonth());
  };

  const currentWeekStart = useMemo(() => getMondayStart(today), [today]);
  const currentWeekEnd = useMemo(() => {
    const end = new Date(currentWeekStart);
    end.setDate(currentWeekStart.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return end;
  }, [currentWeekStart]);

  const isDateInCurrentWeek = useCallback(
    (date: Date) => {
      const compareDate = new Date(date);
      compareDate.setHours(12, 0, 0, 0);
      return compareDate >= currentWeekStart && compareDate <= currentWeekEnd;
    },
    [currentWeekEnd, currentWeekStart],
  );

  const updateWeeklyConsistencyForDate = useCallback(
    (dateKey: string, completedMap: Record<string, boolean>, total: number) => {
      if (!weeklyTrackingConsent) {
        return;
      }

      const date = parseDateKey(dateKey);
      if (!date || !isDateInCurrentWeek(date)) {
        return;
      }

      const weekStartKey = toDateKey(getMondayStart(date));
      const dayDone = Object.values(completedMap).filter(Boolean).length;

      const stored = localStorage.getItem(weeklyConsistencyKey);
      const parsed = stored ? (JSON.parse(stored) as WeeklyConsistencyMap) : {};
      const currentEntry: WeeklyConsistencyEntry = parsed[weekStartKey] ?? {
        programType: "7-days-consistency",
        days: {},
      };

      const nextEntry: WeeklyConsistencyEntry = {
        ...currentEntry,
        programType: "7-days-consistency",
        days: {
          ...currentEntry.days,
          [dateKey]: {
            done: dayDone,
            total,
            completed: total > 0 ? dayDone === total : false,
            updatedAt: new Date().toISOString(),
          },
        },
      };

      const nextStore: WeeklyConsistencyMap = {
        ...parsed,
        [weekStartKey]: nextEntry,
      };

      localStorage.setItem(weeklyConsistencyKey, JSON.stringify(nextStore));
    },
    [isDateInCurrentWeek, weeklyTrackingConsent],
  );

  useEffect(() => {
    if (!activePlan.length) {
      return;
    }

    const hasToday = activePlan.some((entry) => entry.dateKey === todayKey);
    const latestAllowed = [...activePlan].reverse().find((entry) => !isFutureDate(entry.date));

    setSelectedDateKey((prev) => {
      if (
        prev &&
        activePlan.some((entry) => entry.dateKey === prev) &&
        !isFutureDateKey(prev) &&
        !isBeforeTrackingStartDate(prev)
      ) {
        return prev;
      }

      if (hasToday && !isBeforeTrackingStartDate(todayKey)) {
        return todayKey;
      }

      const fallback = activePlan.find(
        (entry) => !isFutureDate(entry.date) && !isBeforeTrackingStartDate(entry.dateKey),
      );

      return fallback?.dateKey ?? latestAllowed?.dateKey ?? activePlan[0].dateKey;
    });
  }, [activePlan, isBeforeTrackingStartDate, isFutureDate, isFutureDateKey, todayKey]);

  useEffect(() => {
    if (!selectedDateKey) {
      return;
    }

    const selectedDate = parseDateKey(selectedDateKey);
    if (!selectedDate) {
      return;
    }

    if (viewMode === "month") {
      const nextOffset = toMonthOffset(selectedDate);
      setMonthOffset((prev) => (prev === nextOffset ? prev : nextOffset));
      return;
    }

    const nextOffset = toWeekOffset(selectedDate);
    setWeekOffset((prev) => (prev === nextOffset ? prev : nextOffset));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDateKey, viewMode]);

  useEffect(() => {
    const loadCompletion = async () => {
      if (!activePlan.length) {
        return;
      }

      const startDate = activePlan[0].dateKey;
      const endDate = activePlan[activePlan.length - 1].dateKey;
      const rangeKey = `${startDate}:${endDate}`;

      if (lastLoadedRangeRef.current === rangeKey) {
        return;
      }
      lastLoadedRangeRef.current = rangeKey;

      const response = await fetch(
        `/api/routine/checklist?startDate=${startDate}&endDate=${endDate}`,
      );
      if (!response.ok) {
        lastLoadedRangeRef.current = "";
        return;
      }

      const data = (await response.json()) as { completionByDate?: CompletionMap };
      setCompletionByDate(data.completionByDate ?? {});
    };

    loadCompletion();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePlan[0]?.dateKey, activePlan[activePlan.length - 1]?.dateKey]);

  const selectedDayPlan = useMemo(() => {
    if (!selectedDateKey) {
      return null;
    }
    return activePlan.find((entry) => entry.dateKey === selectedDateKey) ?? null;
  }, [activePlan, selectedDateKey]);

  useEffect(() => {
    if (!selectedDayPlan || selectedDayPlan.dateKey !== todayKey) {
      return;
    }

    const updateNow = () => setNowMinutes(getNowMinutes());
    updateNow();
    const intervalId = window.setInterval(updateNow, 30000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [selectedDayPlan, todayKey]);

  useEffect(() => {
    if (!selectedDayPlan || selectedDayPlan.dateKey !== todayKey) {
      return;
    }

    if (!selectedDayPlan.items.length) {
      return;
    }

    const taskTimes = selectedDayPlan.items.map((item) => parseTimeToMinutes(item.time));
    const targetIndex = taskTimes.findIndex((minutes) => minutes >= nowMinutes);
    const resolvedIndex = targetIndex === -1 ? taskTimes.length - 1 : targetIndex;
    const targetItem = selectedDayPlan.items[resolvedIndex];
    const targetKey = `${selectedDayPlan.dateKey}-${targetItem.id}`;

    if (currentTaskKeyRef.current === targetKey) {
      return;
    }

    currentTaskKeyRef.current = targetKey;
    const node = taskRefs.current[targetKey];
    if (node) {
      node.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [nowMinutes, selectedDayPlan, todayKey]);

  const handleSelectDate = useCallback(
    (dateKey: string) => {
      const lockMessage = getTrackingStartLockMessage(dateKey);
      if (lockMessage) {
        window.alert(lockMessage);
        return;
      }

      setSelectedDateKey(dateKey);
    },
    [getTrackingStartLockMessage],
  );

  const weekRangeLabel = useMemo(() => {
    if (!weekPlan.length) {
      return "";
    }

    const start = weekPlan[0].date;
    const end = weekPlan[weekPlan.length - 1].date;

    return `${start.toLocaleDateString(undefined, {
      day: "2-digit",
      month: "short",
    })} - ${end.toLocaleDateString(undefined, {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })}`;
  }, [weekPlan]);

  const monthLabel = useMemo(() => {
    return currentMonthDate.toLocaleDateString(undefined, {
      month: "long",
      year: "numeric",
    });
  }, [currentMonthDate]);

  const updateProgressForDate = (
    dateKey: string,
    completedMap: Record<string, boolean>,
    total: number,
  ) => {
    const done = Object.values(completedMap).filter(Boolean).length;

    const stored = localStorage.getItem(progressKey);
    const parsed = stored ? (JSON.parse(stored) as Record<string, ProgressEntry>) : {};
    const current = parsed[dateKey] ?? {
      routineDone: false,
      workoutDone: false,
      water: 0,
      tasksDone: 0,
      tasksTotal: total,
    };

    const next: ProgressEntry = {
      ...current,
      routineDone: total > 0 ? done === total : false,
      tasksDone: done,
      tasksTotal: total,
    };

    const nextProgress = { ...parsed, [dateKey]: next };
    localStorage.setItem(progressKey, JSON.stringify(nextProgress));

    // Persist to server so Progress page and dashboard stay in sync.
    void fetch("/api/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date: dateKey,
        tasksDone: next.tasksDone,
        tasksTotal: next.tasksTotal,
        routineDone: next.routineDone,
        workoutDone: next.workoutDone,
        water: next.water,
      }),
    });
  };

  const persistRoutineTasks = useCallback(async (nextTasksByDay: TasksByDay) => {
    try {
      await fetch("/api/routine/tasks", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tasksByDay: nextTasksByDay }),
      });
    } catch {}
  }, []);

  const handleToggleComplete = (
    dateKey: string,
    itemId: string,
    total: number,
    itemTime: string,
  ) => {
    if (isFutureDateKey(dateKey)) {
      return;
    }

    if (isBeforeTrackingStartDate(dateKey)) {
      const lockMessage = getTrackingStartLockMessage(dateKey);
      if (lockMessage) {
        window.alert(lockMessage);
      }
      return;
    }

    if (dateKey === todayKey) {
      const itemMinutes = parseTimeToMinutes(itemTime);
      if (itemMinutes !== Number.MAX_SAFE_INTEGER && nowMinutes < itemMinutes) {
        return;
      }
    }

    const currentForDate = completionByDate[dateKey] ?? {};
    const nextChecked = !currentForDate[itemId];
    const nextForDate = { ...currentForDate, [itemId]: nextChecked };
    const nextMap: CompletionMap = { ...completionByDate, [dateKey]: nextForDate };

    setCompletionByDate(nextMap);
    updateProgressForDate(dateKey, nextForDate, total);
    updateWeeklyConsistencyForDate(dateKey, nextForDate, total);

    fetch("/api/routine/checklist", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: dateKey, itemId, checked: nextChecked }),
    }).then((response) => {
      if (response.ok) {
        return;
      }

      const rollbackForDate = { ...currentForDate };
      rollbackForDate[itemId] = !nextChecked;
      const rollbackMap = { ...completionByDate, [dateKey]: rollbackForDate };
      setCompletionByDate(rollbackMap);
      updateProgressForDate(dateKey, rollbackForDate, total);
      updateWeeklyConsistencyForDate(dateKey, rollbackForDate, total);
    });
  };

  const handleSave = () => {
    if (!form.title.trim()) {
      return;
    }

    const nextItem: RoutineItemType = {
      id: `custom-${Date.now()}`,
      time: form.time,
      endTime: form.endTime,
      title: form.title.trim(),
      type: form.type,
      targetId: form.type === "general" ? undefined : form.targetId || undefined,
      notes: "Custom routine item.",
      alarmLabel: "Custom alarm",
    };

    const targetDate = selectedDateKey ? parseDateKey(selectedDateKey) : today;
    const resolvedDate = targetDate ?? today;
    const dayName = getDayName(resolvedDate);

    const nextTasksByDay = addTaskToDay(tasksByDay, dayName, nextItem);
    setTasksByDay(nextTasksByDay);
    void persistRoutineTasks(nextTasksByDay);
    setForm({
      time: "07:00",
      endTime: "08:00",
      title: "",
      type: "general",
      targetId: "",
    });
    setShowForm(false);
  };

  const handleDeleteTaskRequest = useCallback(
    (item: RoutineItemType) => {
      if (defaultTaskIdSet.has(item.id)) {
        return;
      }

      setDeleteDialog({ id: item.id, title: item.title });
    },
    [defaultTaskIdSet],
  );

  const handleDeleteTaskConfirm = useCallback(async () => {
    if (!deleteDialog) {
      return;
    }

    const { id: itemId } = deleteDialog;
    if (defaultTaskIdSet.has(itemId)) {
      setDeleteDialog(null);
      return;
    }

    setDeleteDialog(null);
    setTasksByDay((prev) => {
      const nextTasksByDay = { ...prev };
      (Object.keys(nextTasksByDay) as DayName[]).forEach((dayName) => {
        nextTasksByDay[dayName] = nextTasksByDay[dayName].filter((item) => item.id !== itemId);
      });
      return nextTasksByDay;
    });

    try {
      const response = await fetch(
        `/api/routine/tasks?itemId=${encodeURIComponent(itemId)}`,
        { method: "DELETE" },
      );
      if (!response.ok) {
        return;
      }
      const data = (await response.json()) as { tasksByDay?: Partial<TasksByDay> };
      if (data.tasksByDay) {
        setTasksByDay(normalizeTasksByDay(data.tasksByDay));
      }
    } catch {}

    setCompletionByDate((prev) => {
      const next: CompletionMap = { ...prev };
      Object.keys(next).forEach((dateKey) => {
        if (!next[dateKey] || !(itemId in next[dateKey])) {
          return;
        }
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { [itemId]: _removed, ...rest } = next[dateKey];
        next[dateKey] = rest;
      });
      return next;
    });
  }, [defaultTaskIdSet, deleteDialog]);

  const handleNavigatePrevious = () => {
    if (viewMode === "week") {
      setWeekOffset((prev) => prev - 1);
      return;
    }

    setMonthOffset((prev) => prev - 1);
  };

  const handleNavigateNext = () => {
    const canGoNext = viewMode === "week" ? weekOffset < 0 : monthOffset < 0;
    if (!canGoNext) {
      return;
    }
    if (viewMode === "week") {
      setWeekOffset((prev) => prev + 1);
      return;
    }
    setMonthOffset((prev) => prev + 1);
  };

  const canNavigateNext = viewMode === "week" ? weekOffset < 0 : monthOffset < 0;

  const selectedDone = selectedDayPlan
    ? Object.values(completionByDate[selectedDayPlan.dateKey] ?? {}).filter(Boolean).length
    : 0;
  const selectedTotal = selectedDayPlan?.items.length ?? 0;
  const selectedPercent =
    selectedTotal > 0 ? Math.round((selectedDone / selectedTotal) * 100) : 0;

  return (
    <div className="grid gap-4">
      <GlassCard className="grid gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xs text-muted">Calendar</div>
            <div className="text-sm font-semibold text-foreground">
              {viewMode === "week" ? weekRangeLabel : monthLabel}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleNavigatePrevious}
              className="soft-chip px-2.5 py-1.5 text-sm text-foreground"
              aria-label={viewMode === "week" ? "Previous week" : "Previous month"}
            >
              ←
            </button>
            <button
              onClick={handleNavigateNext}
              className={`soft-chip px-2.5 py-1.5 text-sm text-foreground ${
                canNavigateNext ? "" : "cursor-not-allowed opacity-50"
              }`}
              aria-label={viewMode === "week" ? "Next week" : "Next month"}
              disabled={!canNavigateNext}
            >
              →
            </button>
            <div className="grid grid-cols-2 rounded-xl bg-card-strong/50 p-1 text-xs">
              <button
                onClick={() => setViewMode("week")}
                className={`rounded-lg px-3 py-1.5 ${
                  viewMode === "week" ? "bg-accent/15 text-accent" : "text-muted"
                }`}
              >
                Week
              </button>
              <button
                onClick={() => setViewMode("month")}
                className={`rounded-lg px-3 py-1.5 ${
                  viewMode === "month" ? "bg-accent/15 text-accent" : "text-muted"
                }`}
              >
                Month
              </button>
            </div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {viewMode === "week" ? (
            <motion.div
              key="week-view"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22 }}
              className="grid grid-cols-7 gap-1.5 sm:gap-2"
            >
              {weekPlan.map(({ dateKey, date, items }) => {
                const isActive = selectedDateKey === dateKey;
                const isFuture = isFutureDate(date);
                const isBeforeStart = isBeforeTrackingStartDate(dateKey);
                const isLocked = isFuture || isBeforeStart;
                const done = Object.values(completionByDate[dateKey] ?? {}).filter(Boolean)
                  .length;
                const total = items.length;
                const isToday = dateKey === todayKey;
                return (
                  <button
                    key={dateKey}
                    onClick={() => {
                      if (isLocked) {
                        const lockMessage = getTrackingStartLockMessage(dateKey);
                        if (lockMessage) {
                          window.alert(lockMessage);
                        }
                        return;
                      }

                      handleSelectDate(dateKey);
                    }}
                    disabled={isLocked}
                    className={`rounded-2xl px-1 py-2.5 text-center transition sm:px-2 ${
                      isActive
                        ? "bg-accent/15 text-accent"
                        : "bg-card-strong/35 text-muted hover:bg-card-strong/55 hover:text-foreground"
                    } ${isLocked ? "cursor-not-allowed opacity-45" : ""}`}
                  >
                    <div className="text-[10px] font-medium uppercase tracking-wide">
                      {date.toLocaleDateString(undefined, { weekday: "short" })}
                    </div>
                    <div
                      className={`mt-1 text-sm font-semibold ${
                        isActive || isToday ? "text-foreground" : ""
                      }`}
                    >
                      {date.toLocaleDateString(undefined, { day: "2-digit" })}
                    </div>
                    <div className="mt-1.5 flex justify-center gap-0.5">
                      {total === 0 ? (
                        <span className="h-1 w-1 rounded-full bg-border" />
                      ) : (
                        Array.from({ length: Math.min(total, 4) }).map((_, i) => (
                          <span
                            key={i}
                            className={`h-1 w-1 rounded-full ${
                              i < done ? "bg-accent" : "bg-border"
                            }`}
                          />
                        ))
                      )}
                    </div>
                  </button>
                );
              })}
            </motion.div>
          ) : (
            <motion.div
              key="month-view"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22 }}
              className="grid gap-2"
            >
              <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((label) => (
                  <div
                    key={label}
                    className="text-center text-[10px] font-medium text-muted"
                  >
                    {label}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
                {monthPlan.map(({ dateKey, date, items }) => {
                  const done = Object.values(completionByDate[dateKey] ?? {}).filter(Boolean).length;
                  const total = items.length;
                  const isActive = selectedDateKey === dateKey;
                  const isFuture = isFutureDate(date);
                  const isBeforeStart = isBeforeTrackingStartDate(dateKey);
                  const isLocked = isFuture || isBeforeStart;
                  const isCurrentMonth =
                    date.getMonth() === currentMonthDate.getMonth() &&
                    date.getFullYear() === currentMonthDate.getFullYear();

                  return (
                    <button
                      key={`cal-${dateKey}`}
                      onClick={() => {
                        if (isLocked) {
                          const lockMessage = getTrackingStartLockMessage(dateKey);
                          if (lockMessage) {
                            window.alert(lockMessage);
                          }
                          return;
                        }

                        handleSelectDate(dateKey);
                      }}
                      disabled={isLocked}
                      className={`rounded-2xl px-1 py-2.5 text-center transition sm:px-2 ${
                        isActive
                          ? "bg-accent/15"
                          : "bg-card-strong/35 hover:bg-card-strong/55"
                      } ${isLocked ? "cursor-not-allowed opacity-45" : ""}`}
                    >
                      <div
                        className={`text-sm font-semibold ${
                          isCurrentMonth ? "text-foreground" : "text-muted"
                        }`}
                      >
                        {date.toLocaleDateString(undefined, { day: "2-digit" })}
                      </div>
                      <div className="mt-1 text-[10px] text-muted">
                        {done}/{total}
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </GlassCard>

      <AnimatePresence mode="wait">
        {selectedDayPlan ? (
          (() => {
            const selectedDayIsFuture = isFutureDate(selectedDayPlan.date);
            const selectedDayIsBeforeStart = isBeforeTrackingStartDate(
              selectedDayPlan.dateKey,
            );
            const selectedDayIsToday = selectedDayPlan.dateKey === todayKey;

            return (
              <motion.div
                key={selectedDayPlan.dateKey}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.22 }}
                className="glass-card grid gap-4 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="text-sm font-semibold text-foreground">
                        {selectedDayPlan.date.toLocaleDateString(undefined, {
                          weekday: "long",
                          day: "2-digit",
                          month: "short",
                        })}
                      </div>
                      {selectedDayIsToday ? (
                        <span className="soft-chip bg-accent/15 px-2 py-0.5 text-[10px] font-medium text-accent">
                          Today
                        </span>
                      ) : null}
                    </div>
                    {!selectedDayIsFuture &&
                    !selectedDayIsBeforeStart &&
                    selectedTotal > 0 ? (
                      <div className="mt-1 text-xs text-muted">
                        {selectedDone} of {selectedTotal} done · {selectedPercent}%
                      </div>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    className="openable soft-chip gap-1 text-xs text-muted transition hover:text-foreground"
                    onClick={() => setShowForm(true)}
                  >
                    Add task
                    <OpenHint kind="open" />
                  </button>
                </div>

                {!selectedDayIsFuture &&
                !selectedDayIsBeforeStart &&
                selectedTotal > 0 ? (
                  <div className="h-1.5 overflow-hidden rounded-full bg-card-strong/60">
                    <div
                      className="h-full rounded-full bg-accent transition-all duration-500"
                      style={{ width: `${selectedPercent}%` }}
                    />
                  </div>
                ) : null}

                {selectedDayIsFuture ? (
                  <div className="text-xs text-muted">Future dates are locked.</div>
                ) : selectedDayIsBeforeStart ? (
                  <div className="text-xs text-muted">
                    {getTrackingStartLockMessage(selectedDayPlan.dateKey) ??
                      "Tracking has not started yet for this date."}
                  </div>
                ) : selectedDayPlan.items.length === 0 ? (
                  <div className="py-6 text-center text-xs text-muted">
                    No tasks yet. Add one to build today&apos;s rhythm.
                  </div>
                ) : (
                  <div className="data-list">
                    {selectedDayPlan.items.map((item) => (
                      <div
                        key={`${selectedDayPlan.dateKey}-${item.id}`}
                        className="py-1"
                        ref={(node) => {
                          taskRefs.current[`${selectedDayPlan.dateKey}-${item.id}`] = node;
                        }}
                      >
                        {(() => {
                          const itemMinutes = parseTimeToMinutes(item.time);
                          const isTimeLocked =
                            selectedDayIsToday &&
                            itemMinutes !== Number.MAX_SAFE_INTEGER &&
                            nowMinutes < itemMinutes;
                          const isToggleDisabled =
                            selectedDayIsFuture || selectedDayIsBeforeStart || isTimeLocked;
                          const lockLabel = isToggleDisabled ? "NO CHEATING" : undefined;

                          return (
                            <div className="flex items-center gap-2 sm:gap-3">
                              <div className="min-w-0 flex-1">
                                <RoutineItem
                                  time={item.time}
                                  endTime={item.endTime}
                                  title={item.title}
                                  highlight={item.highlight}
                                  href={
                                    selectedDayIsFuture || selectedDayIsBeforeStart || onOpenItem
                                      ? undefined
                                      : `/routine/${item.id}`
                                  }
                                  onOpen={
                                    selectedDayIsFuture ||
                                    selectedDayIsBeforeStart ||
                                    !onOpenItem
                                      ? undefined
                                      : () => onOpenItem(item.id)
                                  }
                                  checked={
                                    !!completionByDate[selectedDayPlan.dateKey]?.[item.id]
                                  }
                                  toggleDisabled={isToggleDisabled}
                                  lockLabel={lockLabel}
                                  onToggle={
                                    isToggleDisabled
                                      ? () => {}
                                      : () =>
                                          handleToggleComplete(
                                            selectedDayPlan.dateKey,
                                            item.id,
                                            selectedDayPlan.items.length,
                                            item.time,
                                          )
                                  }
                                />
                              </div>
                              {!defaultTaskIdSet.has(item.id) ? (
                                <button
                                  type="button"
                                  className="soft-chip shrink-0 px-2.5 py-1.5 text-[11px] text-muted hover:text-foreground"
                                  onClick={() => handleDeleteTaskRequest(item)}
                                >
                                  Delete
                                </button>
                              ) : null}
                            </div>
                          );
                        })()}
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            );
          })()
        ) : null}
      </AnimatePresence>

      <div className="flex flex-wrap items-center justify-between gap-3 px-1">
        <div className="grid gap-0.5">
          <div className="text-xs font-medium text-foreground">Progress tracking</div>
          <div className="text-[11px] text-muted">
            {weeklyTrackingConsent
              ? "Saving weekly consistency"
              : "Enable to save weekly progress"}
          </div>
        </div>
        <button
          onClick={() => {
            if (weeklyTrackingConsent) {
              return;
            }
            void handleWeeklyTrackingDecision(true);
          }}
          disabled={weeklyTrackingConsent === null || weeklyTrackingConsent}
          aria-pressed={weeklyTrackingConsent === true}
          className={`relative h-7 w-14 rounded-full transition ${
            weeklyTrackingConsent ? "bg-accent/25" : "bg-card-strong/60"
          } ${weeklyTrackingConsent === null ? "opacity-50" : ""}`}
        >
          <span
            className={`absolute top-0.5 h-5 w-5 rounded-full bg-foreground transition ${
              weeklyTrackingConsent ? "right-0.5" : "left-0.5"
            }`}
          />
        </button>
      </div>

      <OverlaySheet
        open={showForm}
        onClose={() => setShowForm(false)}
        title="Add to schedule"
        subtitle="New task"
      >
        <div className="grid gap-3">
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <label className="text-xs text-muted">Time</label>
              <input
                type="time"
                value={form.time}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, time: event.target.value }))
                }
                className="rounded-xl bg-card-strong/40 px-3 py-2.5 text-sm text-foreground outline-none"
              />
            </div>
            <div className="grid gap-1.5">
              <label className="text-xs text-muted">End time</label>
              <input
                type="time"
                value={form.endTime}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, endTime: event.target.value }))
                }
                className="rounded-xl bg-card-strong/40 px-3 py-2.5 text-sm text-foreground outline-none"
              />
            </div>
          </div>
          <div className="grid gap-1.5">
            <label className="text-xs text-muted">Title</label>
            <input
              value={form.title}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, title: event.target.value }))
              }
              className="rounded-xl bg-card-strong/40 px-3 py-2.5 text-sm text-foreground outline-none"
              placeholder="Task name"
              autoFocus
            />
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <label className="text-xs text-muted">Attach to</label>
              <select
                value={form.type}
                onChange={(event) => {
                  const nextType = event.target.value as RoutineType;
                  setForm((prev) => ({ ...prev, type: nextType, targetId: "" }));
                }}
                className="rounded-xl bg-card-strong/40 px-3 py-2.5 text-sm text-foreground outline-none"
              >
                <option value="general">General</option>
                <option value="recipe">Recipe</option>
                <option value="workout">Workout</option>
              </select>
            </div>
            {form.type !== "general" ? (
              <div className="grid gap-1.5">
                <label className="text-xs text-muted">
                  {form.type === "recipe" ? "Recipe" : "Workout"}
                </label>
                <select
                  value={form.targetId}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, targetId: event.target.value }))
                  }
                  className="rounded-xl bg-card-strong/40 px-3 py-2.5 text-sm text-foreground outline-none"
                >
                  <option value="">Select</option>
                  {targets.map((entry) => (
                    <option key={entry.id} value={entry.id}>
                      {entry.label}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}
          </div>
          <button
            type="button"
            className="rounded-xl bg-accent/15 px-4 py-2.5 text-sm font-semibold text-accent"
            onClick={handleSave}
          >
            Save task
          </button>
        </div>
      </OverlaySheet>

      <OverlaySheet
        open={Boolean(deleteDialog)}
        onClose={() => setDeleteDialog(null)}
        title="Delete task?"
        subtitle="This cannot be undone"
      >
        <div className="grid gap-4">
          <p className="text-xs text-muted">
            You are about to delete {"\""}
            {deleteDialog?.title}
            {"\""}. This action is permanent.
          </p>
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              className="soft-chip px-3 py-2 text-xs font-semibold text-foreground"
              onClick={() => setDeleteDialog(null)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="rounded-xl bg-accent/15 px-3 py-2 text-xs font-semibold text-accent"
              onClick={handleDeleteTaskConfirm}
            >
              Delete
            </button>
          </div>
        </div>
      </OverlaySheet>
    </div>
  );
}



