"use client";

import { useMemo } from "react";
import type { RoutineItem } from "@/lib/data/routines";
import { recipes } from "@/lib/data/recipes";
import { workouts } from "@/lib/data/workouts";
import RoutineEditor from "./RoutineEditor";
import type { RoutineEditorValues } from "./RoutineEditor";

const listKey = "routine-custom-items";

type RoutineDetailLoaderProps = {
  itemId: string;
  fallbackItem?: RoutineItem | null;
};

type RoutineLookup = {
  item: RoutineItem | null;
  initialValues: RoutineEditorValues | null;
};

const makeItemKey = (id: string) => `routine-item-${id}`;

export default function RoutineDetailLoader({
  itemId,
  fallbackItem = null,
}: RoutineDetailLoaderProps) {
  const lookup = useMemo<RoutineLookup>(() => {
    const resolveInitialValues = (item: RoutineItem): RoutineEditorValues => ({
      time: item.time,
      title: item.title,
      notes: item.notes,
      alarmLabel: item.alarmLabel,
      notifications: true,
      type: item.type,
      targetId: item.targetId ?? "",
    });

    if (typeof window === "undefined") {
      if (!fallbackItem) {
        return { item: null, initialValues: null };
      }
      return { item: fallbackItem, initialValues: resolveInitialValues(fallbackItem) };
    }

    const storedList = localStorage.getItem(listKey);
    let customItem: RoutineItem | null = null;
    if (storedList) {
      try {
        const parsed = JSON.parse(storedList) as RoutineItem[];
        customItem = parsed.find((entry) => entry.id === itemId) ?? null;
      } catch {
        customItem = null;
      }
    }

    const item = customItem ?? fallbackItem ?? null;
    if (!item) {
      return { item: null, initialValues: null };
    }

    let initialValues = resolveInitialValues(item);
    const storedItem = localStorage.getItem(makeItemKey(itemId));
    if (storedItem) {
      try {
        const parsed = JSON.parse(storedItem) as Partial<RoutineEditorValues>;
        initialValues = { ...initialValues, ...parsed };
      } catch {
        initialValues = { ...initialValues };
      }
    }

    return { item, initialValues };
  }, [fallbackItem, itemId]);

  const handleSave = (values: RoutineEditorValues) => {
    localStorage.setItem(makeItemKey(itemId), JSON.stringify(values));
  };

  if (!lookup.item || !lookup.initialValues) {
    return (
      <div className="rounded-2xl border border-border bg-card px-4 py-3 text-sm text-muted">
        Routine item not found.
      </div>
    );
  }

  return (
    <RoutineEditor
      key={lookup.item.id}
      item={lookup.item}
      recipes={recipes}
      workouts={workouts}
      initialValues={lookup.initialValues}
      onSave={handleSave}
    />
  );
}


