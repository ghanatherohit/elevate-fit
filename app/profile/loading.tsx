import LoadingShell from "@/components/loading/LoadingShell";
import ProfileSkeleton from "@/components/loading/ProfileSkeleton";

export default function Loading() {
  return (
    <LoadingShell>
      <ProfileSkeleton />
    </LoadingShell>
  );
}
