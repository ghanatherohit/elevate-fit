import DashboardShell from "@/components/layout/DashboardShell";
import RecipesClient from "@/components/recipes/RecipesClient";

export default function RecipesPage() {
  return (
    <DashboardShell>
      <RecipesClient />
    </DashboardShell>
  );
}

