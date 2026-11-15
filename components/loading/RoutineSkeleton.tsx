import GlassCard from "@/components/shared/GlassCard";
import { DataList, DataRow } from "@/components/shared/DataSurfaces";
import { Skeleton } from "@/components/shared/Skeleton";

/** Mirrors RoutineClient tabs + schedule calendar + day panel. */
export default function RoutineSkeleton() {
  return (
    <div className="grid gap-5" aria-busy="true" aria-label="Loading routine">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-3 w-20" />
      </div>

      <div className="grid grid-cols-2 gap-1 rounded-2xl bg-card-strong/40 p-1">
        <Skeleton className="h-14 w-full rounded-xl" />
        <Skeleton className="h-14 w-full rounded-xl" />
      </div>

      <GlassCard className="grid gap-4">
        <div className="flex items-center justify-between gap-3">
          <div className="grid gap-2">
            <Skeleton className="h-2.5 w-16" />
            <Skeleton className="h-3.5 w-36" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-8 w-8 rounded-xl" />
            <Skeleton className="h-8 w-8 rounded-xl" />
            <Skeleton className="h-8 w-28 rounded-xl" />
          </div>
        </div>
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: 7 }).map((_, index) => (
            <div
              key={index}
              className="grid place-items-center gap-1 rounded-2xl bg-card-strong/35 px-1 py-2.5"
            >
              <Skeleton className="h-2 w-6" />
              <Skeleton className="h-4 w-5" />
              <Skeleton className="h-1 w-6 rounded-full" />
            </div>
          ))}
        </div>
      </GlassCard>

      <div className="glass-card grid gap-4 p-4">
        <div className="flex items-center justify-between">
          <div className="grid gap-2">
            <Skeleton className="h-3.5 w-40" />
            <Skeleton className="h-2.5 w-28" />
          </div>
          <Skeleton className="h-7 w-20 rounded-xl" />
        </div>
        <Skeleton className="h-1.5 w-full rounded-full" />
        <DataList>
          {Array.from({ length: 5 }).map((_, index) => (
            <DataRow key={index} className="gap-3 px-1">
              <Skeleton className="h-5 w-5 rounded-md" />
              <div className="grid min-w-0 flex-1 gap-2">
                <Skeleton className="h-2.5 w-16" />
                <Skeleton className="h-3.5 w-[65%]" />
              </div>
              <Skeleton className="h-3 w-3" />
            </DataRow>
          ))}
        </DataList>
      </div>
    </div>
  );
}
