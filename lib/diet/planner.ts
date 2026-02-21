import { recipes, type Recipe } from "@/lib/data/recipes";

export type Sex = "male" | "female";
export type ActivityLevel =
  | "sedentary"
  | "light"
  | "moderate"
  | "active"
  | "very-active";
export type Goal = "fat-loss" | "recomp" | "muscle-gain" | "maintenance";

export type DietProfile = {
  age: number;
  sex: Sex;
  heightCm: number;
  weightKg: number;
  activityLevel: ActivityLevel;
  goal: Goal;
};

export type DietTargets = {
  bmr: number;
  tdee: number;
  targetCalories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
  waterMl: number;
};

export type PlannedMeal = {
  meal: "Breakfast" | "Lunch" | "Dinner";
  targetCalories: number;
  targetProteinG: number;
  recipeId: string;
  portionMultiplier: number;
  adjustedCalories: number;
  adjustedProteinG: number;
};

const activityMultipliers: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  "very-active": 1.9,
};

const goalCalorieMultiplier: Record<Goal, number> = {
  "fat-loss": 0.82,
  recomp: 0.95,
  "muscle-gain": 1.1,
  maintenance: 1,
};

const goalProteinFactor: Record<Goal, number> = {
  "fat-loss": 2,
  recomp: 1.9,
  "muscle-gain": 1.8,
  maintenance: 1.6,
};

const mealDistribution = {
  Breakfast: 0.3,
  Lunch: 0.35,
  Dinner: 0.35,
} as const;

const formatDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const hashString = (value: string) => {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash;
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

export const calculateDietTargets = (profile: DietProfile): DietTargets => {
  const bmrBase =
    10 * profile.weightKg + 6.25 * profile.heightCm - 5 * profile.age;
  const bmr = profile.sex === "male" ? bmrBase + 5 : bmrBase - 161;
  const tdee = bmr * activityMultipliers[profile.activityLevel];
  const targetCalories = tdee * goalCalorieMultiplier[profile.goal];

  const proteinG = profile.weightKg * goalProteinFactor[profile.goal];
  const fatG = profile.weightKg * 0.8;
  const caloriesAfterProteinFat = targetCalories - (proteinG * 4 + fatG * 9);
  const carbsG = Math.max(0, caloriesAfterProteinFat / 4);

  const fiberG = Math.max(25, Math.round((targetCalories / 1000) * 14));
  const waterMl = Math.round(profile.weightKg * 35);

  return {
    bmr,
    tdee,
    targetCalories,
    proteinG,
    carbsG,
    fatG,
    fiberG,
    waterMl,
  };
};

const pickRecipeForMeal = (
  meal: PlannedMeal["meal"],
  targets: DietTargets,
  dateKey: string,
  yesterdayKey: string,
) => {
  const candidates = recipes.filter((entry) => entry.meal === meal);
  if (candidates.length === 0) {
    return null;
  }

  const targetCalories = targets.targetCalories * mealDistribution[meal];
  const targetProtein = targets.proteinG * mealDistribution[meal];
  const yesterdayIndex = hashString(`${yesterdayKey}-${meal}`) % candidates.length;

  let bestRecipe: Recipe = candidates[0];
  let bestScore = Number.POSITIVE_INFINITY;

  candidates.forEach((candidate, index) => {
    const calorieDistance =
      Math.abs(candidate.nutrition.calories - targetCalories) /
      Math.max(1, targetCalories);
    const proteinDistance =
      Math.abs(candidate.nutrition.protein_g - targetProtein) /
      Math.max(1, targetProtein);

    const dailyNoise = (hashString(`${dateKey}-${candidate.id}`) % 100) / 10000;
    const repeatPenalty = candidates.length > 1 && index === yesterdayIndex ? 0.08 : 0;

    const score = calorieDistance + proteinDistance * 0.75 + dailyNoise + repeatPenalty;
    if (score < bestScore) {
      bestScore = score;
      bestRecipe = candidate;
    }
  });

  const portionMultiplier = clamp(
    targetCalories / Math.max(1, bestRecipe.nutrition.calories),
    0.7,
    1.8,
  );

  return {
    meal,
    targetCalories: Math.round(targetCalories),
    targetProteinG: Math.round(targetProtein),
    recipeId: bestRecipe.id,
    portionMultiplier,
    adjustedCalories: Math.round(bestRecipe.nutrition.calories * portionMultiplier),
    adjustedProteinG: Math.round(bestRecipe.nutrition.protein_g * portionMultiplier),
  } satisfies PlannedMeal;
};

export const buildDailyDietPlan = (targets: DietTargets, date = new Date()) => {
  const todayKey = formatDateKey(date);
  const yesterday = new Date(date);
  yesterday.setDate(date.getDate() - 1);
  const yesterdayKey = formatDateKey(yesterday);

  const meals = (["Breakfast", "Lunch", "Dinner"] as const)
    .map((meal) => pickRecipeForMeal(meal, targets, todayKey, yesterdayKey))
    .filter((entry): entry is PlannedMeal => Boolean(entry));

  const totalPlannedCalories = meals.reduce(
    (total, entry) => total + entry.adjustedCalories,
    0,
  );
  const totalPlannedProteinG = meals.reduce(
    (total, entry) => total + entry.adjustedProteinG,
    0,
  );

  return {
    dateKey: todayKey,
    meals,
    totalPlannedCalories,
    totalPlannedProteinG,
  };
};
