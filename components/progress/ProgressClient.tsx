"use client";

import { motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useState } from "react";
import GlassCard from "@/components/shared/GlassCard";
import SectionHeader from "@/components/shared/SectionHeader";

type RangeKey = "day" | "week" | "month" | "year";

type ChartPoint = {
  key: string;
  label: string;
  score: number;
  tasksDone: number;
  tasksTotal: number;
};

type RoutineTask = {
  id: string;
  time: string;
  endTime?: string;
  title: string;
  highlight?: boolean;
  type: "recipe" | "workout" | "general";
  targetId?: string;
  notes: string;
  alarmLabel: string;
};

type ProgressEntry = {
  tasksDone?: number;
  tasksTotal?: number;
  routineDone?: boolean;
  workoutDone?: boolean;
  water?: number;
};

type ProgressByDate = Record<string, ProgressEntry>;

type TasksByDay = {
  monday: RoutineTask[];
  tuesday: RoutineTask[];
  wednesday: RoutineTask[];
  thursday: RoutineTask[];
  friday: RoutineTask[];
  saturday: RoutineTask[];
  sunday: RoutineTask[];
};

const container = {
  hidden: { opacity: 0, y: 8 },
  show: {
    opacity: 1,
    y: 0,
    transition: { staggerChildren: 0.08 },
  },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45 } },
};

const rangeLabels: Record<RangeKey, string> = {
  day: "Day",
  week: "Week",
  month: "Month",
  year: "Year",
};

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

const toKey = (date: Date) => date.toISOString().slice(0, 10);
const fromKey = (key: string) => new Date(`${key}T00:00:00`);

const checklistPercent = (tasksDone: number, tasksTotal: number) =>
  tasksTotal > 0 ? Math.round(clamp((tasksDone / tasksTotal) * 100, 0, 100)) : 0;

const buildPolyline = (points: ChartPoint[], height: number) => {
  if (!points.length) return "";
  const max = 100;
  const width = points.length - 1 || 1;
  return points
    .map((point, index) => {
      const x = (index / width) * 100;
      const y = height - (point.score / max) * height;
      return `${x},${y}`;
    })
    .join(" ");
};

const startOfWeek = (date: Date) => {
  const next = new Date(date);
  const day = next.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  next.setDate(next.getDate() + diff);
  next.setHours(0, 0, 0, 0);
  return next;
};

const formatShort = (date: Date) =>
  date.toLocaleDateString(undefined, { month: "short", day: "numeric" });

const getTasksForDay = (tasksByDay: TasksByDay | null, date: Date): RoutineTask[] => {
  if (!tasksByDay) return [];

  const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const dayName = dayNames[date.getDay()] as keyof TasksByDay;

  return tasksByDay[dayName] || [];
};

export default function ProgressClient() {
  const [range, setRange] = useState<RangeKey>("week");
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [progressData, setProgressData] = useState<ProgressByDate>({});
  const [tasksByDay, setTasksByDay] = useState<TasksByDay | null>(null);
  const [completionByDate, setCompletionByDate] = useState<Record<string, Record<string, boolean>>>({});
  const [loading, setLoading] = useState(true);

  const todayDate = useMemo(() => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
  }, []);
  const todayKey = useMemo(() => toKey(todayDate), [todayDate]);

  useEffect(() => {
    const fetchProgressData = async () => {
      try {
        const now = new Date();
        const yearStart = new Date(now.getFullYear(), 0, 1);
        const yearEnd = new Date(now.getFullYear(), 11, 31);

        const startDate = toKey(yearStart);
        const endDate = toKey(yearEnd);

        const [progressResponse, tasksResponse, checklistResponse] = await Promise.all([
          fetch(`/api/progress?startDate=${startDate}&endDate=${endDate}`, { cache: "no-store" }),
          fetch("/api/routine/tasks", { cache: "no-store" }),
          fetch(`/api/routine/checklist?startDate=${startDate}&endDate=${endDate}`, { cache: "no-store" }),
        ]);

        if (progressResponse.ok) {
          const data = (await progressResponse.json()) as { progressByDate?: ProgressByDate };
          setProgressData(data.progressByDate || {});
        }

        if (tasksResponse.ok) {
          const tasksData = await tasksResponse.json();
          console.log('Tasks API response:', tasksData);
          console.log('TasksByDay:', tasksData.tasksByDay);
          setTasksByDay(tasksData.tasksByDay || null);
        }

        if (checklistResponse.ok) {
          const checklistData = await checklistResponse.json();
          console.log('Checklist API response:', checklistData);
          console.log('CompletionByDate:', checklistData.completionByDate);
          setCompletionByDate(checklistData.completionByDate || {});
        }
      } catch (error) {
        console.error("Failed to fetch progress data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProgressData();
  }, []);

  const updateProgress = async (key: string, data: Partial<ProgressEntry>) => {
    try {
      await fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: key, ...data }),
      });
      setProgressData((prev) => ({ ...prev, [key]: { ...prev[key], ...data } }));
    } catch (error) {
      console.error("Failed to update progress:", error);
    }
  };

  const collectRangeTotals = useCallback((start: Date, end: Date) => {
    const current = new Date(start);
    current.setHours(0, 0, 0, 0);
    const endDate = new Date(end);
    endDate.setHours(0, 0, 0, 0);

    let tasksDone = 0;
    let tasksTotal = 0;

    while (current <= endDate) {
      const key = toKey(current);
      const dayTasks = getTasksForDay(tasksByDay, current);
      const dayCompleted = completionByDate[key] || {};
      
      tasksTotal += dayTasks.length;
      tasksDone += Object.keys(dayCompleted).length;
      
      current.setDate(current.getDate() + 1);
    }

    return { tasksDone, tasksTotal, percent: checklistPercent(tasksDone, tasksTotal) };
  }, [tasksByDay, completionByDate]);

  const periodPercentages = useMemo(() => {
    const now = new Date(todayDate);
    const weekStart = startOfWeek(now);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const yearStart = new Date(now.getFullYear(), 0, 1);
    const yearEnd = new Date(now.getFullYear(), 11, 31);

    const todayCompletedItems = completionByDate[todayKey] || {};
    const todayTasksDone = Object.keys(todayCompletedItems).length;
    const todayTasks = getTasksForDay(tasksByDay, todayDate);

    console.log('Today key:', todayKey);
    console.log('Today completed items:', todayCompletedItems);
    console.log('Today tasks done:', todayTasksDone);
    console.log('Today tasks:', todayTasks);
    console.log('Today tasks total:', todayTasks.length);

    return {
      day: {
        tasksDone: todayTasksDone,
        tasksTotal: todayTasks.length,
        percent: checklistPercent(todayTasksDone, todayTasks.length),
      },
      week: collectRangeTotals(weekStart, weekEnd),
      month: collectRangeTotals(monthStart, monthEnd),
      year: collectRangeTotals(yearStart, yearEnd),
    };
  }, [tasksByDay, completionByDate, todayDate, todayKey, collectRangeTotals]);

  useEffect(() => {
    if (range === "day") {
      setSelectedKey((prev) => prev ?? todayKey);
    }
  }, [range, todayKey]);

  const points = useMemo<ChartPoint[]>(() => {
    if (range === "day") {
      const todayTasks = getTasksForDay(tasksByDay, todayDate);
      const todayCompleted = completionByDate[todayKey] || {};
      const tasksDone = Object.keys(todayCompleted).length;
      
      return [
        {
          key: todayKey,
          label: "Today",
          score: checklistPercent(tasksDone, todayTasks.length),
          tasksDone: tasksDone,
          tasksTotal: todayTasks.length,
        },
      ];
    }

    if (range === "week") {
      const list: ChartPoint[] = [];
      for (let offset = 7; offset >= 0; offset--) {
        const date = new Date();
        date.setDate(date.getDate() - offset * 7);
        const start = startOfWeek(date);
        const totals = collectRangeTotals(start, new Date(start.getTime() + 6 * 24 * 60 * 60 * 1000));
        list.push({
          key: toKey(start),
          label: formatShort(start),
          score: totals.percent,
          tasksDone: totals.tasksDone,
          tasksTotal: totals.tasksTotal,
        });
      }
      return list;
    }

    if (range === "month") {
      const list: ChartPoint[] = [];
      for (let offset = 5; offset >= 0; offset--) {
        const date = new Date();
        date.setMonth(date.getMonth() - offset);
        date.setDate(1);
        const monthStart = new Date(date);
        const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        const totals = collectRangeTotals(monthStart, monthEnd);
        list.push({
          key: toKey(date),
          label: date.toLocaleDateString(undefined, { month: "short" }),
          score: totals.percent,
          tasksDone: totals.tasksDone,
          tasksTotal: totals.tasksTotal,
        });
      }
      return list;
    }

    const list: ChartPoint[] = [];
    for (let offset = 4; offset >= 0; offset--) {
      const year = new Date().getFullYear() - offset;
      const yearStart = new Date(year, 0, 1);
      const yearEnd = new Date(year, 11, 31);
      const totals = collectRangeTotals(yearStart, yearEnd);
      list.push({
        key: toKey(yearStart),
        label: `${year}`,
        score: totals.percent,
        tasksDone: totals.tasksDone,
        tasksTotal: totals.tasksTotal,
      });
    }
    return list;
  }, [tasksByDay, completionByDate, range, todayDate, todayKey, collectRangeTotals]);

  const selectedEntry = progressData[selectedKey || todayKey] || { tasksDone: 0, tasksTotal: 0, routineDone: false, workoutDone: false, water: 0 };
  const avgScore = periodPercentages[range].percent;
  const totalTasks = periodPercentages[range].tasksTotal;
  const doneTasks = periodPercentages[range].tasksDone;
  const donutProgress = totalTasks ? doneTasks / totalTasks : 0;

  if (loading) return <div>Loading...</div>;

  return (
    <motion.div
      className="grid gap-5"
      variants={container}
      initial="hidden"
      animate="show"
    >
      <motion.div variants={item}>
        <SectionHeader title="Progress" action="Insights" />
      </motion.div>

      <motion.div variants={item}>
        <GlassCard className="grid gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-xs text-muted">Checklist completion</div>
              <div className="text-sm font-semibold text-foreground">
                {avgScore}% ({rangeLabels[range]})
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(rangeLabels) as RangeKey[]).map((key) => (
                <button
                  key={key}
                  className={`rounded-full border px-3 py-1 text-xs ${
                    range === key
                      ? "border-accent bg-card-strong text-foreground"
                      : "border-border bg-card text-muted"
                  }`}
                  onClick={() => setRange(key)}
                >
                  {rangeLabels[key]}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {([
              ["Day", periodPercentages.day],
              ["Week", periodPercentages.week],
              ["Month", periodPercentages.month],
              ["Year", periodPercentages.year],
            ] as const).map(([label, stat]) => (
              <div
                key={label}
                className="rounded-xl border border-border bg-card px-3 py-2"
              >
                <div className="text-[10px] text-muted">{label}</div>
                <div className="text-sm font-semibold text-foreground">{stat.percent}%</div>
                <div className="text-[10px] text-muted">
                  {stat.tasksDone}/{stat.tasksTotal}
                </div>
              </div>
            ))}
          </div>

          <div className="grid gap-3 sm:grid-cols-[1.5fr_0.8fr]">
            <div className="grid gap-3">
              <div className="rounded-2xl border border-border bg-card p-4">
                <div className="text-xs text-muted">Trend</div>
                <svg viewBox="0 0 100 42" className="mt-3 h-20 w-full">
                  <polyline
                    points={buildPolyline(points, 36)}
                    fill="none"
                    stroke="var(--accent)"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                </svg>
              </div>

              <div className="rounded-2xl border border-border bg-card p-4">
                <div className="text-xs text-muted">Tasks</div>
                <div className="mt-3 grid grid-cols-7 gap-2">
                  {points.map((point) => {
                    const height = clamp(
                      point.tasksTotal ? (point.tasksDone / point.tasksTotal) * 100 : 0,
                      8,
                      100
                    );
                    const isSelected = point.key === selectedKey;
                    return (
                      <button
                        key={point.key}
                        className={`flex flex-col items-center gap-2 rounded-xl border px-2 py-2 text-[10px] ${
                          isSelected
                            ? "border-accent/60 bg-card-strong text-foreground"
                            : "border-border bg-card text-muted"
                        }`}
                        onClick={() => setSelectedKey(range === "day" ? point.key : null)}
                      >
                        <div className="flex h-16 w-2 items-end rounded-full bg-card-strong">
                          <div
                            className="w-2 rounded-full bg-accent/60"
                            style={{ height: `${height}%` }}
                          />
                        </div>
                        {point.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-4">
              <div className="text-xs text-muted">Overall split</div>
              <div className="mt-3 flex items-center justify-center">
                <svg viewBox="0 0 36 36" className="h-28 w-28">
                  <circle
                    cx="18"
                    cy="18"
                    r="15"
                    stroke="rgba(255,255,255,0.08)"
                    strokeWidth="5"
                    fill="none"
                  />
                  <circle
                    cx="18"
                    cy="18"
                    r="15"
                    stroke="var(--accent)"
                    strokeWidth="5"
                    fill="none"
                    strokeDasharray={`${donutProgress * 94} 94`}
                    strokeLinecap="round"
                    transform="rotate(-90 18 18)"
                  />
                </svg>
              </div>
              <div className="text-center text-xs text-muted">
                {doneTasks} of {totalTasks} tasks
              </div>
            </div>
          </div>
        </GlassCard>
      </motion.div>

      {range === "day" && (
        <motion.div variants={item}>
          <GlassCard className="grid gap-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-muted">Edit day</div>
                <div className="text-sm font-semibold text-foreground">
                  {formatShort(fromKey(selectedKey || todayKey))}
                </div>
              </div>
              <input
                type="date"
                value={selectedKey ?? todayKey}
                max={todayKey}
                onChange={(e) => setSelectedKey(e.target.value)}
                className="rounded-full border border-border bg-card px-3 py-1 text-xs"
              />
            </div>

            <div className="grid gap-3">
              {(
                [
                  ["Routine complete", "routineDone"],
                  ["Workout complete", "workoutDone"],
                ] as const
              ).map(([label, key]) => (
                <label
                  key={key}
                  className="flex items-center justify-between rounded-2xl border border-border bg-card px-4 py-3"
                >
                  <span className="text-sm text-foreground">{label}</span>
                  <input
                    type="checkbox"
                    checked={selectedEntry[key] || false}
                    onChange={() => {
                      updateProgress(selectedKey || todayKey, {
                        [key]: !selectedEntry[key],
                      });
                    }}
                    className="h-5 w-5 accent-accent"
                  />
                </label>
              ))}

              <div className="grid gap-2">
                <div className="flex items-center justify-between text-xs text-muted">
                  <span>Water intake</span>
                  <span>{(selectedEntry.water || 0).toFixed(1)} L</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={5}
                  step={0.25}
                  value={selectedEntry.water || 0}
                  onChange={(e) => {
                    updateProgress(selectedKey || todayKey, {
                      water: Number(e.target.value),
                    });
                  }}
                  className="w-full accent-accent"
                />
              </div>

              <div className="rounded-2xl border border-border bg-card px-4 py-3">
                <div className="text-xs text-muted">Routine tasks</div>
                <div className="mt-1 text-sm font-semibold text-foreground">
                  {periodPercentages.day.tasksDone}/{periodPercentages.day.tasksTotal} completed
                </div>
                <div className="mt-1 text-[10px] text-muted">
                  Manage tasks in the Routine tab
                </div>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      )}
    </motion.div>
  );
}



