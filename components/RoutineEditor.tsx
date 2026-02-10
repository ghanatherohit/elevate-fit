"use client";

import { useEffect, useState } from "react";
import type { RoutineItem } from "@/lib/data/routines";
import type { Recipe } from "@/lib/data/recipes";
import type { Workout } from "@/lib/data/workouts";

export type RoutineEditorValues = {
  time: string;
  title: string;
  notes: string;
  alarmLabel: string;
  notifications: boolean;
  type: RoutineItem["type"];
  targetId: string;
};

type RoutineEditorProps = {
  item: RoutineItem;
  recipes: Recipe[];
  workouts: Workout[];
  initialValues?: RoutineEditorValues;
  onSave?: (values: RoutineEditorValues) => void;
};

type RoutineType = RoutineItem["type"];

export default function RoutineEditor({
  item,
  recipes,
  workouts,
  initialValues,
  onSave,
}: RoutineEditorProps) {
  const baseValues: RoutineEditorValues = {
    time: item.time,
    title: item.title,
    notes: item.notes,
    alarmLabel: item.alarmLabel,
    notifications: true,
    type: item.type,
    targetId: item.targetId ?? "",
  };
  const resolvedValues = initialValues ?? baseValues;

  const [time, setTime] = useState(resolvedValues.time);
  const [title, setTitle] = useState(resolvedValues.title);
  const [notes, setNotes] = useState(resolvedValues.notes);
  const [alarmLabel, setAlarmLabel] = useState(resolvedValues.alarmLabel);
  const [notifications, setNotifications] = useState(
    resolvedValues.notifications,
  );
  const [type, setType] = useState<RoutineType>(resolvedValues.type);
  const [targetId, setTargetId] = useState(resolvedValues.targetId);

  useEffect(() => {
    setTime(resolvedValues.time);
    setTitle(resolvedValues.title);
    setNotes(resolvedValues.notes);
    setAlarmLabel(resolvedValues.alarmLabel);
    setNotifications(resolvedValues.notifications);
    setType(resolvedValues.type);
    setTargetId(resolvedValues.targetId);
  }, [
    resolvedValues.alarmLabel,
    resolvedValues.notes,
    resolvedValues.notifications,
    resolvedValues.targetId,
    resolvedValues.time,
    resolvedValues.title,
    resolvedValues.type,
  ]);

  const targets = type === "recipe" ? recipes : type === "workout" ? workouts : [];

  return (
    <div className="grid gap-4">
      <div className="grid gap-2">
        <label className="text-xs text-[color:var(--muted)]">Time</label>
        <input
          type="time"
          value={time}
          onChange={(event) => setTime(event.target.value)}
          className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] px-4 py-3 text-sm text-[color:var(--text)]"
        />
      </div>
      <div className="grid gap-2">
        <label className="text-xs text-[color:var(--muted)]">Title</label>
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] px-4 py-3 text-sm text-[color:var(--text)]"
        />
      </div>
      <div className="grid gap-2">
        <label className="text-xs text-[color:var(--muted)]">Notes</label>
        <textarea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          rows={3}
          className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] px-4 py-3 text-sm text-[color:var(--text)]"
        />
      </div>
      <div className="grid gap-2">
        <label className="text-xs text-[color:var(--muted)]">Alarm label</label>
        <input
          value={alarmLabel}
          onChange={(event) => setAlarmLabel(event.target.value)}
          className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] px-4 py-3 text-sm text-[color:var(--text)]"
        />
      </div>
      <div className="flex items-center justify-between rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] px-4 py-3">
        <div>
          <div className="text-sm text-[color:var(--text)]">Notifications</div>
          <div className="text-xs text-[color:var(--muted)]">
            Gentle reminders for this routine.
          </div>
        </div>
        <input
          type="checkbox"
          checked={notifications}
          onChange={(event) => setNotifications(event.target.checked)}
          className="h-5 w-5 accent-[color:var(--accent)]"
        />
      </div>
      <div className="grid gap-2">
        <label className="text-xs text-[color:var(--muted)]">Attach to</label>
        <select
          value={type}
          onChange={(event) => {
            const nextType = event.target.value as RoutineType;
            setType(nextType);
            setTargetId("");
          }}
          className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] px-4 py-3 text-sm text-[color:var(--text)]"
        >
          <option value="general">General</option>
          <option value="recipe">Recipe</option>
          <option value="workout">Workout</option>
        </select>
      </div>
      {type !== "general" ? (
        <div className="grid gap-2">
          <label className="text-xs text-[color:var(--muted)]">
            {type === "recipe" ? "Recipe" : "Workout"}
          </label>
          <select
            value={targetId}
            onChange={(event) => setTargetId(event.target.value)}
            className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] px-4 py-3 text-sm text-[color:var(--text)]"
          >
            <option value="">Select</option>
            {targets.map((entry) => (
              <option key={entry.id} value={entry.id}>
                {"title" in entry ? entry.title : entry.id}
              </option>
            ))}
          </select>
        </div>
      ) : null}
      <button
        className="rounded-2xl bg-[color:var(--accent)]/15 px-4 py-3 text-sm font-semibold text-[color:var(--accent)]"
        onClick={() =>
          onSave?.({
            time,
            title,
            notes,
            alarmLabel,
            notifications,
            type,
            targetId,
          })
        }
      >
        Save changes (local)
      </button>
    </div>
  );
}
