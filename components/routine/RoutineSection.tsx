"use client";

import { useMemo, useState } from "react";
import GlassCard from "@/components/shared/GlassCard";
import RoutineHeader from "./RoutineHeader";
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

  return (
    <GlassCard className="flex flex-col gap-4">
      <RoutineHeader
        title={selectedItemId ? "Routine detail" : "Weekly routine"}
        subtitle={selectedItemId ? "Edit and save" : "Day-wise with dates"}
      />

      {selectedItemId ? (
        <div className="grid gap-3">
          <button
            className="w-fit rounded-2xl border border-border bg-card px-4 py-2 text-xs text-muted"
            onClick={() => setSelectedItemId(null)}
          >
            Back to week view
          </button>
          <RoutineDetailLoader itemId={selectedItemId} fallbackItem={fallbackItem} />
        </div>
      ) : (
        <RoutineListClient onOpenItem={setSelectedItemId} />
      )}
    </GlassCard>
  );
}


