"use client";

import { useEffect, useMemo, useState } from "react";
import type { Workout } from "@/lib/data/workouts";

export type WorkoutEditorValues = {
  title: string;
  duration: string;
  focus: string;
  exercises: string[];
};

type WorkoutEditorProps = {
  workout: Workout;
  initialValues?: WorkoutEditorValues;
  onSave?: (values: WorkoutEditorValues) => void;
};

const toTextarea = (items: string[]) => items.join("\n");
const toList = (value: string) =>
  value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);

export default function WorkoutEditor({
  workout,
  initialValues,
  onSave,
}: WorkoutEditorProps) {
  const baseValues = useMemo<WorkoutEditorValues>(
    () => ({
      title: workout.title,
      duration: workout.duration,
      focus: workout.focus,
      exercises: workout.exercises,
    }),
    [workout.duration, workout.exercises, workout.focus, workout.title],
  );

  const resolvedValues = initialValues ?? baseValues;

  const [title, setTitle] = useState(resolvedValues.title);
  const [duration, setDuration] = useState(resolvedValues.duration);
  const [focus, setFocus] = useState(resolvedValues.focus);
  const [exercisesText, setExercisesText] = useState(
    toTextarea(resolvedValues.exercises),
  );

  useEffect(() => {
    setTitle(resolvedValues.title);
    setDuration(resolvedValues.duration);
    setFocus(resolvedValues.focus);
    setExercisesText(toTextarea(resolvedValues.exercises));
  }, [resolvedValues]);

  return (
    <div className="grid gap-4">
      <div className="grid gap-2">
        <label className="text-xs text-muted">Title</label>
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className="rounded-2xl border border-border bg-card px-4 py-3 text-sm text-foreground"
        />
      </div>
      <div className="grid gap-2">
        <label className="text-xs text-muted">Duration</label>
        <input
          value={duration}
          onChange={(event) => setDuration(event.target.value)}
          className="rounded-2xl border border-border bg-card px-4 py-3 text-sm text-foreground"
        />
      </div>
      <div className="grid gap-2">
        <label className="text-xs text-muted">Focus</label>
        <textarea
          value={focus}
          onChange={(event) => setFocus(event.target.value)}
          rows={2}
          className="rounded-2xl border border-border bg-card px-4 py-3 text-sm text-foreground"
        />
      </div>
      <div className="grid gap-2">
        <label className="text-xs text-muted">Exercises</label>
        <textarea
          value={exercisesText}
          onChange={(event) => setExercisesText(event.target.value)}
          rows={5}
          className="rounded-2xl border border-border bg-card px-4 py-3 text-sm text-foreground"
        />
        <div className="text-[10px] text-muted">
          One per line
        </div>
      </div>
      <button
        className="rounded-2xl bg-accent/15 px-4 py-3 text-sm font-semibold text-accent"
        onClick={() =>
          onSave?.({
            title,
            duration,
            focus,
            exercises: toList(exercisesText),
          })
        }
      >
        Save changes (local)
      </button>
    </div>
  );
}


