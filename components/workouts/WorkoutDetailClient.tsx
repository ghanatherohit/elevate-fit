"use client";

import { useMemo } from "react";
import type { Workout } from "@/lib/data/workouts";
import WorkoutEditor, { type WorkoutEditorValues } from "./WorkoutEditor";

type WorkoutDetailClientProps = {
  workout: Workout;
};

const makeStorageKey = (id: string) => `workout-item-${id}`;

export default function WorkoutDetailClient({
  workout,
}: WorkoutDetailClientProps) {
  const baseValues = useMemo<WorkoutEditorValues>(
    () => ({
      title: workout.title,
      duration: workout.duration,
      focus: workout.focus,
      exercises: workout.exercises,
    }),
    [workout.duration, workout.exercises, workout.focus, workout.title],
  );

  const initialValues = useMemo(() => {
    if (typeof window === "undefined") {
      return baseValues;
    }
    const stored = localStorage.getItem(makeStorageKey(workout.id));
    if (!stored) {
      return baseValues;
    }
    try {
      const parsed = JSON.parse(stored) as Partial<WorkoutEditorValues>;
      return { ...baseValues, ...parsed };
    } catch {
      return baseValues;
    }
  }, [baseValues, workout.id]);

  const handleSave = (values: WorkoutEditorValues) => {
    localStorage.setItem(makeStorageKey(workout.id), JSON.stringify(values));
  };

  return (
    <WorkoutEditor
      key={workout.id}
      workout={workout}
      initialValues={initialValues}
      onSave={handleSave}
    />
  );
}
