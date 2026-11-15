import LoadingShell from "@/components/loading/LoadingShell";
import HomeSkeleton from "@/components/loading/HomeSkeleton";

export default function Loading() {
  return (
    <LoadingShell showBack={false}>
      <HomeSkeleton />
    </LoadingShell>
  );
}
