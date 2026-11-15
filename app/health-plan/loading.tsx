import LoadingShell from "@/components/loading/LoadingShell";
import SimplePageSkeleton from "@/components/loading/SimplePageSkeleton";

export default function Loading() {
  return (
    <LoadingShell>
      <SimplePageSkeleton />
    </LoadingShell>
  );
}
