import DashboardShell from "@/components/DashboardShell";
import RecipesClient from "@/components/RecipesClient";

export default function RecipesPage() {
  return (
    <DashboardShell>
      <RecipesClient />
    </DashboardShell>
  );
}
