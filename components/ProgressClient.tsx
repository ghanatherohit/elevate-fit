"use client";

import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import GlassCard from "@/components/GlassCard";
import SectionHeader from "@/components/SectionHeader";

type DayEntry = {
  routineDone: boolean;
  workoutDone: boolean;
  water: number;
  tasksDone: number;
  tasksTotal: number;
};

type RangeKey = "day" | "week" | "month" | "year";

type ChartPoint = {
  key: string;
  label: string;
  score: number;
  tasksDone: number;
  tasksTotal: number;
  date?: Date;
};

const storageKey = "ef-progress";
const defaultTasksTotal = 8;

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

const defaultEntry = (date: Date): DayEntry => {
  const seed = date.getDate();
  const routineDone = seed % 2 === 0;
  const workoutDone = seed % 3 === 0;
  const water = 2 + (seed % 3) * 0.5;
  const tasksDone = 4 + (seed % 4);
  return {
    routineDone,
    workoutDone,
    water,
    tasksDone,
    tasksTotal: defaultTasksTotal,
  };
};

const scoreEntry = (entry: DayEntry) => {
  const routineScore = entry.routineDone ? 25 : 0;
  const workoutScore = entry.workoutDone ? 25 : 0;
  const waterScore = clamp((entry.water / 3) * 25, 0, 25);
  const tasksScore =
    entry.tasksTotal > 0
      ? clamp((entry.tasksDone / entry.tasksTotal) * 25, 0, 25)
      : 0;
  return Math.round(routineScore + workoutScore + waterScore + tasksScore);
};

const average = (values: number[]) =>
  values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;

const buildPolyline = (points: ChartPoint[], height: number) => {
  if (!points.length) {
    return "";
  }
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

export default function ProgressClient() {
  const [range, setRange] = useState<RangeKey>("week");
  const [entries, setEntries] = useState<Record<string, DayEntry>>({});
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as Record<string, DayEntry>;
        setEntries(parsed);
        return;
      } catch {
        setEntries({});
      }
    }

    const seed: Record<string, DayEntry> = {};
    for (let offset = 0; offset < 120; offset += 1) {
      const date = new Date();
      date.setDate(date.getDate() - offset);
      seed[toKey(date)] = defaultEntry(date);
    }
    setEntries(seed);
    localStorage.setItem(storageKey, JSON.stringify(seed));
  }, []);

  const updateEntry = (key: string, nextEntry: DayEntry) => {
    setEntries((prev) => {
      const next = { ...prev, [key]: nextEntry };
      localStorage.setItem(storageKey, JSON.stringify(next));
      return next;
    });
  };

  const points = useMemo<ChartPoint[]>(() => {
    if (range === "day") {
      const list: ChartPoint[] = [];
      for (let offset = 13; offset >= 0; offset -= 1) {
        const date = new Date();
        date.setDate(date.getDate() - offset);
        const key = toKey(date);
        const entry = entries[key] ?? defaultEntry(date);
        list.push({
          key,
          label: formatShort(date),
          score: scoreEntry(entry),
          tasksDone: entry.tasksDone,
          tasksTotal: entry.tasksTotal,
          date,
        });
      }
      return list;
    }

    if (range === "week") {
      const list: ChartPoint[] = [];
      for (let offset = 7; offset >= 0; offset -= 1) {
        const date = new Date();
        date.setDate(date.getDate() - offset * 7);
        const start = startOfWeek(date);
        const label = `${formatShort(start)}`;
        const keys: string[] = [];
        for (let day = 0; day < 7; day += 1) {
          const step = new Date(start);
          step.setDate(start.getDate() + day);
          keys.push(toKey(step));
        }
        const entriesForWeek = keys.map((key) =>
          entries[key] ?? defaultEntry(fromKey(key)),
        );
        const scores = entriesForWeek.map(scoreEntry);
        const tasksDone = entriesForWeek.reduce((sum, entry) => sum + entry.tasksDone, 0);
        const tasksTotal = entriesForWeek.reduce(
          (sum, entry) => sum + entry.tasksTotal,
          0,
        );
        list.push({
          key: keys[0],
          label,
          score: Math.round(average(scores)),
          tasksDone,
          tasksTotal,
        });
      }
      return list;
    }

    if (range === "month") {
      const list: ChartPoint[] = [];
      for (let offset = 5; offset >= 0; offset -= 1) {
        const date = new Date();
        date.setMonth(date.getMonth() - offset);
        date.setDate(1);
        const label = date.toLocaleDateString(undefined, {
          month: "short",
        });
        const keys: string[] = [];
        const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
        for (let day = 1; day <= daysInMonth; day += 1) {
          const step = new Date(date.getFullYear(), date.getMonth(), day);
          keys.push(toKey(step));
        }
        const entriesForMonth = keys.map((key) =>
          entries[key] ?? defaultEntry(fromKey(key)),
        );
        const scores = entriesForMonth.map(scoreEntry);
        const tasksDone = entriesForMonth.reduce((sum, entry) => sum + entry.tasksDone, 0);
        const tasksTotal = entriesForMonth.reduce(
          (sum, entry) => sum + entry.tasksTotal,
          0,
        );
        list.push({
          key: keys[0],
          label,
          score: Math.round(average(scores)),
          tasksDone,
          tasksTotal,
        });
      }
      return list;
    }

    const list: ChartPoint[] = [];
    for (let offset = 4; offset >= 0; offset -= 1) {
      const date = new Date();
      date.setFullYear(date.getFullYear() - offset);
      const year = date.getFullYear();
      const label = `${year}`;
      const keys: string[] = [];
      for (let month = 0; month < 12; month += 1) {
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        for (let day = 1; day <= daysInMonth; day += 1) {
          const step = new Date(year, month, day);
          keys.push(toKey(step));
        }
      }
      const entriesForYear = keys.map((key) =>
        entries[key] ?? defaultEntry(fromKey(key)),
      );
      const scores = entriesForYear.map(scoreEntry);
      const tasksDone = entriesForYear.reduce((sum, entry) => sum + entry.tasksDone, 0);
      const tasksTotal = entriesForYear.reduce(
        (sum, entry) => sum + entry.tasksTotal,
        0,
      );
      list.push({
        key: keys[0],
        label,
        score: Math.round(average(scores)),
        tasksDone,
        tasksTotal,
      });
    }
    return list;
  }, [entries, range]);

  const avgScore = Math.round(average(points.map((point) => point.score)));
  const totalTasks = points.reduce((sum, point) => sum + point.tasksTotal, 0);
  const doneTasks = points.reduce((sum, point) => sum + point.tasksDone, 0);
  const donutProgress = totalTasks ? doneTasks / totalTasks : 0;

  const selectedEntry = useMemo(() => {
    if (!selectedKey) {
      return null;
    }
    return entries[selectedKey] ?? defaultEntry(fromKey(selectedKey));
  }, [entries, selectedKey]);

  const selectedLabel = selectedKey ? formatShort(fromKey(selectedKey)) : "";

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
              <div className="text-xs text-[color:var(--muted)]">Completion</div>
              <div className="text-sm font-semibold text-[color:var(--text)]">
                {avgScore}% average
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(rangeLabels) as RangeKey[]).map((key) => (
                <button
                  key={key}
                  className={`rounded-full border px-3 py-1 text-xs ${
                    range === key
                      ? "border-[color:var(--accent)] bg-[color:var(--card-strong)] text-[color:var(--text)]"
                      : "border-[color:var(--border)] bg-[color:var(--card)] text-[color:var(--muted)]"
                  }`}
                  onClick={() => setRange(key)}
                >
                  {rangeLabels[key]}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-[1.5fr_0.8fr]">
            <div className="grid gap-3">
              <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] p-4">
                <div className="text-xs text-[color:var(--muted)]">Trend</div>
                <svg viewBox="0 0 100 42" className="mt-3 h-20 w-full">
                  <polyline
                    points={buildPolyline(points, 36)}
                    fill="none"
                    stroke="var(--accent)"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                  <polyline
                    points={`0,36 100,36`}
                    fill="none"
                    stroke="rgba(255,255,255,0.08)"
                    strokeWidth="1"
                  />
                </svg>
              </div>

              <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] p-4">
                <div className="text-xs text-[color:var(--muted)]">Tasks</div>
                <div className="mt-3 grid grid-cols-7 gap-2 sm:grid-cols-10">
                  {points.map((point) => {
                    const height = clamp(point.tasksTotal ? (point.tasksDone / point.tasksTotal) * 100 : 0, 8, 100);
                    const isSelected = point.key === selectedKey;
                    return (
                      <button
                        key={point.key}
                        className={`flex flex-col items-center gap-2 rounded-xl border px-2 py-2 text-[10px] ${
                          isSelected
                            ? "border-[color:var(--accent)]/60 bg-[color:var(--card-strong)] text-[color:var(--text)]"
                            : "border-[color:var(--border)] bg-[color:var(--card)] text-[color:var(--muted)]"
                        }`}
                        onClick={() =>
                          setSelectedKey(range === "day" ? point.key : null)
                        }
                        type="button"
                      >
                        <div className="flex h-16 w-2 items-end rounded-full bg-[color:var(--card-strong)]">
                          <div
                            className="w-2 rounded-full bg-[color:var(--accent)]/60"
                            style={{ height: `${height}%` }}
                          />
                        </div>
                        {point.label}
                      </button>
                    );
                  })}
                </div>
                {range !== "day" ? (
                  <div className="mt-2 text-[10px] text-[color:var(--muted)]">
                    Switch to Day view to edit completions.
                  </div>
                ) : null}
              </div>
            </div>

            <div className="grid gap-3">
              <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] p-4">
                <div className="text-xs text-[color:var(--muted)]">Overall split</div>
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
                <div className="text-center text-xs text-[color:var(--muted)]">
                  {doneTasks} of {totalTasks} tasks
                </div>
              </div>

              <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] p-4">
                <div className="text-xs text-[color:var(--muted)]">Mediums tracked</div>
                <div className="mt-3 grid gap-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[color:var(--text)]">Routine</span>
                    <span className="text-[color:var(--muted)]">Complete</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[color:var(--text)]">Workout</span>
                    <span className="text-[color:var(--muted)]">Complete</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[color:var(--text)]">Water intake</span>
                    <span className="text-[color:var(--muted)]">Liters</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[color:var(--text)]">Routine tasks</span>
                    <span className="text-[color:var(--muted)]">Count</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </GlassCard>
      </motion.div>

      {range === "day" ? (
        <motion.div variants={item}>
          <GlassCard className="grid gap-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-[color:var(--muted)]">Edit day</div>
                <div className="text-sm font-semibold text-[color:var(--text)]">
                  {selectedLabel || "Select a day"}
                </div>
              </div>
              {selectedKey ? (
                <div className="rounded-full border border-[color:var(--border)] px-3 py-1 text-[10px] text-[color:var(--muted)]">
                  {selectedKey}
                </div>
              ) : null}
            </div>

            {selectedEntry ? (
              <div className="grid gap-3">
                {(
                  [
                    ["Routine complete", "routineDone"],
                    ["Workout complete", "workoutDone"],
                  ] as const
                ).map(([label, key]) => (
                  <label
                    key={key}
                    className="flex items-center justify-between rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] px-4 py-3 text-sm"
                  >
                    <span className="text-[color:var(--text)]">{label}</span>
                    <input
                      type="checkbox"
                      checked={selectedEntry[key]}
                      onChange={() => {
                        if (!selectedKey) {
                          return;
                        }
                        updateEntry(selectedKey, {
                          ...selectedEntry,
                          [key]: !selectedEntry[key],
                        });
                      }}
                      className="h-5 w-5 accent-[color:var(--accent)]"
                    />
                  </label>
                ))}

                <div className="grid gap-2">
                  <div className="flex items-center justify-between text-xs text-[color:var(--muted)]">
                    <span>Water intake</span>
                    <span>{selectedEntry.water.toFixed(1)} L</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={5}
                    step={0.25}
                    value={selectedEntry.water}
                    onChange={(event) => {
                      if (!selectedKey) {
                        return;
                      }
                      updateEntry(selectedKey, {
                        ...selectedEntry,
                        water: Number(event.target.value),
                      });
                    }}
                    className="w-full accent-[color:var(--accent)]"
                  />
                </div>

                <div className="grid gap-2">
                  <div className="flex items-center justify-between text-xs text-[color:var(--muted)]">
                    <span>Routine tasks completed</span>
                    <span>
                      {selectedEntry.tasksDone}/{selectedEntry.tasksTotal}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={selectedEntry.tasksTotal}
                    step={1}
                    value={selectedEntry.tasksDone}
                    onChange={(event) => {
                      if (!selectedKey) {
                        return;
                      }
                      updateEntry(selectedKey, {
                        ...selectedEntry,
                        tasksDone: Number(event.target.value),
                      });
                    }}
                    className="w-full accent-[color:var(--accent)]"
                  />
                </div>
              </div>
            ) : (
              <div className="text-xs text-[color:var(--muted)]">
                Select a day on the Tasks chart to edit.
              </div>
            )}
          </GlassCard>
        </motion.div>
      ) : null}

    </motion.div>
  );
}
