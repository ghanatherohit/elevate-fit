import LoadingShell from "@/components/loading/LoadingShell";
import RoutineSkeleton from "@/components/loading/RoutineSkeleton";

export default function Loading() {
  return (
    <LoadingShell>
      <RoutineSkeleton />
    </LoadingShell>
  );
}
