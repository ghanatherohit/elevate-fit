"use client";

import { useEffect, useMemo, useState } from "react";
import type { Recipe } from "@/lib/data/recipes";
import RecipeEditor, { type RecipeEditorValues } from "./RecipeEditor";

type RecipeDetailClientProps = {
  recipe: Recipe;
};

const makeStorageKey = (id: string) => `recipe-item-${id}`;

export default function RecipeDetailClient({ recipe }: RecipeDetailClientProps) {
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

  const [initialValues, setInitialValues] = useState<RecipeEditorValues>(
    baseValues,
  );

  useEffect(() => {
    const stored = localStorage.getItem(makeStorageKey(recipe.id));
    if (!stored) {
      setInitialValues(baseValues);
      return;
    }
    try {
      const parsed = JSON.parse(stored) as Partial<RecipeEditorValues>;
      setInitialValues({ ...baseValues, ...parsed });
    } catch {
      setInitialValues(baseValues);
    }
  }, [baseValues, recipe.id]);

  const handleSave = (values: RecipeEditorValues) => {
    localStorage.setItem(makeStorageKey(recipe.id), JSON.stringify(values));
    setInitialValues(values);
  };

  return (
    <RecipeEditor
      recipe={recipe}
      initialValues={initialValues}
      onSave={handleSave}
    />
  );
}
