"use client";

import { useEffect, useMemo, useState } from "react";
import type { RoutineItem } from "@/lib/data/routines";
import type { Recipe } from "@/lib/data/recipes";
import type { Workout } from "@/lib/data/workouts";
import RoutineEditor, { type RoutineEditorValues } from "./RoutineEditor";

type RoutineDetailClientProps = {
  item: RoutineItem;
  recipes: Recipe[];
  workouts: Workout[];
};

const makeStorageKey = (id: string) => `routine-item-${id}`;

export default function RoutineDetailClient({
  item,
  recipes,
  workouts,
}: RoutineDetailClientProps) {
  const baseValues = useMemo<RoutineEditorValues>(
    () => ({
      time: item.time,
      title: item.title,
      notes: item.notes,
      alarmLabel: item.alarmLabel,
      notifications: true,
      type: item.type,
      targetId: item.targetId ?? "",
    }),
    [item.alarmLabel, item.notes, item.targetId, item.time, item.title, item.type],
  );

  const [initialValues, setInitialValues] = useState<RoutineEditorValues>(
    baseValues,
  );

  useEffect(() => {
    const stored = localStorage.getItem(makeStorageKey(item.id));
    if (!stored) {
      setInitialValues(baseValues);
      return;
    }
    try {
      const parsed = JSON.parse(stored) as Partial<RoutineEditorValues>;
      setInitialValues({ ...baseValues, ...parsed });
    } catch {
      setInitialValues(baseValues);
    }
  }, [baseValues, item.id]);

  const handleSave = (values: RoutineEditorValues) => {
    localStorage.setItem(makeStorageKey(item.id), JSON.stringify(values));
    setInitialValues(values);
  };

  return (
    <RoutineEditor
      item={item}
      recipes={recipes}
      workouts={workouts}
      initialValues={initialValues}
      onSave={handleSave}
    />
  );
}
