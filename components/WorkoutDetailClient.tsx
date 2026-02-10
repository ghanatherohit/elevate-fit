"use client";

import { useEffect, useMemo, useState } from "react";
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

  const [initialValues, setInitialValues] = useState<WorkoutEditorValues>(
    baseValues,
  );

  useEffect(() => {
    const stored = localStorage.getItem(makeStorageKey(workout.id));
    if (!stored) {
      setInitialValues(baseValues);
      return;
    }
    try {
      const parsed = JSON.parse(stored) as Partial<WorkoutEditorValues>;
      setInitialValues({ ...baseValues, ...parsed });
    } catch {
      setInitialValues(baseValues);
    }
  }, [baseValues, workout.id]);

  const handleSave = (values: WorkoutEditorValues) => {
    localStorage.setItem(makeStorageKey(workout.id), JSON.stringify(values));
    setInitialValues(values);
  };

  return (
    <WorkoutEditor
      workout={workout}
      initialValues={initialValues}
      onSave={handleSave}
    />
  );
}
