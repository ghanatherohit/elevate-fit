import GlassCard from "@/components/shared/GlassCard";
import { DataList, DataRow } from "@/components/shared/DataSurfaces";
import { Skeleton } from "@/components/shared/Skeleton";

/** Mirrors ProfileClient: identity card + account fields + save. */
export default function ProfileSkeleton() {
  return (
    <div className="grid gap-3" aria-busy="true" aria-label="Loading profile">
      <Skeleton className="h-5 w-20" />

      <GlassCard className="grid gap-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-16 w-16 rounded-2xl" />
          <div className="grid min-w-0 flex-1 gap-1.5">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-2.5 w-24" />
            <Skeleton className="h-2.5 w-40" />
          </div>
        </div>
        <Skeleton className="h-7 w-24 rounded-xl" />
      </GlassCard>

      <GlassCard className="overflow-hidden p-0">
        <DataList>
          {[0, 1, 2].map((key) => (
            <DataRow key={key} className="mx-1 !items-start !py-3">
              <div className="grid min-w-0 flex-1 gap-1.5">
                <Skeleton className="h-3.5 w-20" />
                <Skeleton className="h-10 w-full rounded-xl" />
              </div>
            </DataRow>
          ))}
        </DataList>
      </GlassCard>

      <Skeleton className="h-11 w-full rounded-xl" />
    </div>
  );
}
