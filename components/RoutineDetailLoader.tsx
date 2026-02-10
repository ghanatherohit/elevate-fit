"use client";

import { useEffect, useMemo, useState } from "react";
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
  const baseValues = useMemo<RoutineEditorValues | null>(() => {
    if (!fallbackItem) {
      return null;
    }
    return {
      time: fallbackItem.time,
      title: fallbackItem.title,
      notes: fallbackItem.notes,
      alarmLabel: fallbackItem.alarmLabel,
      notifications: true,
      type: fallbackItem.type,
      targetId: fallbackItem.targetId ?? "",
    };
  }, [fallbackItem]);

  const [lookup, setLookup] = useState<RoutineLookup>({
    item: fallbackItem ?? null,
    initialValues: baseValues,
  });

  useEffect(() => {
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
      setLookup({ item: null, initialValues: null });
      return;
    }

    let initialValues = {
      time: item.time,
      title: item.title,
      notes: item.notes,
      alarmLabel: item.alarmLabel,
      notifications: true,
      type: item.type,
      targetId: item.targetId ?? "",
    } satisfies RoutineEditorValues;

    const storedItem = localStorage.getItem(makeItemKey(itemId));
    if (storedItem) {
      try {
        const parsed = JSON.parse(storedItem) as Partial<RoutineEditorValues>;
        initialValues = { ...initialValues, ...parsed };
      } catch {
        initialValues = { ...initialValues };
      }
    }

    setLookup({ item, initialValues });
  }, [fallbackItem, itemId, baseValues]);

  const handleSave = (values: RoutineEditorValues) => {
    localStorage.setItem(makeItemKey(itemId), JSON.stringify(values));
    setLookup((prev) => ({ ...prev, initialValues: values }));
  };

  if (!lookup.item || !lookup.initialValues) {
    return (
      <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] px-4 py-3 text-sm text-[color:var(--muted)]">
        Routine item not found.
      </div>
    );
  }

  return (
    <RoutineEditor
      item={lookup.item}
      recipes={recipes}
      workouts={workouts}
      initialValues={lookup.initialValues}
      onSave={handleSave}
    />
  );
}
