import LoadingShell from "@/components/loading/LoadingShell";
import ProgressSkeleton from "@/components/loading/ProgressSkeleton";

export default function Loading() {
  return (
    <LoadingShell>
      <ProgressSkeleton />
    </LoadingShell>
  );
}
