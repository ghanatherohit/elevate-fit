import GlassCard from "@/components/shared/GlassCard";
import { Skeleton } from "@/components/shared/Skeleton";

/** Guidance / health-plan style: section header + content cards. */
export default function SimplePageSkeleton() {
  return (
    <div className="grid gap-5" aria-busy="true">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-28" />
        <Skeleton className="h-3 w-16" />
      </div>
      <GlassCard className="grid gap-3">
        <Skeleton className="h-2.5 w-32" />
        <Skeleton className="h-3.5 w-48" />
        <Skeleton className="h-24 w-full" />
      </GlassCard>
      <GlassCard className="grid gap-3">
        <Skeleton className="h-11 w-full rounded-2xl border border-border" />
        <Skeleton className="h-11 w-full rounded-2xl border border-border" />
        <Skeleton className="h-11 w-full rounded-2xl border border-border" />
      </GlassCard>
    </div>
  );
}
