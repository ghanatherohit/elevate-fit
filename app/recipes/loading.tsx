import LoadingShell from "@/components/loading/LoadingShell";
import RecipesSkeleton from "@/components/loading/RecipesSkeleton";

export default function Loading() {
  return (
    <LoadingShell>
      <RecipesSkeleton />
    </LoadingShell>
  );
}
