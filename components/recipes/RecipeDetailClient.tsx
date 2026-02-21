"use client";

import { useMemo, useState } from "react";
import type { Recipe } from "@/lib/data/recipes";
import RecipeEditor, { type RecipeEditorValues } from "./RecipeEditor";
import GlassCard from "@/components/shared/GlassCard";

type RecipeDetailClientProps = {
  recipe: Recipe;
};

const makeStorageKey = (id: string) => `recipe-item-${id}`;

export default function RecipeDetailClient({ recipe }: RecipeDetailClientProps) {
  const baseValues = useMemo<RecipeEditorValues>(
    () => ({
      title: recipe.title,
      description: recipe.description,
      meal: recipe.meal,
      timeMinutes: recipe.timeMinutes,
      serving: recipe.serving,
      protein: recipe.protein,
      benefits: recipe.benefits,
      tags: recipe.tags,
      ingredients: recipe.ingredients,
      steps: recipe.steps,
    }),
    [
      recipe.benefits,
      recipe.description,
      recipe.ingredients,
      recipe.meal,
      recipe.protein,
      recipe.serving,
      recipe.steps,
      recipe.tags,
      recipe.timeMinutes,
      recipe.title,
    ],
  );

  const [viewMode, setViewMode] = useState<"view" | "edit">("view");

  const initialValues = useMemo(() => {
    if (typeof window === "undefined") {
      return baseValues;
    }
    const stored = localStorage.getItem(makeStorageKey(recipe.id));
    if (!stored) {
      return baseValues;
    }
    try {
      const parsed = JSON.parse(stored) as Partial<RecipeEditorValues>;
      return { ...baseValues, ...parsed };
    } catch {
      return baseValues;
    }
  }, [baseValues, recipe.id]);

  const handleSave = (values: RecipeEditorValues) => {
    localStorage.setItem(makeStorageKey(recipe.id), JSON.stringify(values));
    setViewMode("view");
  };

  if (viewMode === "edit") {
    return (
      <div className="grid gap-4">
        <button
          className="self-start rounded-2xl border border-border px-4 py-2 text-xs text-muted"
          onClick={() => setViewMode("view")}
        >
          Cancel
        </button>
        <RecipeEditor
          recipe={recipe}
          initialValues={initialValues}
          onSave={handleSave}
        />
      </div>
    );
  }

  const n = recipe.nutrition;

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between">
        <div className="text-xs text-muted">{recipe.description}</div>
        <button
          className="rounded-2xl border border-border px-3 py-1 text-xs text-muted transition hover:border-accent/40"
          onClick={() => setViewMode("edit")}
        >
          Edit
        </button>
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card-strong px-4 py-3">
          <div className="text-[10px] text-muted">Time</div>
          <div className="text-sm font-semibold text-foreground">{recipe.timeMinutes} min</div>
        </div>
        <div className="rounded-2xl border border-border bg-card-strong px-4 py-3">
          <div className="text-[10px] text-muted">Protein</div>
          <div className="text-sm font-semibold text-foreground">{recipe.protein}</div>
        </div>
        <div className="rounded-2xl border border-border bg-card-strong px-4 py-3">
          <div className="text-[10px] text-muted">Serving</div>
          <div className="text-sm font-semibold text-foreground">{recipe.serving}</div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {recipe.tags.map((tag) => (
          <div
            key={tag}
            className="rounded-full border border-border bg-card-strong px-3 py-1 text-[10px] text-muted"
          >
            {tag}
          </div>
        ))}
      </div>

      <GlassCard>
        <div className="grid gap-3">
          <div className="text-sm font-semibold text-foreground">Nutrition Facts</div>
          <div className="text-xs text-muted">{recipe.serving}</div>
          <div className="grid gap-2">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <span className="text-xs font-semibold text-foreground">Calories</span>
              <span className="text-xs font-semibold text-foreground">{n.calories} kcal</span>
            </div>
            <div className="grid gap-1.5 text-xs text-muted">
              <div className="flex justify-between">
                <span>Protein</span>
                <span>{n.protein_g} g</span>
              </div>
              <div className="flex justify-between">
                <span>Carbohydrates</span>
                <span>{n.carbs_g} g</span>
              </div>
              <div className="flex justify-between">
                <span>Fat</span>
                <span>{n.fat_g} g</span>
              </div>
              <div className="flex justify-between">
                <span>Fiber</span>
                <span>{n.fiber_g} g</span>
              </div>
              <div className="flex justify-between">
                <span>Sugar</span>
                <span>{n.sugar_g} g</span>
              </div>
              <div className="flex justify-between border-t border-border pt-1.5">
                <span>Sodium</span>
                <span>{n.sodium_mg} mg</span>
              </div>
              <div className="flex justify-between">
                <span>Cholesterol</span>
                <span>{n.cholesterol_mg} mg</span>
              </div>
              <div className="flex justify-between">
                <span>Iron</span>
                <span>{n.iron_mg} mg</span>
              </div>
              <div className="flex justify-between">
                <span>Calcium</span>
                <span>{n.calcium_mg} mg</span>
              </div>
              <div className="flex justify-between">
                <span>Potassium</span>
                <span>{n.potassium_mg} mg</span>
              </div>
              <div className="flex justify-between">
                <span>Magnesium</span>
                <span>{n.magnesium_mg} mg</span>
              </div>
              <div className="flex justify-between border-t border-border pt-1.5">
                <span>Vitamin A</span>
                <span>{n.vitaminA_mcg} mcg</span>
              </div>
              <div className="flex justify-between">
                <span>Vitamin C</span>
                <span>{n.vitaminC_mg} mg</span>
              </div>
              <div className="flex justify-between">
                <span>Vitamin D</span>
                <span>{n.vitaminD_mcg} mcg</span>
              </div>
            </div>
          </div>
        </div>
      </GlassCard>

      <div className="grid gap-3">
        <div className="text-sm font-semibold text-foreground">Ingredients</div>
        <ul className="grid gap-2">
          {recipe.ingredients.map((ingredient, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-muted">
              <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-accent" />
              <span>{ingredient}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="grid gap-3">
        <div className="text-sm font-semibold text-foreground">Steps</div>
        <ol className="grid gap-2">
          {recipe.steps.map((step, i) => (
            <li key={i} className="flex items-start gap-3 text-xs text-muted">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/15 text-[10px] font-semibold text-accent">
                {i + 1}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </div>

      <div className="rounded-2xl border border-border bg-card-strong px-4 py-3 text-xs text-muted">
        <strong className="text-foreground">Benefits:</strong> {recipe.benefits}
      </div>
    </div>
  );
}


