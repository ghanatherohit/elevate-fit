import GlassCard from "@/components/shared/GlassCard";
import { DataList, DataRow } from "@/components/shared/DataSurfaces";
import { Skeleton } from "@/components/shared/Skeleton";

/** Mirrors RecipesClient tabs: Meals browse list. */
export default function RecipesSkeleton() {
  return (
    <div className="grid gap-3" aria-busy="true" aria-label="Loading recipes">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-3 w-16" />
      </div>

      <div className="grid grid-cols-2 gap-1 rounded-2xl bg-card-strong/40 p-1">
        <Skeleton className="h-14 w-full rounded-xl" />
        <Skeleton className="h-14 w-full rounded-xl" />
      </div>

      <GlassCard className="grid gap-2.5">
        <div className="grid gap-1.5">
          <Skeleton className="h-2.5 w-10" />
          <Skeleton className="h-3.5 w-20" />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[0, 1].map((key) => (
            <div key={key} className="grid gap-1">
              <div className="flex justify-between">
                <Skeleton className="h-2.5 w-14" />
                <Skeleton className="h-2.5 w-24" />
              </div>
              <Skeleton className="h-1.5 w-full rounded-full" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {[0, 1, 2].map((key) => (
            <div key={key} className="soft-tile grid gap-1.5 px-3 py-2.5">
              <Skeleton className="h-2 w-12" />
              <Skeleton className="h-3.5 w-[80%]" />
              <Skeleton className="h-2.5 w-28" />
            </div>
          ))}
        </div>
      </GlassCard>

      <GlassCard className="grid gap-2.5">
        <div className="flex items-center justify-between">
          <Skeleton className="h-3.5 w-14" />
          <Skeleton className="h-6 w-16 rounded-xl" />
        </div>
        <Skeleton className="h-9 w-full rounded-xl" />
        <div className="grid grid-cols-4 gap-1 rounded-xl bg-card-strong/40 p-1">
          {[0, 1, 2, 3].map((key) => (
            <Skeleton key={key} className="h-10 w-full rounded-lg" />
          ))}
        </div>
      </GlassCard>

      <DataList>
        {Array.from({ length: 6 }).map((_, index) => (
          <DataRow key={index} className="items-center gap-2">
            <div className="grid min-w-0 flex-1 gap-1.5">
              <Skeleton className="h-3.5 w-[65%]" />
              <Skeleton className="h-2.5 w-36" />
            </div>
            <Skeleton className="h-6 w-12 rounded-xl" />
            <Skeleton className="h-3 w-3" />
          </DataRow>
        ))}
      </DataList>
    </div>
  );
}
