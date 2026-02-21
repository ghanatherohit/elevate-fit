"use client";

import { motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
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

const toKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};
const fromKey = (key: string) => new Date(`${key}T00:00:00`);

const checklistPercent = (tasksDone: number, tasksTotal: number) =>
  tasksTotal > 0 ? Math.round(clamp((tasksDone / tasksTotal) * 100, 0, 100)) : 0;


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
      const days = Array.from({ length: 7 }, (_, index) => {
        const date = new Date(todayDate);
        date.setDate(date.getDate() - (6 - index));
        return date;
      });

      return days.map((date) => {
        const key = toKey(date);
        const dayTasks = getTasksForDay(tasksByDay, date);
        const completed = completionByDate[key] || {};
        const tasksDone = Object.keys(completed).length;
        return {
          key,
          label: formatShort(date),
          score: checklistPercent(tasksDone, dayTasks.length),
          tasksDone,
          tasksTotal: dayTasks.length,
        };
      });
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

  useEffect(() => {
    if (!points.length) {
      return;
    }

    if (!selectedKey || !points.some((point) => point.key === selectedKey)) {
      setSelectedKey(points[points.length - 1].key);
    }
  }, [points, selectedKey]);

  const activeKey = selectedKey ?? points[points.length - 1]?.key ?? todayKey;
  const selectedEntry =
    progressData[activeKey] ||
    { tasksDone: 0, tasksTotal: 0, routineDone: false, workoutDone: false, water: 0 };

  const selectedTotals = useMemo(() => {
    if (range === "day") {
      const date = fromKey(activeKey);
      const dayTasks = getTasksForDay(tasksByDay, date);
      const completed = completionByDate[activeKey] || {};
      const tasksDone = Object.keys(completed).length;
      return {
        tasksDone,
        tasksTotal: dayTasks.length,
        percent: checklistPercent(tasksDone, dayTasks.length),
      };
    }

    if (range === "week") {
      const start = fromKey(activeKey);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      return collectRangeTotals(start, end);
    }

    if (range === "month") {
      const start = fromKey(activeKey);
      const monthStart = new Date(start.getFullYear(), start.getMonth(), 1);
      const monthEnd = new Date(start.getFullYear(), start.getMonth() + 1, 0);
      return collectRangeTotals(monthStart, monthEnd);
    }

    const start = fromKey(activeKey);
    const yearStart = new Date(start.getFullYear(), 0, 1);
    const yearEnd = new Date(start.getFullYear(), 11, 31);
    return collectRangeTotals(yearStart, yearEnd);
  }, [activeKey, range, tasksByDay, completionByDate, collectRangeTotals]);

  const avgScore = selectedTotals.percent;
  const totalTasks = selectedTotals.tasksTotal;
  const doneTasks = selectedTotals.tasksDone;
  const chartData = points.map((point) => ({
    label: point.label,
    percent: point.score,
    done: point.tasksDone,
    remaining: Math.max(point.tasksTotal - point.tasksDone, 0),
    total: point.tasksTotal,
  }));
  const radialData = [
    { name: "Done", value: avgScore },
    { name: "Remaining", value: Math.max(100 - avgScore, 0) },
  ];

  const activeIndex = points.findIndex((point) => point.key === activeKey);
  const canGoPrev = activeIndex > 0;
  const canGoNext = activeIndex !== -1 && activeIndex < points.length - 1;

  const goPrev = useCallback(() => {
    if (canGoPrev) {
      setSelectedKey(points[activeIndex - 1].key);
    }
  }, [activeIndex, canGoPrev, points]);

  const goNext = useCallback(() => {
    if (canGoNext) {
      setSelectedKey(points[activeIndex + 1].key);
    }
  }, [activeIndex, canGoNext, points]);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        goPrev();
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        goNext();
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [goPrev, goNext]);

  if (loading) return <div className="text-sm text-muted">Loading...</div>;

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
                  className={`rounded-full border px-2.5 py-1 text-[11px] sm:px-3 sm:text-xs ${
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
                className="rounded-xl border border-border bg-card px-2.5 py-2 sm:px-3"
              >
                <div className="text-[10px] text-muted">{label}</div>
                <div className="text-sm font-semibold text-foreground">{stat.percent}%</div>
                <div className="text-[10px] text-muted">
                  {stat.tasksDone}/{stat.tasksTotal}
                </div>
              </div>
            ))}
          </div>

          <div className="grid gap-3 lg:grid-cols-[1.6fr_0.9fr]">
            <div className="grid gap-3">
              <div className="rounded-2xl border border-border bg-card p-3 sm:p-4">
                <div className="text-xs text-muted">
                  {range === "day" && "Current day"}
                  {range === "week" && "Current week"}
                  {range === "month" && "Current month"}
                  {range === "year" && "Current year"}
                </div>
                <div className="mt-3 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={goPrev}
                    className={`rounded-2xl border border-border bg-card px-3 py-2 text-xs text-muted transition ${
                      canGoPrev
                        ? "hover:border-accent/30 hover:text-foreground"
                        : "cursor-not-allowed opacity-50"
                    }`}
                    aria-label="Previous"
                    disabled={!canGoPrev}
                  >
                    ←
                  </button>

                  <div className="min-w-0 flex-1 text-center">
                    <motion.div
                      key={activeKey}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                      className="text-sm font-semibold text-foreground"
                    >
                      {points.find((point) => point.key === activeKey)?.label ?? ""}
                    </motion.div>
                    <motion.div
                      key={`${activeKey}-meta`}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: 0.02 }}
                      className="mt-1 text-[11px] text-muted"
                    >
                      {avgScore}% • {doneTasks}/{totalTasks} tasks
                    </motion.div>
                  </div>

                  <button
                    type="button"
                    onClick={goNext}
                    className={`rounded-2xl border border-border bg-card px-3 py-2 text-xs text-muted transition ${
                      canGoNext
                        ? "hover:border-accent/30 hover:text-foreground"
                        : "cursor-not-allowed opacity-50"
                    }`}
                    aria-label="Next"
                    disabled={!canGoNext}
                  >
                    →
                  </button>
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-card p-3 sm:p-4">
                <div className="text-xs text-muted">Completion trend</div>
                <div className="mt-3 h-36 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="progressFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="var(--color-accent)" stopOpacity={0.45} />
                          <stop offset="100%" stopColor="var(--color-accent)" stopOpacity={0.05} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                      <XAxis dataKey="label" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                      <Tooltip
                        cursor={{ stroke: "rgba(255,255,255,0.12)", strokeDasharray: "3 3" }}
                        contentStyle={{
                          background: "rgba(12,12,12,0.9)",
                          border: "1px solid rgba(255,255,255,0.08)",
                          borderRadius: 12,
                          fontSize: 12,
                        }}
                        formatter={(value: number | undefined) => [value !== undefined ? `${value}%` : "-", "Completion"]}
                      />
                      <Area
                        type="monotone"
                        dataKey="percent"
                        stroke="var(--color-accent)"
                        strokeWidth={2}
                        fill="url(#progressFill)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-card p-3 sm:p-4">
                <div className="text-xs text-muted">Tasks completed</div>
                <div className="mt-3 h-28 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                      <XAxis dataKey="label" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} allowDecimals={false} />
                      <Tooltip
                        cursor={{ fill: "rgba(255,255,255,0.04)" }}
                        contentStyle={{
                          background: "rgba(12,12,12,0.9)",
                          border: "1px solid rgba(255,255,255,0.08)",
                          borderRadius: 12,
                          fontSize: 12,
                        }}
                        formatter={(value: number | undefined, name: string | undefined, entry: { payload?: { total?: number } }) => {
                          if (value === undefined) return ["-", name || ""];
                          if (name === "done") {
                            return [`${value}/${entry.payload?.total ?? 0}`, "Tasks completed"];
                          }
                          if (name === "remaining") {
                            return [`${value}`, "Tasks remaining"];
                          }
                          return [`${value}`, name || ""];
                        }}
                      />
                      <Bar dataKey="done" stackId="tasks" fill="var(--color-accent)" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="remaining" stackId="tasks" fill="rgba(255,255,255,0.08)" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-3 sm:p-4">
              <div className="text-xs text-muted">Overall split</div>
              <div className="mt-3 flex items-center justify-center">
                <div className="h-36 w-36">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={radialData}
                        cx="50%"
                        cy="50%"
                        innerRadius={54}
                        outerRadius={72}
                        dataKey="value"
                        startAngle={90}
                        endAngle={-270}
                        label={false}
                      >
                        <Cell fill="var(--color-accent)" />
                        <Cell fill="rgba(255,255,255,0.08)" />
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          background: "rgba(12,12,12,0.9)",
                          border: "1px solid rgba(255,255,255,0.08)",
                          borderRadius: 12,
                          fontSize: 12,
                        }}
                        formatter={(value: number | undefined) => [value !== undefined ? `${value}%` : "-", "Completion"]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
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
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-xs text-muted">Edit day</div>
                <div className="text-sm font-semibold text-foreground">
                  {formatShort(fromKey(activeKey))}
                </div>
              </div>
              <input
                type="date"
                value={activeKey}
                max={todayKey}
                onChange={(e) => setSelectedKey(e.target.value)}
                className="w-full rounded-full border border-border bg-card px-3 py-1 text-xs sm:w-auto"
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
                      updateProgress(activeKey, {
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
                    updateProgress(activeKey, {
                      water: Number(e.target.value),
                    });
                  }}
                  className="w-full accent-accent"
                />
              </div>

              <div className="rounded-2xl border border-border bg-card px-4 py-3">
                <div className="text-xs text-muted">Routine tasks</div>
                <div className="mt-1 text-sm font-semibold text-foreground">
                  {selectedTotals.tasksDone}/{selectedTotals.tasksTotal} completed
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



