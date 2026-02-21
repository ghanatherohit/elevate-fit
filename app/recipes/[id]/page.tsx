import DashboardShell from "@/components/layout/DashboardShell";
import GlassCard from "@/components/shared/GlassCard";
import RecipeDetailClient from "@/components/recipes/RecipeDetailClient";
import SectionHeader from "@/components/shared/SectionHeader";
import { recipes } from "@/lib/data/recipes";
import { notFound } from "next/navigation";

type RecipeDetailProps = {
  params: { id: string };
};

export default function RecipeDetailPage({ params }: RecipeDetailProps) {
  const recipe = recipes.find((entry) => entry.id === params.id);

  if (!recipe) {
    notFound();
  }

  return (
    <DashboardShell>
      <SectionHeader title={recipe.title} action={recipe.meal} />
      <GlassCard className="grid gap-4">
        <RecipeDetailClient recipe={recipe} />
      </GlassCard>
    </DashboardShell>
  );
}

