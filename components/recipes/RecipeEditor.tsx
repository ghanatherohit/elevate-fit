"use client";

import { useEffect, useMemo, useState } from "react";
import type { Recipe } from "@/lib/data/recipes";

export type RecipeEditorValues = {
  title: string;
  description: string;
  meal: Recipe["meal"];
  timeMinutes: number;
  serving: string;
  protein: string;
  benefits: string;
  tags: string[];
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

  const resolvedValues = initialValues ?? baseValues;

  const [title, setTitle] = useState(resolvedValues.title);
  const [description, setDescription] = useState(resolvedValues.description);
  const [meal, setMeal] = useState<Recipe["meal"]>(resolvedValues.meal);
  const [timeMinutes, setTimeMinutes] = useState(resolvedValues.timeMinutes);
  const [serving, setServing] = useState(resolvedValues.serving);
  const [protein, setProtein] = useState(resolvedValues.protein);
  const [benefits, setBenefits] = useState(resolvedValues.benefits);
  const [tagsText, setTagsText] = useState(toTextarea(resolvedValues.tags));
  const [ingredientsText, setIngredientsText] = useState(
    toTextarea(resolvedValues.ingredients),
  );
  const [stepsText, setStepsText] = useState(toTextarea(resolvedValues.steps));

  useEffect(() => {
    setTitle(resolvedValues.title);
    setDescription(resolvedValues.description);
    setMeal(resolvedValues.meal);
    setTimeMinutes(resolvedValues.timeMinutes);
    setServing(resolvedValues.serving);
    setProtein(resolvedValues.protein);
    setBenefits(resolvedValues.benefits);
    setTagsText(toTextarea(resolvedValues.tags));
    setIngredientsText(toTextarea(resolvedValues.ingredients));
    setStepsText(toTextarea(resolvedValues.steps));
  }, [resolvedValues]);

  return (
    <div className="grid gap-4">
      <div className="grid gap-2">
        <label className="text-xs text-muted">Title</label>
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className="rounded-2xl border border-border bg-card px-4 py-3 text-sm text-foreground"
        />
      </div>
      <div className="grid gap-2">
        <label className="text-xs text-muted">Description</label>
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          rows={2}
          className="rounded-2xl border border-border bg-card px-4 py-3 text-sm text-foreground"
        />
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <div className="grid gap-2">
          <label className="text-xs text-muted">Meal</label>
          <select
            value={meal}
            onChange={(event) => setMeal(event.target.value as Recipe["meal"])}
            className="rounded-2xl border border-border bg-card px-4 py-3 text-sm text-foreground"
          >
            <option value="Breakfast">Breakfast</option>
            <option value="Lunch">Lunch</option>
            <option value="Dinner">Dinner</option>
            <option value="Snack">Snack</option>
          </select>
        </div>
        <div className="grid gap-2">
          <label className="text-xs text-muted">Time (minutes)</label>
          <input
            type="number"
            value={timeMinutes}
            onChange={(event) => setTimeMinutes(Number(event.target.value))}
            className="rounded-2xl border border-border bg-card px-4 py-3 text-sm text-foreground"
          />
        </div>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <div className="grid gap-2">
          <label className="text-xs text-muted">Protein</label>
          <input
            value={protein}
            onChange={(event) => setProtein(event.target.value)}
            className="rounded-2xl border border-border bg-card px-4 py-3 text-sm text-foreground"
          />
        </div>
        <div className="grid gap-2">
          <label className="text-xs text-muted">Serving</label>
          <input
            value={serving}
            onChange={(event) => setServing(event.target.value)}
            className="rounded-2xl border border-border bg-card px-4 py-3 text-sm text-foreground"
          />
        </div>
      </div>
      <div className="grid gap-2">
        <label className="text-xs text-muted">Benefits</label>
        <textarea
          value={benefits}
          onChange={(event) => setBenefits(event.target.value)}
          rows={2}
          className="rounded-2xl border border-border bg-card px-4 py-3 text-sm text-foreground"
        />
      </div>
      <div className="grid gap-2">
        <label className="text-xs text-muted">Tags</label>
        <textarea
          value={tagsText}
          onChange={(event) => setTagsText(event.target.value)}
          rows={2}
          className="rounded-2xl border border-border bg-card px-4 py-3 text-sm text-foreground"
        />
        <div className="text-[10px] text-muted">
          One per line
        </div>
      </div>
      <div className="grid gap-2">
        <label className="text-xs text-muted">Ingredients</label>
        <textarea
          value={ingredientsText}
          onChange={(event) => setIngredientsText(event.target.value)}
          rows={4}
          className="rounded-2xl border border-border bg-card px-4 py-3 text-sm text-foreground"
        />
        <div className="text-[10px] text-muted">
          One per line
        </div>
      </div>
      <div className="grid gap-2">
        <label className="text-xs text-muted">Steps</label>
        <textarea
          value={stepsText}
          onChange={(event) => setStepsText(event.target.value)}
          rows={4}
          className="rounded-2xl border border-border bg-card px-4 py-3 text-sm text-foreground"
        />
        <div className="text-[10px] text-muted">
          One per line
        </div>
      </div>
      <button
        className="rounded-2xl bg-accent/15 px-4 py-3 text-sm font-semibold text-accent"
        onClick={() =>
          onSave?.({
            title,
            description,
            meal,
            timeMinutes,
            serving,
            protein,
            benefits,
            tags: toList(tagsText),
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


