import GlassCard from "@/components/shared/GlassCard";
import { ChartBlock, StatStrip } from "@/components/shared/DataSurfaces";
import { Skeleton } from "@/components/shared/Skeleton";

/** Mirrors ProgressClient layout. */
export default function ProgressSkeleton() {
  return (
    <div className="grid gap-5" aria-busy="true" aria-label="Loading progress">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-3 w-14" />
      </div>

      <GlassCard className="grid gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="grid gap-2">
            <Skeleton className="h-2.5 w-32" />
            <Skeleton className="h-3.5 w-28" />
          </div>
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-7 w-12 rounded-xl" />
            <Skeleton className="h-7 w-14 rounded-xl" />
            <Skeleton className="h-7 w-16 rounded-xl" />
            <Skeleton className="h-7 w-14 rounded-xl" />
          </div>
        </div>

        <StatStrip>
          {[0, 1, 2, 3].map((key) => (
            <div key={key} className="stat-cell">
              <Skeleton className="h-2 w-8" />
              <Skeleton className="mt-2 h-3.5 w-10" />
              <Skeleton className="mt-1 h-2 w-12" />
            </div>
          ))}
        </StatStrip>

        <div className="grid gap-4 lg:grid-cols-[1.6fr_0.9fr] lg:gap-6">
          <div className="chart-stack">
            <ChartBlock title={<Skeleton className="h-2.5 w-24" />}>
              <div className="flex items-center justify-between gap-2">
                <Skeleton className="h-9 w-10 rounded-xl" />
                <div className="grid flex-1 place-items-center gap-2">
                  <Skeleton className="h-3.5 w-28" />
                  <Skeleton className="h-2.5 w-24" />
                </div>
                <Skeleton className="h-9 w-10 rounded-xl" />
              </div>
            </ChartBlock>

            <ChartBlock title={<Skeleton className="h-2.5 w-28" />}>
              <Skeleton className="h-36 w-full" />
            </ChartBlock>

            <ChartBlock title={<Skeleton className="h-2.5 w-28" />}>
              <Skeleton className="h-28 w-full" />
            </ChartBlock>
          </div>

          <ChartBlock title={<Skeleton className="h-2.5 w-24" />} className="lg:self-start">
            <div className="flex justify-center">
              <Skeleton className="h-36 w-36 rounded-full" />
            </div>
            <Skeleton className="mx-auto mt-3 h-2.5 w-28" />
          </ChartBlock>
        </div>
      </GlassCard>
    </div>
  );
}
