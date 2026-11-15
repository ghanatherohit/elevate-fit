import GlassCard from "@/components/shared/GlassCard";
import { DataList, DataRow } from "@/components/shared/DataSurfaces";
import { Skeleton } from "@/components/shared/Skeleton";

/** Mirrors compact Settings list: Profile, Theme, Notifications, Logout. */
export default function SettingsSkeleton() {
  return (
    <div className="grid gap-3" aria-busy="true" aria-label="Loading settings">
      <Skeleton className="h-5 w-24" />

      <GlassCard className="overflow-hidden p-0">
        <DataList>
          {[0, 1, 2, 3].map((key) => (
            <DataRow key={key} className="mx-1">
              <div className="grid min-w-0 flex-1 gap-1.5">
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
