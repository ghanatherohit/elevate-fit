"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import GlassCard from "@/components/shared/GlassCard";
import SectionHeader from "@/components/shared/SectionHeader";
import { recipes, type Recipe } from "@/lib/data/recipes";

const container = {
  hidden: { opacity: 0, y: 8 },
  show: {
    opacity: 1,
    y: 0,
    transition: { staggerChildren: 0.06 },
  },
};

const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

const mealTabs = ["Breakfast", "Lunch", "Dinner", "Snack"] as const;
type MealTab = (typeof mealTabs)[number];
type RoutineMeal = Exclude<MealTab, "Snack">;

type Sex = "male" | "female";
type ActivityLevel =
  | "sedentary"
  | "light"
  | "moderate"
  | "active"
  | "very-active";
type Goal = "fat-loss" | "recomp" | "muscle-gain" | "maintenance";
type HeightUnit = "cm" | "ft";
type CalculatorView = "summary" | "detailed";

type DietProfile = {
  age: number;
  sex: Sex;
  heightCm: number;
  weightKg: number;
  activityLevel: ActivityLevel;
  goal: Goal;
};

type DietTargets = {
  bmr: number;
  tdee: number;
  targetCalories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
  waterMl: number;
};

type DietProfileApiResponse = {
  profile: DietProfile | null;
  targets: DietTargets | null;
  onboardingRequired: boolean;
  error?: string;
};

type DailyDietMeal = {
  meal: RoutineMeal;
  targetCalories: number;
  targetProteinG: number;
  recipeId: string;
  portionMultiplier: number;
  adjustedCalories: number;
  adjustedProteinG: number;
  recipe: Recipe;
};

type DailyDietResponse = {
  meals: DailyDietMeal[];
  totals?: {
    plannedCalories: number;
    plannedProteinG: number;
    targetCalories: number;
    targetProteinG: number;
    calorieGap: number;
    proteinGap: number;
  };
  error?: string;
};

type ToastState = {
  type: "success" | "error";
  message: string;
};

const routineMeals: RoutineMeal[] = ["Breakfast", "Lunch", "Dinner"];

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

const activityOptions: Array<{ value: ActivityLevel; label: string }> = [
  { value: "sedentary", label: "Sedentary" },
  { value: "light", label: "Light" },
  { value: "moderate", label: "Moderate" },
  { value: "active", label: "Active" },
  { value: "very-active", label: "Very active" },
];

const goalOptions: Array<{ value: Goal; label: string }> = [
  { value: "fat-loss", label: "Fat loss" },
  { value: "recomp", label: "Recomp" },
  { value: "muscle-gain", label: "Muscle gain" },
  { value: "maintenance", label: "Maintenance" },
];

const dietProfileCacheKey = "ef-diet-profile-cache";
const dietTargetsCacheKey = "ef-diet-targets-cache";

const mealDistribution: Record<RoutineMeal, number> = {
  Breakfast: 0.3,
  Lunch: 0.35,
  Dinner: 0.35,
};

const cmToFeetInches = (cm: number) => {
  const totalInches = cm / 2.54;
  let feet = Math.floor(totalInches / 12);
  let inches = Math.round(totalInches - feet * 12);

  if (inches === 12) {
    feet += 1;
    inches = 0;
  }

  return { feet, inches };
};

const feetInchesToCm = (feet: number, inches: number) => {
  const totalInches = feet * 12 + inches;
  return Math.round(totalInches * 2.54);
};

const formatDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const hashString = (value: string) => {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
};

const pickDailyRoutineMeals = (allRecipes: Recipe[], date: Date) => {
  const todayKey = formatDateKey(date);
  const yesterday = new Date(date);
  yesterday.setDate(date.getDate() - 1);
  const yesterdayKey = formatDateKey(yesterday);

  return routineMeals.reduce(
    (accumulator, meal) => {
      const mealRecipes = allRecipes.filter((entry) => entry.meal === meal);
      if (mealRecipes.length === 0) {
        accumulator[meal] = null;
        return accumulator;
      }

      let todayIndex = hashString(`${todayKey}-${meal}`) % mealRecipes.length;
      if (mealRecipes.length > 1) {
        const yesterdayIndex =
          hashString(`${yesterdayKey}-${meal}`) % mealRecipes.length;
        if (todayIndex === yesterdayIndex) {
          todayIndex = (todayIndex + 1) % mealRecipes.length;
        }
      }

      accumulator[meal] = mealRecipes[todayIndex];
      return accumulator;
    },
    { Breakfast: null, Lunch: null, Dinner: null } as Record<RoutineMeal, Recipe | null>,
  );
};

const calculateDietTargets = (profile: DietProfile): DietTargets => {
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

const parseJsonSafe = async <T,>(response: Response): Promise<T | null> => {
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    return null;
  }

  try {
    return (await response.json()) as T;
  } catch {
    return null;
  }
};

const buildLocalDailyDietMeals = (targets: DietTargets): DailyDietMeal[] => {
  const picks = pickDailyRoutineMeals(recipes, new Date());

  return routineMeals
    .map((meal) => {
      const recipe = picks[meal];
      if (!recipe) {
        return null;
      }

      const targetCalories = Math.round(targets.targetCalories * mealDistribution[meal]);
      const targetProteinG = Math.round(targets.proteinG * mealDistribution[meal]);
      const portionMultiplier = targetCalories / Math.max(1, recipe.nutrition.calories);

      return {
        meal,
        targetCalories,
        targetProteinG,
        recipeId: recipe.id,
        portionMultiplier,
        adjustedCalories: Math.round(recipe.nutrition.calories * portionMultiplier),
        adjustedProteinG: Math.round(recipe.nutrition.protein_g * portionMultiplier),
        recipe,
      } satisfies DailyDietMeal;
    })
    .filter((entry): entry is DailyDietMeal => Boolean(entry));
};

const buildLocalTotals = (targets: DietTargets, meals: DailyDietMeal[]) => {
  const plannedCalories = meals.reduce((sum, meal) => sum + meal.adjustedCalories, 0);
  const plannedProteinG = meals.reduce((sum, meal) => sum + meal.adjustedProteinG, 0);
  const targetCalories = Math.round(targets.targetCalories);
  const targetProteinG = Math.round(targets.proteinG);

  return {
    plannedCalories,
    plannedProteinG,
    targetCalories,
    targetProteinG,
    calorieGap: targetCalories - plannedCalories,
    proteinGap: targetProteinG - plannedProteinG,
  };
};

export default function RecipesClient() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedTab, setSelectedTab] = useState<MealTab>("Breakfast");
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [profile, setProfile] = useState<DietProfile>({
    age: 24,
    sex: "male",
    heightCm: 170,
    weightKg: 70,
    activityLevel: "moderate",
    goal: "recomp",
  });
  const [heightUnit, setHeightUnit] = useState<HeightUnit>("cm");
  const [calculatorView, setCalculatorView] = useState<CalculatorView>("summary");
  const initialFeetInches = useMemo(() => cmToFeetInches(170), []);
  const [heightFeet, setHeightFeet] = useState(initialFeetInches.feet);
  const [heightInches, setHeightInches] = useState(initialFeetInches.inches);
  const [targets, setTargets] = useState<DietTargets>(() => calculateDietTargets(profile));
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [onboardingRequired, setOnboardingRequired] = useState(false);
  const [dailyDietMeals, setDailyDietMeals] = useState<DailyDietMeal[]>([]);
  const [dailyTotals, setDailyTotals] = useState<DailyDietResponse["totals"] | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = (type: ToastState["type"], message: string) => {
    setToast({ type, message });
  };

  useEffect(() => {
    const stored = localStorage.getItem("recipe-favorites");
    if (stored) {
      setFavorites(JSON.parse(stored));
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadDietProfile = async () => {
      try {
        const response = await fetch("/api/profile/diet", { cache: "no-store" });
        const data = await parseJsonSafe<DietProfileApiResponse>(response);

        if (!response.ok) {
          throw new Error(data?.error || "Failed to load diet profile");
        }

        if (cancelled) {
          return;
        }

        setOnboardingRequired(Boolean(data?.onboardingRequired));

        if (data?.profile) {
          setProfile(data.profile);
        }
        if (data?.targets) {
          setTargets(data.targets);
        }
      } catch (error) {
        if (!cancelled) {
          const message = error instanceof Error ? error.message : "Failed to load diet profile";
          const cachedProfileRaw = localStorage.getItem(dietProfileCacheKey);
          const cachedTargetsRaw = localStorage.getItem(dietTargetsCacheKey);

          if (cachedProfileRaw && cachedTargetsRaw) {
            try {
              const cachedProfile = JSON.parse(cachedProfileRaw) as DietProfile;
              const cachedTargets = JSON.parse(cachedTargetsRaw) as DietTargets;
              setProfile(cachedProfile);
              setTargets(cachedTargets);
              setOnboardingRequired(false);
              showToast("success", "Loaded profile from local cache.");
              return;
            } catch {
              localStorage.removeItem(dietProfileCacheKey);
              localStorage.removeItem(dietTargetsCacheKey);
            }
          }

          setProfileError(message);
          showToast("error", message);
        }
      }
    };

    void loadDietProfile();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (onboardingRequired) {
      return;
    }

    let cancelled = false;

    const loadDailyPlan = async () => {
      try {
        const response = await fetch("/api/diet/daily", { cache: "no-store" });
        const data = await parseJsonSafe<DailyDietResponse>(response);
        if (!response.ok) {
          if (data?.error) {
            setProfileError(data.error);
          }
          return;
        }

        if (!cancelled) {
          setDailyDietMeals(data?.meals ?? []);
          setDailyTotals(data?.totals ?? null);
        }
      } catch {
        if (!cancelled) {
          setDailyDietMeals([]);
          setDailyTotals(null);
        }
      }
    };

    void loadDailyPlan();

    return () => {
      cancelled = true;
    };
  }, [onboardingRequired]);

  useEffect(() => {
    if (!selectedRecipe) {
      document.body.style.overflow = "unset";
      return;
    }

    document.body.style.overflow = "hidden";
    const onEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelectedRecipe(null);
      }
    };

    window.addEventListener("keydown", onEsc);
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", onEsc);
    };
  }, [selectedRecipe]);

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    recipes.forEach((recipe) => {
      recipe.tags.forEach((tag) => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }, []);

  const toggleFavorite = (id: string) => {
    const updated = favorites.includes(id)
      ? favorites.filter((fav) => fav !== id)
      : [...favorites, id];
    setFavorites(updated);
    localStorage.setItem("recipe-favorites", JSON.stringify(updated));
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((entry) => entry !== tag) : [...prev, tag],
    );
  };

  const filteredRecipes = useMemo(() => {
    return recipes.filter((recipe) => {
      const query = searchQuery.trim().toLowerCase();
      const matchesQuery =
        query === "" ||
        recipe.title.toLowerCase().includes(query) ||
        recipe.description.toLowerCase().includes(query) ||
        recipe.benefits.toLowerCase().includes(query);

      const matchesTags =
        selectedTags.length === 0 ||
        selectedTags.every((tag) => recipe.tags.includes(tag));

      return matchesQuery && matchesTags;
    });
  }, [searchQuery, selectedTags]);

  const recipesByMeal = useMemo(
    () =>
      ({
        Breakfast: filteredRecipes.filter((entry) => entry.meal === "Breakfast"),
        Lunch: filteredRecipes.filter((entry) => entry.meal === "Lunch"),
        Dinner: filteredRecipes.filter((entry) => entry.meal === "Dinner"),
        Snack: filteredRecipes.filter((entry) => entry.meal === "Snack"),
      }) as Record<MealTab, Recipe[]>,
    [filteredRecipes],
  );

  const activeRecipes = recipesByMeal[selectedTab];
  const dailyRoutineMeals = useMemo(
    () => pickDailyRoutineMeals(recipes, new Date()),
    [],
  );

  useEffect(() => {
    setTargets(calculateDietTargets(profile));
  }, [profile]);

  useEffect(() => {
    const converted = cmToFeetInches(profile.heightCm);
    setHeightFeet(converted.feet);
    setHeightInches(converted.inches);
  }, [profile.heightCm]);

  const dailyDietLookup = useMemo(
    () =>
      dailyDietMeals.reduce(
        (accumulator, entry) => {
          accumulator[entry.meal] = entry;
          return accumulator;
        },
        { Breakfast: null, Lunch: null, Dinner: null } as Record<
          RoutineMeal,
          DailyDietMeal | null
        >,
      ),
    [dailyDietMeals],
  );

  const macroSplit = useMemo(() => {
    const proteinCalories = targets.proteinG * 4;
    const carbsCalories = targets.carbsG * 4;
    const fatCalories = targets.fatG * 9;
    const total = Math.max(1, proteinCalories + carbsCalories + fatCalories);

    return {
      proteinPercent: Math.round((proteinCalories / total) * 100),
      carbsPercent: Math.round((carbsCalories / total) * 100),
      fatPercent: Math.round((fatCalories / total) * 100),
    };
  }, [targets]);

  const nutrientDetails = useMemo(() => {
    const proteinCalories = Math.round(targets.proteinG * 4);
    const carbsCalories = Math.round(targets.carbsG * 4);
    const fatCalories = Math.round(targets.fatG * 9);
    const addedSugarLimitG = Math.max(20, Math.round((targets.targetCalories * 0.1) / 4));

    return {
      proteinCalories,
      carbsCalories,
      fatCalories,
      proteinPerKg: (targets.proteinG / Math.max(1, profile.weightKg)).toFixed(2),
      addedSugarLimitG,
      sodiumLimitMg: 2000,
      cholesterolLimitMg: 300,
      potassiumTargetMg: 3500,
      calciumTargetMg: 1000,
      magnesiumTargetMg: profile.sex === "male" ? 420 : 320,
      ironTargetMg: profile.sex === "male" ? 8 : 18,
      vitaminATargetMcg: profile.sex === "male" ? 900 : 700,
      vitaminCTargetMg: profile.sex === "male" ? 90 : 75,
      vitaminDTargetMcg: 15,
    };
  }, [targets, profile.sex, profile.weightKg]);

  const nutrientTableRows = useMemo(
    () => [
      { nutrient: "Calories", target: `${Math.round(targets.targetCalories)} kcal`, note: "Daily energy target" },
      { nutrient: "Protein", target: `${Math.round(targets.proteinG)} g`, note: `${nutrientDetails.proteinPerKg} g/kg body weight` },
      { nutrient: "Carbohydrates", target: `${Math.round(targets.carbsG)} g`, note: `${nutrientDetails.carbsCalories} kcal from carbs` },
      { nutrient: "Fat", target: `${Math.round(targets.fatG)} g`, note: `${nutrientDetails.fatCalories} kcal from fat` },
      { nutrient: "Fiber", target: `${targets.fiberG} g`, note: "Minimum daily" },
      { nutrient: "Water", target: `${(targets.waterMl / 1000).toFixed(1)} L`, note: "Hydration target" },
      { nutrient: "Added sugar", target: `≤ ${nutrientDetails.addedSugarLimitG} g`, note: "Upper limit" },
      { nutrient: "Sodium", target: `≤ ${nutrientDetails.sodiumLimitMg} mg`, note: "Upper limit" },
      { nutrient: "Cholesterol", target: `≤ ${nutrientDetails.cholesterolLimitMg} mg`, note: "Upper limit" },
      { nutrient: "Calcium", target: `${nutrientDetails.calciumTargetMg} mg`, note: "Bone health" },
      { nutrient: "Magnesium", target: `${nutrientDetails.magnesiumTargetMg} mg`, note: "Muscle + recovery" },
      { nutrient: "Potassium", target: `${nutrientDetails.potassiumTargetMg} mg`, note: "Electrolyte balance" },
      { nutrient: "Iron", target: `${nutrientDetails.ironTargetMg} mg`, note: "Oxygen transport" },
      { nutrient: "Vitamin A", target: `${nutrientDetails.vitaminATargetMcg} mcg`, note: "Vision + immunity" },
      { nutrient: "Vitamin C", target: `${nutrientDetails.vitaminCTargetMg} mg`, note: "Recovery + immunity" },
      { nutrient: "Vitamin D", target: `${nutrientDetails.vitaminDTargetMcg} mcg`, note: "Bone + hormone support" },
    ],
    [nutrientDetails, targets],
  );

  const saveDietProfile = async () => {
    setSavingProfile(true);
    setProfileError(null);

    const localTargets = calculateDietTargets(profile);
    setTargets(localTargets);
    setOnboardingRequired(false);
    localStorage.setItem(dietProfileCacheKey, JSON.stringify(profile));
    localStorage.setItem(dietTargetsCacheKey, JSON.stringify(localTargets));

    const localMeals = buildLocalDailyDietMeals(localTargets);
    setDailyDietMeals(localMeals);
    setDailyTotals(buildLocalTotals(localTargets, localMeals));
    showToast("success", "Profile updated.");

    try {
      const response = await fetch("/api/profile/diet", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });

      const data = await parseJsonSafe<DietProfileApiResponse>(response);
      if (!response.ok) {
        throw new Error(data?.error || "Failed to sync diet profile");
      }

      if (data?.targets) {
        setTargets(data.targets);
      }
      setOnboardingRequired(false);

      const dailyResponse = await fetch("/api/diet/daily", { cache: "no-store" });
      const dailyData = await parseJsonSafe<DailyDietResponse>(dailyResponse);
      if (dailyResponse.ok) {
        setDailyDietMeals(dailyData?.meals ?? []);
        setDailyTotals(dailyData?.totals ?? null);
        showToast("success", "Profile synced to server.");
      } else {
        showToast("success", "Saved locally. Server sync pending.");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to sync diet profile";
      setProfileError(`Saved locally. ${message}`);
      showToast("success", "Saved locally. Server unavailable.");
    } finally {
      setSavingProfile(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        {toast ? (
          <motion.div
            key="recipes-toast"
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="fixed right-4 top-4 z-[70]"
          >
            <div
              className={`max-w-xs rounded-2xl border px-3 py-2 text-xs shadow-lg ${
                toast.type === "success"
                  ? "border-accent/40 bg-card text-foreground"
                  : "border-accent/45 bg-card text-accent"
              }`}
            >
              {toast.message}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <motion.div
        className="grid gap-3 sm:gap-4"
        variants={container}
        initial="hidden"
        animate="show"
      >
        <motion.div variants={item}>
          <SectionHeader
            title="Recipes"
            action={`${filteredRecipes.length} total recipes`}
          />
        </motion.div>

        <motion.div variants={item}>
          <GlassCard className="grid gap-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="text-sm font-semibold text-foreground">Diet profile calculator</div>
                <div className="text-[11px] text-muted">One-time setup, editable anytime</div>
              </div>
              <button
                onClick={() => {
                  void saveDietProfile();
                }}
                className="w-full rounded-2xl border border-accent/35 bg-accent/15 px-4 py-2.5 text-xs font-semibold text-accent sm:w-auto"
                disabled={savingProfile}
              >
                {savingProfile ? "Saving..." : onboardingRequired ? "Save profile" : "Update profile"}
              </button>
            </div>

            {onboardingRequired ? (
              <div className="rounded-2xl border border-accent/40 bg-accent/10 px-3 py-2 text-xs text-accent">
                Complete this once to enable personalized daily meal planning.
              </div>
            ) : null}

            {profileError ? (
              <div className="rounded-2xl border border-border bg-card px-3 py-2 text-xs text-accent">
                {profileError}
              </div>
            ) : null}
            <div className="grid gap-4">
              <div className="grid gap-3">
                <div className="rounded-2xl border border-border bg-card px-3 py-3">
                  <div className="text-xs font-semibold text-foreground">Inputs</div>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    <label className="grid gap-1 text-xs text-muted">
                      Age
                      <input
                        type="number"
                        min={14}
                        max={90}
                        value={profile.age}
                        onChange={(event) =>
                          setProfile((prev) => ({
                            ...prev,
                            age: Number(event.target.value) || prev.age,
                          }))
                        }
                        className="rounded-xl border border-border bg-card-strong px-3 py-2.5 text-sm text-foreground"
                      />
                    </label>

                    <label className="grid gap-1 text-xs text-muted">
                      Sex
                      <select
                        value={profile.sex}
                        onChange={(event) =>
                          setProfile((prev) => ({ ...prev, sex: event.target.value as Sex }))
                        }
                        className="rounded-xl border border-border bg-card-strong px-3 py-2.5 text-sm text-foreground"
                      >
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                      </select>
                    </label>

                    <label className="grid gap-1 text-xs text-muted">
                      Height
                      <div className="grid gap-2">
                        <div className="inline-flex w-fit rounded-xl border border-border bg-card-strong">
                          <button
                            type="button"
                            onClick={() => setHeightUnit("cm")}
                            className={`rounded-l-xl px-3 py-1.5 text-[11px] font-medium ${
                              heightUnit === "cm"
                                ? "bg-accent/15 text-accent"
                                : "text-muted"
                            }`}
                          >
                            cm
                          </button>
                          <button
                            type="button"
                            onClick={() => setHeightUnit("ft")}
                            className={`rounded-r-xl px-3 py-1.5 text-[11px] font-medium ${
                              heightUnit === "ft"
                                ? "bg-accent/15 text-accent"
                                : "text-muted"
                            }`}
                          >
                            ft/in
                          </button>
                        </div>

                        {heightUnit === "cm" ? (
                          <input
                            type="number"
                            min={130}
                            max={220}
                            value={profile.heightCm}
                            onChange={(event) =>
                              setProfile((prev) => ({
                                ...prev,
                                heightCm: Number(event.target.value) || prev.heightCm,
                              }))
                            }
                            className="rounded-xl border border-border bg-card-strong px-3 py-2.5 text-sm text-foreground"
                          />
                        ) : (
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="number"
                              min={3}
                              max={8}
                              value={heightFeet}
                              onChange={(event) => {
                                const nextFeet = Math.min(8, Math.max(3, Number(event.target.value) || 0));
                                setHeightFeet(nextFeet);
                                setProfile((prev) => ({
                                  ...prev,
                                  heightCm: feetInchesToCm(nextFeet, heightInches),
                                }));
                              }}
                              className="rounded-xl border border-border bg-card-strong px-3 py-2.5 text-sm text-foreground"
                              placeholder="Feet"
                            />
                            <input
                              type="number"
                              min={0}
                              max={11}
                              value={heightInches}
                              onChange={(event) => {
                                const nextInches = Math.min(11, Math.max(0, Number(event.target.value) || 0));
                                setHeightInches(nextInches);
                                setProfile((prev) => ({
                                  ...prev,
                                  heightCm: feetInchesToCm(heightFeet, nextInches),
                                }));
                              }}
                              className="rounded-xl border border-border bg-card-strong px-3 py-2.5 text-sm text-foreground"
                              placeholder="Inches"
                            />
                          </div>
                        )}
                      </div>
                    </label>

                    <label className="grid gap-1 text-xs text-muted">
                      Weight (kg)
                      <input
                        type="number"
                        min={35}
                        max={200}
                        value={profile.weightKg}
                        onChange={(event) =>
                          setProfile((prev) => ({
                            ...prev,
                            weightKg: Number(event.target.value) || prev.weightKg,
                          }))
                        }
                        className="rounded-xl border border-border bg-card-strong px-3 py-2.5 text-sm text-foreground"
                      />
                    </label>
                  </div>

                  <div className="mt-3 grid gap-2">
                    <div className="text-xs text-muted">Activity</div>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-3">
                      {activityOptions.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() =>
                            setProfile((prev) => ({ ...prev, activityLevel: option.value }))
                          }
                          className={`flex min-h-10.5 items-center justify-center rounded-xl border px-2 py-2 text-center text-[11px] leading-tight font-medium transition sm:text-xs ${
                            profile.activityLevel === option.value
                              ? "border-accent bg-accent/15 text-accent"
                              : "border-border bg-card-strong text-muted"
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mt-3 grid gap-2">
                    <div className="text-xs text-muted">Goal</div>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-2">
                      {goalOptions.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setProfile((prev) => ({ ...prev, goal: option.value }))}
                          className={`flex min-h-10.5 items-center justify-center rounded-xl border px-2 py-2 text-center text-[11px] leading-tight font-medium transition sm:text-xs ${
                            profile.goal === option.value
                              ? "border-accent bg-accent/15 text-accent"
                              : "border-border bg-card-strong text-muted"
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-3">
                <div className="rounded-2xl border border-border bg-card px-3 py-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-xs font-semibold text-foreground">Outputs (daily intake)</div>
                    <div className="inline-flex rounded-xl border border-border bg-card-strong">
                      <button
                        type="button"
                        onClick={() => setCalculatorView("summary")}
                        className={`rounded-l-xl px-3 py-1.5 text-[11px] font-medium ${
                          calculatorView === "summary"
                            ? "bg-accent/15 text-accent"
                            : "text-muted"
                        }`}
                      >
                        Summary
                      </button>
                      <button
                        type="button"
                        onClick={() => setCalculatorView("detailed")}
                        className={`rounded-r-xl px-3 py-1.5 text-[11px] font-medium ${
                          calculatorView === "detailed"
                            ? "bg-accent/15 text-accent"
                            : "text-muted"
                        }`}
                      >
                        Detailed
                      </button>
                    </div>
                  </div>

                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <div className="rounded-xl border border-border bg-card-strong px-3 py-2">
                      <div className="text-[10px] text-muted">Target calories</div>
                      <div className="text-sm font-semibold text-foreground">
                        {Math.round(targets.targetCalories)} kcal
                      </div>
                    </div>
                    <div className="rounded-xl border border-border bg-card-strong px-3 py-2">
                      <div className="text-[10px] text-muted">Protein</div>
                      <div className="text-sm font-semibold text-foreground">{Math.round(targets.proteinG)} g</div>
                    </div>
                    <div className="rounded-xl border border-border bg-card-strong px-3 py-2">
                      <div className="text-[10px] text-muted">Carbs</div>
                      <div className="text-sm font-semibold text-foreground">{Math.round(targets.carbsG)} g</div>
                    </div>
                    <div className="rounded-xl border border-border bg-card-strong px-3 py-2">
                      <div className="text-[10px] text-muted">Fats</div>
                      <div className="text-sm font-semibold text-foreground">{Math.round(targets.fatG)} g</div>
                    </div>
                  </div>

                  {calculatorView === "summary" ? (
                    <>
                      <div className="mt-3 rounded-xl border border-border bg-card-strong px-3 py-3">
                        <div className="text-[11px] font-semibold text-foreground">Macro split</div>
                        <div className="mt-2 grid gap-2">
                          <div>
                            <div className="mb-1 flex items-center justify-between text-[11px] text-muted">
                              <span>Protein</span>
                              <span>{macroSplit.proteinPercent}%</span>
                            </div>
                            <div className="h-1.5 rounded-full bg-card">
                              <div
                                className="h-full rounded-full bg-accent"
                                style={{ width: `${macroSplit.proteinPercent}%` }}
                              />
                            </div>
                          </div>
                          <div>
                            <div className="mb-1 flex items-center justify-between text-[11px] text-muted">
                              <span>Carbs</span>
                              <span>{macroSplit.carbsPercent}%</span>
                            </div>
                            <div className="h-1.5 rounded-full bg-card">
                              <div
                                className="h-full rounded-full bg-accent/75"
                                style={{ width: `${macroSplit.carbsPercent}%` }}
                              />
                            </div>
                          </div>
                          <div>
                            <div className="mb-1 flex items-center justify-between text-[11px] text-muted">
                              <span>Fat</span>
                              <span>{macroSplit.fatPercent}%</span>
                            </div>
                            <div className="h-1.5 rounded-full bg-card">
                              <div
                                className="h-full rounded-full bg-accent/55"
                                style={{ width: `${macroSplit.fatPercent}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-2 grid grid-cols-2 gap-2">
                        <div className="rounded-xl border border-border bg-card-strong px-3 py-2">
                          <div className="text-[10px] text-muted">BMR</div>
                          <div className="text-sm font-semibold text-foreground">{Math.round(targets.bmr)}</div>
                        </div>
                        <div className="rounded-xl border border-border bg-card-strong px-3 py-2">
                          <div className="text-[10px] text-muted">TDEE</div>
                          <div className="text-sm font-semibold text-foreground">{Math.round(targets.tdee)}</div>
                        </div>
                        <div className="rounded-xl border border-border bg-card-strong px-3 py-2">
                          <div className="text-[10px] text-muted">Fiber target</div>
                          <div className="text-sm font-semibold text-foreground">{targets.fiberG} g</div>
                        </div>
                        <div className="rounded-xl border border-border bg-card-strong px-3 py-2">
                          <div className="text-[10px] text-muted">Water target</div>
                          <div className="text-sm font-semibold text-foreground">{(targets.waterMl / 1000).toFixed(1)} L</div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="mt-3 overflow-x-auto rounded-xl border border-border">
                      <table className="w-full border-collapse text-left text-[10px]">
                        <thead className="bg-card-strong text-muted">
                          <tr>
                            <th className="whitespace-nowrap px-2 py-2 font-medium">Nutrient</th>
                            <th className="whitespace-nowrap px-2 py-2 font-medium">Target</th>
                            <th className="whitespace-nowrap px-2 py-2 font-medium">Guidance</th>
                          </tr>
                        </thead>
                        <tbody>
                          {nutrientTableRows.map((row) => (
                            <tr key={row.nutrient} className="border-t border-border">
                              <td className="whitespace-nowrap px-2 py-2 text-foreground">{row.nutrient}</td>
                              <td className="whitespace-nowrap px-2 py-2 font-semibold text-foreground">{row.target}</td>
                              <td className="whitespace-nowrap px-2 py-2 text-muted text-[9px]">{row.note}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        <motion.div variants={item}>
          <GlassCard className="grid gap-3">
            <div className="text-xs text-muted">Recipe explorer</div>
            <div className="text-sm font-semibold text-foreground">
              Lean protein, whole grains, vegetables, fruits, and portion control
            </div>

            <input
              type="text"
              placeholder="Search recipes..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="rounded-2xl border border-border bg-card px-4 py-2.5 text-sm text-foreground placeholder:text-muted"
            />

            <div className="grid gap-2">
              <div className="text-xs text-muted">Filter by tags</div>
              <div className="flex flex-wrap gap-2">
                {allTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`rounded-full border px-3 py-1.5 text-[11px] transition ${
                      selectedTags.includes(tag)
                        ? "border-accent bg-accent/15 text-accent"
                        : "border-border bg-card-strong text-muted"
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {(searchQuery || selectedTags.length > 0) && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedTags([]);
                }}
                className="self-start rounded-2xl border border-border bg-card-strong px-3 py-1.5 text-[11px] text-muted"
              >
                Clear filters
              </button>
            )}
          </GlassCard>
        </motion.div>

        <motion.div variants={item}>
          <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
            {mealTabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setSelectedTab(tab)}
                className={`whitespace-nowrap rounded-full border px-4 py-2 text-xs font-medium transition ${
                  selectedTab === tab
                    ? "border-accent bg-accent/15 text-accent"
                    : "border-border bg-card text-muted"
                }`}
              >
                {tab} ({recipesByMeal[tab].length})
              </button>
            ))}
          </div>
        </motion.div>

        <motion.div variants={item}>
          <GlassCard className="grid gap-3">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-foreground">
                Linked daily routine meals
              </div>
              <div className="text-[10px] text-muted">Auto-updates daily by your targets</div>
            </div>

            {dailyTotals ? (
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="rounded-2xl border border-border bg-card px-3 py-2.5">
                  <div className="text-[10px] text-muted">Calories completion</div>
                  <div className="text-xs font-semibold text-foreground">
                    {dailyTotals.plannedCalories} / {dailyTotals.targetCalories} kcal
                  </div>
                  <div className="mt-1 h-1.5 rounded-full bg-card-strong">
                    <div
                      className="h-full rounded-full bg-accent"
                      style={{
                        width: `${Math.min(
                          100,
                          Math.max(
                            0,
                            (dailyTotals.plannedCalories / Math.max(1, dailyTotals.targetCalories)) * 100,
                          ),
                        )}%`,
                      }}
                    />
                  </div>
                </div>
                <div className="rounded-2xl border border-border bg-card px-3 py-2.5">
                  <div className="text-[10px] text-muted">Protein completion</div>
                  <div className="text-xs font-semibold text-foreground">
                    {dailyTotals.plannedProteinG} / {dailyTotals.targetProteinG} g
                  </div>
                  <div className="mt-1 h-1.5 rounded-full bg-card-strong">
                    <div
                      className="h-full rounded-full bg-accent"
                      style={{
                        width: `${Math.min(
                          100,
                          Math.max(
                            0,
                            (dailyTotals.plannedProteinG / Math.max(1, dailyTotals.targetProteinG)) * 100,
                          ),
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            ) : null}

            <div className="grid gap-2 sm:grid-cols-3">
              {routineMeals.map((meal) => {
                const apiEntry = dailyDietLookup[meal];
                const fallbackEntry = dailyRoutineMeals[meal];

                if (!apiEntry && !fallbackEntry) {
                  return (
                    <div
                      key={meal}
                      className="rounded-2xl border border-border bg-card px-3 py-3"
                    >
                      <div className="text-[10px] text-muted">{meal}</div>
                      <div className="text-xs text-muted">No recipe available</div>
                    </div>
                  );
                }

                return (
                  <button
                    key={meal}
                    onClick={() =>
                      setSelectedRecipe(apiEntry ? apiEntry.recipe : (fallbackEntry as Recipe))
                    }
                    className="rounded-2xl border border-border bg-card px-3 py-3 text-left transition hover:border-accent/40"
                  >
                    <div className="text-[11px] text-muted">{meal}</div>
                    <div className="mt-1 text-sm font-semibold text-foreground line-clamp-2">
                      {apiEntry ? apiEntry.recipe.title : fallbackEntry?.title}
                    </div>
                    {apiEntry ? (
                      <>
                        <div className="mt-1 text-[11px] text-muted">
                          Target: {apiEntry.targetCalories} kcal / {apiEntry.targetProteinG}g protein
                        </div>
                        <div className="mt-0.5 text-[11px] text-muted">
                          Suggested portion: x{apiEntry.portionMultiplier.toFixed(2)}
                        </div>
                        <div className="mt-0.5 text-[11px] text-muted">
                          Adjusted: {apiEntry.adjustedCalories} kcal / {apiEntry.adjustedProteinG}g protein
                        </div>
                      </>
                    ) : (
                      <div className="mt-1 text-[11px] text-muted">
                        {fallbackEntry?.timeMinutes} min • {fallbackEntry?.protein} protein
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </GlassCard>
        </motion.div>

        {favorites.length > 0 && (
          <motion.div variants={item}>
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-foreground">
                  Favorites
                </div>
                <div className="text-xs text-muted">{favorites.length} saved</div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {recipes
                  .filter((entry) => favorites.includes(entry.id))
                  .map((entry) => (
                    <RecipeCard
                      key={entry.id}
                      recipe={entry}
                      isFavorite
                      onToggleFavorite={toggleFavorite}
                      onOpenRecipe={setSelectedRecipe}
                    />
                  ))}
              </div>
            </div>
          </motion.div>
        )}

        <motion.div variants={item}>
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-foreground">{selectedTab}</div>
              <div className="text-xs text-muted">{activeRecipes.length} recipes</div>
            </div>

            {activeRecipes.length === 0 ? (
              <div className="rounded-2xl border border-border bg-card px-4 py-8 text-center text-sm text-muted">
                No recipes found. Try adjusting your filters.
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {activeRecipes.map((entry) => (
                  <RecipeCard
                    key={entry.id}
                    recipe={entry}
                    isFavorite={favorites.includes(entry.id)}
                    onToggleFavorite={toggleFavorite}
                    onOpenRecipe={setSelectedRecipe}
                  />
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>

      <AnimatePresence>
        {selectedRecipe && (
          <RecipeModal
            recipe={selectedRecipe}
            isFavorite={favorites.includes(selectedRecipe.id)}
            onToggleFavorite={toggleFavorite}
            onClose={() => setSelectedRecipe(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

function RecipeCard({
  recipe,
  isFavorite,
  onToggleFavorite,
  onOpenRecipe,
}: {
  recipe: Recipe;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
  onOpenRecipe: (recipe: Recipe) => void;
}) {
  return (
    <div className="group relative h-full rounded-2xl border border-border bg-card px-4 py-4 text-sm transition hover:-translate-y-0.5 hover:border-accent/40">
      <button
        onClick={() => onOpenRecipe(recipe)}
        className="grid h-full w-full gap-2 text-left"
      >
        <div className="text-xs text-muted">
          {recipe.protein} protein • {recipe.timeMinutes} min
        </div>
        <div className="line-clamp-2 text-sm font-semibold text-foreground">{recipe.title}</div>
        <div className="line-clamp-2 text-xs text-muted">{recipe.description}</div>
        <div className="flex flex-wrap gap-1">
          {recipe.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-accent/10 px-2 py-0.5 text-[9px] text-accent"
            >
              {tag}
            </span>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-2 text-[10px]">
          <div>
            <div className="text-muted">Calories</div>
            <div className="font-semibold text-foreground">{recipe.nutrition.calories}</div>
          </div>
          <div>
            <div className="text-muted">Carbs</div>
            <div className="font-semibold text-foreground">{recipe.nutrition.carbs_g}g</div>
          </div>
          <div>
            <div className="text-muted">Fat</div>
            <div className="font-semibold text-foreground">{recipe.nutrition.fat_g}g</div>
          </div>
        </div>
        <div className="mt-1 text-[10px] text-accent">View recipe</div>
      </button>

      <button
        onClick={(event) => {
          event.stopPropagation();
          onToggleFavorite(recipe.id);
        }}
        className="absolute right-2 top-2 rounded-full p-2"
        aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
      >
        {isFavorite ? (
          <svg className="h-4 w-4 text-accent" fill="currentColor" viewBox="0 0 20 20">
            <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
          </svg>
        ) : (
          <svg className="h-4 w-4 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
        )}
      </button>
    </div>
  );
}

function RecipeModal({
  recipe,
  isFavorite,
  onToggleFavorite,
  onClose,
}: {
  recipe: Recipe;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
  onClose: () => void;
}) {
  const n = recipe.nutrition;

  return (
    <motion.div
      className="mx-auto fixed inset-0 max-w-md z-50 bg-black/35 backdrop-blur-[50px]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      onClick={onClose}
    >
      <motion.div
        className="mx-auto h-dvh w-full max-w-xl p-1.5 sm:p-2 md:h-[92vh] md:py-5"
        initial={{ y: 34, opacity: 0.96 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 26, opacity: 0 }}
        transition={{ type: "spring", damping: 26, stiffness: 290, mass: 0.6 }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex h-full flex-col overflow-hidden rounded-3xl border border-border bg-(--surface) shadow-xl will-change-transform">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-3 py-3 sm:px-4">
            <div className="text-xs text-muted">{recipe.meal}</div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onToggleFavorite(recipe.id)}
                className="rounded-full border border-border px-3 py-1.5 text-xs text-muted"
              >
                {isFavorite ? "Saved" : "Save"}
              </button>
              <button
                onClick={onClose}
                className="rounded-full border border-border px-3 py-1.5 text-xs text-muted"
              >
                Close
              </button>
            </div>
          </div>

          <div className="overflow-y-auto px-3 pb-8 pt-3 sm:px-4 [scrollbar-width:thin] [scrollbar-color:rgb(var(--color-accent))_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-accent/40">
            <div className="grid gap-4">
              <div>
                <h3 className="text-lg font-semibold text-foreground">{recipe.title}</h3>
                <p className="mt-1 text-xs text-muted">{recipe.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                <div className="rounded-2xl border border-border bg-card px-3 py-2">
                  <div className="text-[10px] text-muted">Time</div>
                  <div className="text-xs font-semibold text-foreground">{recipe.timeMinutes} min</div>
                </div>
                <div className="rounded-2xl border border-border bg-card px-3 py-2">
                  <div className="text-[10px] text-muted">Protein</div>
                  <div className="text-xs font-semibold text-foreground">{recipe.protein}</div>
                </div>
                <div className="rounded-2xl border border-border bg-card px-3 py-2">
                  <div className="text-[10px] text-muted">Serving</div>
                  <div className="text-xs font-semibold text-foreground">{recipe.serving}</div>
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-card p-3">
                <div className="text-sm font-semibold text-foreground">Nutrition Facts</div>
                <div className="mt-2 grid gap-1 text-xs text-muted">
                  <div className="flex justify-between border-b border-border pb-1">
                    <span className="font-semibold text-foreground">Calories</span>
                    <span className="font-semibold text-foreground">{n.calories} kcal</span>
                  </div>
                  <div className="flex justify-between"><span>Protein</span><span>{n.protein_g} g</span></div>
                  <div className="flex justify-between"><span>Carbs</span><span>{n.carbs_g} g</span></div>
                  <div className="flex justify-between"><span>Fat</span><span>{n.fat_g} g</span></div>
                  <div className="flex justify-between"><span>Fiber</span><span>{n.fiber_g} g</span></div>
                  <div className="flex justify-between"><span>Sugar</span><span>{n.sugar_g} g</span></div>
                  <div className="flex justify-between"><span>Sodium</span><span>{n.sodium_mg} mg</span></div>
                  <div className="flex justify-between"><span>Cholesterol</span><span>{n.cholesterol_mg} mg</span></div>
                  <div className="flex justify-between"><span>Iron</span><span>{n.iron_mg} mg</span></div>
                  <div className="flex justify-between"><span>Calcium</span><span>{n.calcium_mg} mg</span></div>
                  <div className="flex justify-between"><span>Potassium</span><span>{n.potassium_mg} mg</span></div>
                  <div className="flex justify-between"><span>Magnesium</span><span>{n.magnesium_mg} mg</span></div>
                  <div className="flex justify-between"><span>Vitamin A</span><span>{n.vitaminA_mcg} mcg</span></div>
                  <div className="flex justify-between"><span>Vitamin C</span><span>{n.vitaminC_mg} mg</span></div>
                  <div className="flex justify-between"><span>Vitamin D</span><span>{n.vitaminD_mcg} mcg</span></div>
                </div>
              </div>

              <div>
                <div className="text-sm font-semibold text-foreground">Ingredients</div>
                <ul className="mt-2 grid gap-2">
                  {recipe.ingredients.map((ingredient) => (
                    <li key={ingredient} className="text-xs text-muted">• {ingredient}</li>
                  ))}
                </ul>
              </div>

              <div>
                <div className="text-sm font-semibold text-foreground">Steps</div>
                <ol className="mt-2 grid gap-2">
                  {recipe.steps.map((step, index) => (
                    <li key={step} className="text-xs text-muted">{index + 1}. {step}</li>
                  ))}
                </ol>
              </div>

              <div className="rounded-2xl border border-border bg-card px-3 py-2 text-xs text-muted">
                <span className="font-semibold text-foreground">Benefits: </span>
                {recipe.benefits}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}



