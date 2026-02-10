"use client";

import { useEffect, useMemo, useState } from "react";
import type { Recipe } from "@/lib/data/recipes";

export type RecipeEditorValues = {
  title: string;
  meal: Recipe["meal"];
  protein: string;
  benefits: string;
  ingredients: string[];
  steps: string[];
};

type RecipeEditorProps = {
  recipe: Recipe;
  initialValues?: RecipeEditorValues;
  onSave?: (values: RecipeEditorValues) => void;
};

const toTextarea = (items: string[]) => items.join("\n");
const toList = (value: string) =>
  value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);

export default function RecipeEditor({
  recipe,
  initialValues,
  onSave,
}: RecipeEditorProps) {
  const baseValues = useMemo<RecipeEditorValues>(
    () => ({
      title: recipe.title,
      meal: recipe.meal,
      protein: recipe.protein,
      benefits: recipe.benefits,
      ingredients: recipe.ingredients,
      steps: recipe.steps,
    }),
    [
      recipe.benefits,
      recipe.ingredients,
      recipe.meal,
      recipe.protein,
      recipe.steps,
      recipe.title,
    ],
  );

  const resolvedValues = initialValues ?? baseValues;

  const [title, setTitle] = useState(resolvedValues.title);
  const [meal, setMeal] = useState<Recipe["meal"]>(resolvedValues.meal);
  const [protein, setProtein] = useState(resolvedValues.protein);
  const [benefits, setBenefits] = useState(resolvedValues.benefits);
  const [ingredientsText, setIngredientsText] = useState(
    toTextarea(resolvedValues.ingredients),
  );
  const [stepsText, setStepsText] = useState(toTextarea(resolvedValues.steps));

  useEffect(() => {
    setTitle(resolvedValues.title);
    setMeal(resolvedValues.meal);
    setProtein(resolvedValues.protein);
    setBenefits(resolvedValues.benefits);
    setIngredientsText(toTextarea(resolvedValues.ingredients));
    setStepsText(toTextarea(resolvedValues.steps));
  }, [resolvedValues]);

  return (
    <div className="grid gap-4">
      <div className="grid gap-2">
        <label className="text-xs text-[color:var(--muted)]">Title</label>
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] px-4 py-3 text-sm text-[color:var(--text)]"
        />
      </div>
      <div className="grid gap-2">
        <label className="text-xs text-[color:var(--muted)]">Meal</label>
        <select
          value={meal}
          onChange={(event) => setMeal(event.target.value as Recipe["meal"])}
          className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] px-4 py-3 text-sm text-[color:var(--text)]"
        >
          <option value="Breakfast">Breakfast</option>
          <option value="Lunch">Lunch</option>
          <option value="Dinner">Dinner</option>
          <option value="Snack">Snack</option>
        </select>
      </div>
      <div className="grid gap-2">
        <label className="text-xs text-[color:var(--muted)]">Protein</label>
        <input
          value={protein}
          onChange={(event) => setProtein(event.target.value)}
          className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] px-4 py-3 text-sm text-[color:var(--text)]"
        />
      </div>
      <div className="grid gap-2">
        <label className="text-xs text-[color:var(--muted)]">Benefits</label>
        <textarea
          value={benefits}
          onChange={(event) => setBenefits(event.target.value)}
          rows={2}
          className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] px-4 py-3 text-sm text-[color:var(--text)]"
        />
      </div>
      <div className="grid gap-2">
        <label className="text-xs text-[color:var(--muted)]">Ingredients</label>
        <textarea
          value={ingredientsText}
          onChange={(event) => setIngredientsText(event.target.value)}
          rows={4}
          className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] px-4 py-3 text-sm text-[color:var(--text)]"
        />
        <div className="text-[10px] text-[color:var(--muted)]">
          One per line
        </div>
      </div>
      <div className="grid gap-2">
        <label className="text-xs text-[color:var(--muted)]">Steps</label>
        <textarea
          value={stepsText}
          onChange={(event) => setStepsText(event.target.value)}
          rows={4}
          className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] px-4 py-3 text-sm text-[color:var(--text)]"
        />
        <div className="text-[10px] text-[color:var(--muted)]">
          One per line
        </div>
      </div>
      <button
        className="rounded-2xl bg-[color:var(--accent)]/15 px-4 py-3 text-sm font-semibold text-[color:var(--accent)]"
        onClick={() =>
          onSave?.({
            title,
            meal,
            protein,
            benefits,
            ingredients: toList(ingredientsText),
            steps: toList(stepsText),
          })
        }
      >
        Save changes (local)
      </button>
    </div>
  );
}
