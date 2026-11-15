import { Skeleton } from "@/components/shared/Skeleton";

/** Mirrors GymClient: short chips + single pager card. */
export default function GymSkeleton() {
  return (
    <div className="grid gap-5" aria-busy="true" aria-label="Loading gym">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-12" />
        <Skeleton className="h-3 w-28" />
      </div>

      <div className="grid grid-cols-2 gap-1 rounded-2xl bg-card-strong/40 p-1">
        <Skeleton className="h-10 w-full rounded-xl" />
        <Skeleton className="h-10 w-full rounded-xl" />
      </div>

      <div className="flex gap-1.5 overflow-hidden">
        {[0, 1, 2, 3].map((key) => (
          <Skeleton key={key} className="h-7 w-20 shrink-0 rounded-xl" />
        ))}
      </div>

      <div className="glass-card grid gap-4 p-4">
        <div className="flex items-start gap-2">
          <Skeleton className="mt-0.5 h-7 w-8 shrink-0 rounded-xl" />
          <div className="grid min-w-0 flex-1 justify-items-center gap-1.5">
            <Skeleton className="h-4 w-52" />
            <Skeleton className="h-2.5 w-36" />
          </div>
          <Skeleton className="mt-0.5 h-7 w-8 shrink-0 rounded-xl" />
        </div>
        <Skeleton className="h-28 w-full rounded-xl" />
      </div>
    </div>
  );
}
