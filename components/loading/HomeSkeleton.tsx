import GlassCard from "@/components/shared/GlassCard";
import { DataList, DataRow } from "@/components/shared/DataSurfaces";
import { Skeleton } from "@/components/shared/Skeleton";

/** Mirrors compact HomeClient: header, today, focus, meals, week, shortcuts. */
export default function HomeSkeleton() {
  return (
    <div className="grid gap-3" aria-busy="true" aria-label="Loading home">
      <header className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Skeleton className="h-11 w-11 rounded-2xl" />
          <div className="grid gap-1.5">
            <Skeleton className="h-2.5 w-20" />
            <Skeleton className="h-4 w-28" />
          </div>
        </div>
        <Skeleton className="h-8 w-16 rounded-xl" />
      </header>

      <GlassCard className="grid gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="grid gap-1.5">
            <Skeleton className="h-2.5 w-12" />
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-2.5 w-40" />
          </div>
          <Skeleton className="h-16 w-16 shrink-0 rounded-full" />
        </div>
        <div className="grid grid-cols-3 gap-2 border-t border-border/40 pt-3">
          {[0, 1, 2].map((key) => (
            <div key={key} className="stat-cell grid gap-1.5">
              <Skeleton className="h-2 w-10" />
              <Skeleton className="h-3.5 w-12" />
            </div>
          ))}
        </div>
      </GlassCard>

      <GlassCard className="grid gap-3">
        <div className="flex items-center justify-between">
          <div className="grid gap-1.5">
            <Skeleton className="h-2.5 w-10" />
            <Skeleton className="h-2.5 w-14" />
          </div>
          <Skeleton className="h-2.5 w-12" />
        </div>
        <div className="flex items-start gap-3">
          <Skeleton className="h-10 w-10 shrink-0 rounded-xl" />
          <div className="grid min-w-0 flex-1 gap-1.5">
            <Skeleton className="h-4 w-[70%]" />
            <Skeleton className="h-2.5 w-28" />
          </div>
          <Skeleton className="h-7 w-14 rounded-xl" />
        </div>
      </GlassCard>

      <GlassCard className="grid gap-3">
        <div className="flex items-center justify-between">
          <div className="grid gap-1.5">
            <Skeleton className="h-2.5 w-12" />
            <Skeleton className="h-3.5 w-36" />
          </div>
          <Skeleton className="h-7 w-16 rounded-xl" />
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {[0, 1, 2].map((key) => (
            <div key={key} className="soft-tile grid gap-1.5 px-3 py-2.5">
              <Skeleton className="h-2 w-14" />
              <Skeleton className="h-3.5 w-[80%]" />
              <Skeleton className="h-2.5 w-24" />
            </div>
          ))}
        </div>
      </GlassCard>

      <GlassCard className="grid gap-2.5">
        <div className="flex items-center justify-between">
          <div className="grid gap-1.5">
            <Skeleton className="h-2.5 w-16" />
            <Skeleton className="h-4 w-14" />
            <Skeleton className="h-2.5 w-28" />
          </div>
          <Skeleton className="h-3 w-3" />
        </div>
        <Skeleton className="h-1.5 w-full rounded-full" />
      </GlassCard>

      <GlassCard className="grid gap-2.5">
        <div className="grid gap-1.5">
          <Skeleton className="h-2.5 w-16" />
          <Skeleton className="h-3.5 w-20" />
        </div>
        <DataList>
          {[0, 1, 2, 3].map((key) => (
            <DataRow key={key} className="justify-between gap-2">
              <div className="grid gap-1.5">
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="h-2.5 w-28" />
              </div>
              <Skeleton className="h-3 w-3" />
            </DataRow>
          ))}
        </DataList>
      </GlassCard>
    </div>
  );
}
