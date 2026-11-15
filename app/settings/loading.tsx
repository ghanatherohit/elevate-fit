import LoadingShell from "@/components/loading/LoadingShell";
import SettingsSkeleton from "@/components/loading/SettingsSkeleton";

export default function Loading() {
  return (
    <LoadingShell>
      <SettingsSkeleton />
    </LoadingShell>
  );
}
