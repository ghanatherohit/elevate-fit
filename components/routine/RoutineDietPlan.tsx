"use client";

import { useEffect, useMemo, useState } from "react";
import GlassCard from "@/components/shared/GlassCard";
import { type Recipe } from "@/lib/data/recipes";

type RoutineMeal = "Breakfast" | "Lunch" | "Dinner";

type DailyDietMeal = {
  meal: RoutineMeal;
  targetCalories: number;
  targetProteinG: number;
  portionMultiplier: number;
  adjustedCalories: number;
  adjustedProteinG: number;
  recipe: Recipe;
};

type DailyDietApiResponse = {
  meals?: DailyDietMeal[];
  totals?: {
    plannedCalories: number;
    plannedProteinG: number;
    targetCalories: number;
    targetProteinG: number;
    calorieGap: number;
    proteinGap: number;
  };
  onboardingRequired?: boolean;
  error?: string;
};

const mealOrder: RoutineMeal[] = ["Breakfast", "Lunch", "Dinner"];

export default function RoutineDietPlan() {
  const [meals, setMeals] = useState<DailyDietMeal[]>([]);
  const [totals, setTotals] = useState<DailyDietApiResponse["totals"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadPlan = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/diet/daily", { cache: "no-store" });
        const data = (await response.json()) as DailyDietApiResponse;

        if (!response.ok) {
          if (data.onboardingRequired) {
            throw new Error("Complete your diet profile in Recipes to unlock daily routine meal planning.");
          }
          throw new Error(data.error || "Failed to load diet plan");
        }

        if (!cancelled) {
          setMeals(data.meals ?? []);
          setTotals(data.totals ?? null);
        }
      } catch (loadError) {
        if (!cancelled) {
          const message =
            loadError instanceof Error ? loadError.message : "Failed to load diet plan";
          setError(message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadPlan();

    return () => {
      cancelled = true;
    };
  }, []);

  const mealsByOrder = useMemo(
    () =>
      mealOrder
        .map((meal) => meals.find((entry) => entry.meal === meal) ?? null)
        .filter((entry): entry is DailyDietMeal => Boolean(entry)),
    [meals],
  );

  return (
    <GlassCard className="grid gap-3">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-foreground">Diet-linked routine meals</div>
        <div className="text-[10px] text-muted">Synced from Recipes targets</div>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-border bg-card px-3 py-3 text-xs text-muted">
          Loading daily meal plan...
        </div>
      ) : null}

      {error ? (
        <div className="rounded-2xl border border-border bg-card px-3 py-3 text-xs text-accent">
          {error}
        </div>
      ) : null}

      {!loading && !error ? (
        <>
          <div className="grid gap-2 sm:grid-cols-3">
            {mealsByOrder.map((entry) => (
              <div
                key={entry.meal}
                className="rounded-2xl border border-border bg-card px-3 py-3"
              >
                <div className="text-[10px] text-muted">{entry.meal}</div>
                <div className="mt-1 text-xs font-semibold text-foreground line-clamp-2">
                  {entry.recipe.title}
                </div>
                <div className="mt-1 text-[10px] text-muted">
                  Target: {entry.targetCalories} kcal / {entry.targetProteinG}g protein
                </div>
                <div className="mt-0.5 text-[10px] text-muted">
                  Portion: x{entry.portionMultiplier.toFixed(2)}
                </div>
                <div className="mt-0.5 text-[10px] text-muted">
                  Adjusted: {entry.adjustedCalories} kcal / {entry.adjustedProteinG}g protein
                </div>
              </div>
            ))}
          </div>

          {totals ? (
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="rounded-2xl border border-border bg-card px-3 py-2">
                <div className="text-[10px] text-muted">Calories completion</div>
                <div className="text-xs font-semibold text-foreground">
                  {totals.plannedCalories} / {totals.targetCalories} kcal
                </div>
              </div>
              <div className="rounded-2xl border border-border bg-card px-3 py-2">
                <div className="text-[10px] text-muted">Protein completion</div>
                <div className="text-xs font-semibold text-foreground">
                  {totals.plannedProteinG} / {totals.targetProteinG} g
                </div>
              </div>
            </div>
          ) : null}
        </>
      ) : null}
    </GlassCard>
  );
}



