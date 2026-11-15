"use client";

import { useMemo, useState } from "react";
import RoutineListClient from "./RoutineListClient";
import RoutineDetailLoader from "./RoutineDetailLoader";
import { routineItems } from "@/lib/data/routines";

export default function RoutineSection() {
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  const fallbackItem = useMemo(() => {
    if (!selectedItemId) {
      return null;
    }
    return routineItems.find((entry) => entry.id === selectedItemId) ?? null;
  }, [selectedItemId]);

  if (selectedItemId) {
    return (
      <div className="grid gap-4">
        <button
          type="button"
          className="soft-chip w-fit text-xs text-muted transition hover:text-foreground"
          onClick={() => setSelectedItemId(null)}
        >
          ← Back to schedule
        </button>
        <div className="glass-card p-4">
          <div className="mb-3">
            <div className="text-xs text-muted">Task detail</div>
            <div className="text-sm font-semibold text-foreground">Edit and save</div>
          </div>
          <RoutineDetailLoader itemId={selectedItemId} fallbackItem={fallbackItem} />
        </div>
      </div>
    );
  }

  return <RoutineListClient onOpenItem={setSelectedItemId} />;
}
