import LoadingShell from "@/components/loading/LoadingShell";
import GymSkeleton from "@/components/loading/GymSkeleton";

export default function Loading() {
  return (
    <LoadingShell>
      <GymSkeleton />
    </LoadingShell>
  );
}
