import LoadingShell from "@/components/loading/LoadingShell";
import GlassCard from "@/components/shared/GlassCard";
import { Skeleton } from "@/components/shared/Skeleton";

export default function Loading() {
  return (
    <LoadingShell>
      <div className="grid gap-5" aria-busy="true">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-3 w-14" />
        </div>
        <GlassCard className="grid gap-4">
          <Skeleton className="h-44 w-full rounded-2xl" />
          <Skeleton className="h-5 w-56" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-[80%]" />
          <div className="grid gap-2 sm:grid-cols-3">
            <Skeleton className="h-14 w-full rounded-xl" />
            <Skeleton className="h-14 w-full rounded-xl" />
            <Skeleton className="h-14 w-full rounded-xl" />
          </div>
          <Skeleton className="h-24 w-full" />
        </GlassCard>
      </div>
    </LoadingShell>
  );
}
