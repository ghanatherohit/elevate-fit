"use client";

import { useEffect, useMemo, useState } from "react";
import RoutineItem from "./RoutineItem";
import { routineItems, type RoutineItem as RoutineItemType } from "@/lib/data/routines";
import { recipes } from "@/lib/data/recipes";
import { workouts } from "@/lib/data/workouts";

type RoutineType = RoutineItemType["type"];

type CustomItemForm = {
  time: string;
  title: string;
  meta: string;
  type: RoutineType;
  targetId: string;
};

const storageKey = "routine-custom-items";
const completionKey = "routine-completion";
const progressKey = "ef-progress";

type CompletionMap = Record<string, Record<string, boolean>>;

type ProgressEntry = {
  routineDone: boolean;
  workoutDone: boolean;
  water: number;
  tasksDone: number;
  tasksTotal: number;
};

export default function RoutineListClient() {
  const [customItems, setCustomItems] = useState<RoutineItemType[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [completion, setCompletion] = useState<Record<string, boolean>>({});
  const [form, setForm] = useState<CustomItemForm>({
    time: "07:00",
    title: "",
    meta: "",
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
    const stored = localStorage.getItem(storageKey);
    if (!stored) {
      setCustomItems([]);
      return;
    }
    try {
      const parsed = JSON.parse(stored) as RoutineItemType[];
      setCustomItems(parsed);
    } catch {
      setCustomItems([]);
    }
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem(completionKey);
    if (!stored) {
      setCompletion({});
      return;
    }
    try {
      const parsed = JSON.parse(stored) as CompletionMap;
      const today = new Date().toISOString().slice(0, 10);
      setCompletion(parsed[today] ?? {});
    } catch {
      setCompletion({});
    }
  }, []);

  const handleSave = () => {
    if (!form.title.trim()) {
      return;
    }

    const nextItem: RoutineItemType = {
      id: `custom-${Date.now()}`,
      time: form.time,
      title: form.title.trim(),
      meta: form.meta || "Custom",
      type: form.type,
      targetId: form.type === "general" ? undefined : form.targetId || undefined,
      notes: "Custom routine item.",
      alarmLabel: "Custom alarm",
    };

    const nextItems = [nextItem, ...customItems];
    setCustomItems(nextItems);
    localStorage.setItem(storageKey, JSON.stringify(nextItems));
    setForm({
      time: "07:00",
      title: "",
      meta: "",
      type: "general",
      targetId: "",
    });
    setShowForm(false);
  };

  const mergedItems = [...customItems, ...routineItems];

  const updateProgress = (completedMap: Record<string, boolean>) => {
    const today = new Date().toISOString().slice(0, 10);
    const total = mergedItems.length;
    const done = mergedItems.filter((item) => completedMap[item.id]).length;

    const stored = localStorage.getItem(progressKey);
    const parsed = stored ? (JSON.parse(stored) as Record<string, ProgressEntry>) : {};
    const current = parsed[today] ?? {
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

    const nextProgress = { ...parsed, [today]: next };
    localStorage.setItem(progressKey, JSON.stringify(nextProgress));
  };

  const handleToggleComplete = (id: string) => {
    const today = new Date().toISOString().slice(0, 10);
    const nextCompletion = { ...completion, [id]: !completion[id] };
    setCompletion(nextCompletion);

    const stored = localStorage.getItem(completionKey);
    const parsed = stored ? (JSON.parse(stored) as CompletionMap) : {};
    const nextMap: CompletionMap = { ...parsed, [today]: nextCompletion };
    localStorage.setItem(completionKey, JSON.stringify(nextMap));

    updateProgress(nextCompletion);
  };

  useEffect(() => {
    updateProgress(completion);
  }, [completion, mergedItems.length]);

  return (
    <div className="grid gap-4">
      <button
        className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] px-4 py-3 text-left text-sm text-[color:var(--text)]"
        onClick={() => setShowForm((prev) => !prev)}
      >
        {showForm ? "Hide" : "Add new routine item"}
      </button>

      {showForm ? (
        <div className="grid gap-3 rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] p-4">
          <div className="grid gap-2">
            <label className="text-xs text-[color:var(--muted)]">Time</label>
            <input
              type="time"
              value={form.time}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, time: event.target.value }))
              }
              className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--card-strong)] px-4 py-3 text-sm text-[color:var(--text)]"
            />
          </div>
          <div className="grid gap-2">
            <label className="text-xs text-[color:var(--muted)]">Title</label>
            <input
              value={form.title}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, title: event.target.value }))
              }
              className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--card-strong)] px-4 py-3 text-sm text-[color:var(--text)]"
            />
          </div>
          <div className="grid gap-2">
            <label className="text-xs text-[color:var(--muted)]">Meta</label>
            <input
              value={form.meta}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, meta: event.target.value }))
              }
              placeholder="e.g. 10 mins"
              className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--card-strong)] px-4 py-3 text-sm text-[color:var(--text)]"
            />
          </div>
          <div className="grid gap-2">
            <label className="text-xs text-[color:var(--muted)]">Attach to</label>
            <select
              value={form.type}
              onChange={(event) => {
                const nextType = event.target.value as RoutineType;
                setForm((prev) => ({
                  ...prev,
                  type: nextType,
                  targetId: "",
                }));
              }}
              className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--card-strong)] px-4 py-3 text-sm text-[color:var(--text)]"
            >
              <option value="general">General</option>
              <option value="recipe">Recipe</option>
              <option value="workout">Workout</option>
            </select>
          </div>
          {form.type !== "general" ? (
            <div className="grid gap-2">
              <label className="text-xs text-[color:var(--muted)]">
                {form.type === "recipe" ? "Recipe" : "Workout"}
              </label>
              <select
                value={form.targetId}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    targetId: event.target.value,
                  }))
                }
                className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--card-strong)] px-4 py-3 text-sm text-[color:var(--text)]"
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
          <button
            className="rounded-2xl bg-[color:var(--accent)]/15 px-4 py-3 text-sm font-semibold text-[color:var(--accent)]"
            onClick={handleSave}
          >
            Add to routine
          </button>
        </div>
      ) : null}

      <div className="grid gap-3">
        {mergedItems.map((item) => (
          <RoutineItem
            key={item.id}
            time={item.time}
            title={item.title}
            meta={item.meta}
            highlight={item.highlight}
            href={`/routine/${item.id}`}
            checked={!!completion[item.id]}
            onToggle={() => handleToggleComplete(item.id)}
          />
        ))}
      </div>
    </div>
  );
}
