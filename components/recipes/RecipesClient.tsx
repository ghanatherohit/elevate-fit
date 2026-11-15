"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useIsClient } from "@/components/shared/useIsClient";
import GlassCard from "@/components/shared/GlassCard";
import {
  DataList,
  DataRow,
  OpenHint,
  SoftChip,
  StatCell,
  StatStrip,
  TypeBody,
  TypeHeading,
  TypeMeta,
  TypeTitle,
} from "@/components/shared/DataSurfaces";
import { useOverlayLock } from "@/components/shared/OverlayLock";
import SectionHeader from "@/components/shared/SectionHeader";
import { recipes, type Recipe } from "@/lib/data/recipes";
import {
  calculateDietTargets,
  type ActivityLevel,
  type DietProfile,
  type DietTargets,
  type Goal,
  type Sex,
} from "@/lib/diet/planner";

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

type PageTab = "meals" | "profile";

const pageTabs: Array<{ id: PageTab; label: string; hint: string }> = [
  { id: "meals", label: "Meals", hint: "Plan & recipes" },
  { id: "profile", label: "Profile", hint: "Daily targets" },
];

type HeightUnit = "cm" | "ft";
type CalculatorView = "summary" | "detailed";

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
  const [filtersOpen, setFiltersOpen] = useState(false);
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
  const [pageTab, setPageTab] = useState<PageTab>("meals");
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

    const finishedOnboarding = onboardingRequired;
    const localTargets = calculateDietTargets(profile);
    setTargets(localTargets);
    setOnboardingRequired(false);
    localStorage.setItem(dietProfileCacheKey, JSON.stringify(profile));
    localStorage.setItem(dietTargetsCacheKey, JSON.stringify(localTargets));

    const localMeals = buildLocalDailyDietMeals(localTargets);
    setDailyDietMeals(localMeals);
    setDailyTotals(buildLocalTotals(localTargets, localMeals));
    showToast("success", "Profile updated.");
    if (finishedOnboarding) {
      setPageTab("meals");
    }

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

  useEffect(() => {
    if (onboardingRequired) {
      setPageTab("profile");
    }
  }, [onboardingRequired]);

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
            className="fixed right-4 top-4 z-70"
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
        className="grid gap-3"
        variants={container}
        initial="hidden"
        animate="show"
      >
        <motion.div variants={item}>
          <SectionHeader
            title="Recipes"
            action={pageTab === "meals" ? `${filteredRecipes.length} recipes` : "Daily targets"}
          />
        </motion.div>

        <motion.div variants={item}>
          <div
            className="grid grid-cols-2 gap-1 rounded-2xl bg-card-strong/40 p-1"
            role="tablist"
            aria-label="Recipes sections"
          >
            {pageTabs.map((entry) => {
              const active = pageTab === entry.id;
              return (
                <button
                  key={entry.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setPageTab(entry.id)}
                  className={`rounded-xl px-2 py-2.5 text-center transition sm:px-3 ${
                    active
                      ? "bg-accent/15 text-accent"
                      : "text-muted hover:text-foreground"
                  }`}
                >
                  <div className="text-xs font-semibold sm:text-sm">{entry.label}</div>
                  <div
                    className={`mt-0.5 text-[10px] ${
                      active ? "text-accent/80" : "text-muted"
                    }`}
                  >
                    {entry.hint}
                  </div>
                </button>
              );
            })}
          </div>
        </motion.div>

        {pageTab === "profile" ? (
          <motion.div
            key="profile"
            variants={item}
            initial="hidden"
            animate="show"
            role="tabpanel"
            aria-label="Diet profile"
          >
            <GlassCard className="grid gap-4">
              <div>
                <div className="type-kicker">Diet profile</div>
                <TypeTitle>
                  {onboardingRequired ? "Set your targets" : "Daily targets"}
                </TypeTitle>
                {onboardingRequired ? (
                  <TypeBody className="mt-1 text-accent">
                    Complete this once to unlock personalized meal planning.
                  </TypeBody>
                ) : null}
                {profileError ? (
                  <TypeMeta className="mt-1 text-accent">{profileError}</TypeMeta>
                ) : null}
              </div>

            <div className="grid gap-4">
              <div className="grid gap-2 sm:grid-cols-2">
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
                    className="soft-tile w-full px-3 py-2 text-sm text-foreground"
                  />
                </label>

                <label className="grid gap-1 text-xs text-muted">
                  Sex
                  <select
                    value={profile.sex}
                    onChange={(event) =>
                      setProfile((prev) => ({
                        ...prev,
                        sex: event.target.value as Sex,
                      }))
                    }
                    className="soft-tile w-full px-3 py-2 text-sm text-foreground"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </label>

                <label className="grid gap-1 text-xs text-muted">
                  Height
                  <div className="grid gap-1.5">
                    <div className="inline-flex w-fit rounded-lg bg-card-strong/50 p-0.5">
                      <button
                        type="button"
                        onClick={() => setHeightUnit("cm")}
                        className={`rounded-md px-2.5 py-1 text-[11px] font-medium ${
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
                        className={`rounded-md px-2.5 py-1 text-[11px] font-medium ${
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
                        className="soft-tile w-full px-3 py-2 text-sm text-foreground"
                      />
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="number"
                          min={3}
                          max={8}
                          value={heightFeet}
                          onChange={(event) => {
                            const nextFeet = Math.min(
                              8,
                              Math.max(3, Number(event.target.value) || 0),
                            );
                            setHeightFeet(nextFeet);
                            setProfile((prev) => ({
                              ...prev,
                              heightCm: feetInchesToCm(nextFeet, heightInches),
                            }));
                          }}
                          className="soft-tile w-full px-3 py-2 text-sm text-foreground"
                          placeholder="Feet"
                        />
                        <input
                          type="number"
                          min={0}
                          max={11}
                          value={heightInches}
                          onChange={(event) => {
                            const nextInches = Math.min(
                              11,
                              Math.max(0, Number(event.target.value) || 0),
                            );
                            setHeightInches(nextInches);
                            setProfile((prev) => ({
                              ...prev,
                              heightCm: feetInchesToCm(heightFeet, nextInches),
                            }));
                          }}
                          className="soft-tile w-full px-3 py-2 text-sm text-foreground"
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
                    className="soft-tile w-full px-3 py-2 text-sm text-foreground"
                  />
                </label>
              </div>

              <div className="grid gap-1.5">
                <div className="text-xs text-muted">Activity</div>
                <div className="grid grid-cols-2 gap-1 sm:grid-cols-3">
                  {activityOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() =>
                        setProfile((prev) => ({
                          ...prev,
                          activityLevel: option.value,
                        }))
                      }
                      className={`rounded-lg px-2 py-2 text-center text-[11px] font-medium transition ${
                        profile.activityLevel === option.value
                          ? "bg-accent/15 text-accent"
                          : "bg-card-strong/40 text-muted"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-1.5">
                <div className="text-xs text-muted">Goal</div>
                <div className="grid grid-cols-2 gap-1">
                  {goalOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() =>
                        setProfile((prev) => ({ ...prev, goal: option.value }))
                      }
                      className={`rounded-lg px-2 py-2 text-center text-[11px] font-medium transition ${
                        profile.goal === option.value
                          ? "bg-accent/15 text-accent"
                          : "bg-card-strong/40 text-muted"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-2 border-t border-border/40 pt-3">
                <div className="flex items-center justify-between gap-2">
                  <TypeHeading>Live targets</TypeHeading>
                  <div className="inline-flex rounded-lg bg-card-strong/50 p-0.5">
                    <button
                      type="button"
                      onClick={() => setCalculatorView("summary")}
                      className={`rounded-md px-2.5 py-1 text-[11px] font-medium ${
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
                      className={`rounded-md px-2.5 py-1 text-[11px] font-medium ${
                        calculatorView === "detailed"
                          ? "bg-accent/15 text-accent"
                          : "text-muted"
                      }`}
                    >
                      Details
                    </button>
                  </div>
                </div>

                <StatStrip cols={4}>
                  <StatCell
                    label="Cal"
                    value={`${Math.round(targets.targetCalories)}`}
                  />
                  <StatCell
                    label="Protein"
                    value={`${Math.round(targets.proteinG)}g`}
                  />
                  <StatCell
                    label="Carbs"
                    value={`${Math.round(targets.carbsG)}g`}
                  />
                  <StatCell
                    label="Fat"
                    value={`${Math.round(targets.fatG)}g`}
                  />
                </StatStrip>

                {calculatorView === "summary" ? (
                  <div className="grid gap-2">
                    <div className="grid gap-1.5">
                      {(
                        [
                          ["Protein", macroSplit.proteinPercent, "bg-accent"],
                          ["Carbs", macroSplit.carbsPercent, "bg-accent/75"],
                          ["Fat", macroSplit.fatPercent, "bg-accent/55"],
                        ] as const
                      ).map(([label, percent, bar]) => (
                        <div key={label}>
                          <div className="mb-0.5 flex justify-between text-[11px] text-muted">
                            <span>{label}</span>
                            <span>{percent}%</span>
                          </div>
                          <div className="h-1 rounded-full bg-card-strong/60">
                            <div
                              className={`h-full rounded-full ${bar}`}
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-1.5 text-[11px] text-muted">
                      <SoftChip>BMR {Math.round(targets.bmr)}</SoftChip>
                      <SoftChip>TDEE {Math.round(targets.tdee)}</SoftChip>
                      <SoftChip>Fiber {targets.fiberG}g</SoftChip>
                      <SoftChip>
                        Water {(targets.waterMl / 1000).toFixed(1)}L
                      </SoftChip>
                    </div>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left text-[10px]">
                      <thead className="text-muted">
                        <tr>
                          <th className="py-1.5 pr-2 font-medium">Nutrient</th>
                          <th className="py-1.5 pr-2 font-medium">Target</th>
                          <th className="py-1.5 font-medium">Note</th>
                        </tr>
                      </thead>
                      <tbody>
                        {nutrientTableRows.map((row) => (
                          <tr
                            key={row.nutrient}
                            className="border-t border-border/50"
                          >
                            <td className="py-1.5 pr-2 text-foreground">
                              {row.nutrient}
                            </td>
                            <td className="py-1.5 pr-2 font-semibold text-foreground">
                              {row.target}
                            </td>
                            <td className="py-1.5 text-muted">{row.note}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => {
                  void saveDietProfile();
                }}
                className="w-full rounded-xl bg-accent/15 px-4 py-2.5 text-xs font-semibold text-accent"
                disabled={savingProfile}
              >
                {savingProfile
                  ? "Saving..."
                  : onboardingRequired
                    ? "Save profile"
                    : "Update profile"}
              </button>
            </div>
            </GlassCard>
          </motion.div>
        ) : (
          <motion.div
            key="meals"
            className="grid gap-3"
            variants={item}
            initial="hidden"
            animate="show"
            role="tabpanel"
            aria-label="Meals"
          >
        {!onboardingRequired ? (
          <motion.div variants={item}>
            <GlassCard className="grid gap-2.5">
                <div>
                  <div className="type-kicker">Today</div>
                  <TypeTitle>Meal plan</TypeTitle>
                </div>

              {dailyTotals ? (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-0">
                  {(
                    [
                      {
                        key: "cal",
                        label: "Calories",
                        planned: dailyTotals.plannedCalories,
                        target: dailyTotals.targetCalories,
                        unit: "kcal",
                        edge: "sm:border-r sm:border-border/50 sm:pr-4",
                      },
                      {
                        key: "protein",
                        label: "Protein",
                        planned: dailyTotals.plannedProteinG,
                        target: dailyTotals.targetProteinG,
                        unit: "g",
                        edge: "sm:pl-4",
                      },
                    ] as const
                  ).map((metric) => {
                    const ratio =
                      metric.planned / Math.max(1, metric.target);
                    const percent = Math.min(100, Math.max(0, ratio * 100));
                    const over = ratio > 1.02;

                    return (
                      <div
                        key={metric.key}
                        className={`grid min-w-0 gap-1 ${metric.edge}`}
                      >
                        <div className="flex items-baseline justify-between gap-2 text-[11px]">
                          <span className="shrink-0 text-muted">
                            {metric.label}
                          </span>
                          <span
                            className={`min-w-0 truncate text-right ${
                              over
                                ? "font-medium text-accent"
                                : "text-foreground"
                            }`}
                          >
                            {metric.planned}
                            <span className="text-muted">
                              {" "}
                              / {metric.target}
                              {metric.unit}
                            </span>
                            {over ? (
                              <span className="text-accent"> · over</span>
                            ) : null}
                          </span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-card-strong/60">
                          <div
                            className={`h-full rounded-full ${
                              over ? "bg-accent/90" : "bg-accent"
                            }`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : null}

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                {routineMeals.map((meal) => {
                  const apiEntry = dailyDietLookup[meal];
                  const fallbackEntry = dailyRoutineMeals[meal];

                  if (!apiEntry && !fallbackEntry) {
                    return (
                      <div
                        key={meal}
                        className="soft-tile flex items-center justify-between gap-2 px-3 py-2.5"
                      >
                        <span className="text-xs text-muted">{meal}</span>
                        <span className="text-xs text-muted">—</span>
                      </div>
                    );
                  }

                  const title = apiEntry
                    ? apiEntry.recipe.title
                    : fallbackEntry?.title;
                  const meta = apiEntry
                    ? `${apiEntry.adjustedCalories} kcal · ${apiEntry.adjustedProteinG}g P`
                    : `${fallbackEntry?.timeMinutes} min · ${fallbackEntry?.protein}`;

                  return (
                    <button
                      key={meal}
                      type="button"
                      onClick={() =>
                        setSelectedRecipe(
                          apiEntry
                            ? apiEntry.recipe
                            : (fallbackEntry as Recipe),
                        )
                      }
                      className="soft-tile openable flex w-full items-start gap-2 px-3 py-2.5 text-left transition hover:bg-card-strong/55"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="text-[10px] uppercase tracking-wide text-muted">
                          {meal}
                        </div>
                        <div className="mt-0.5 line-clamp-2 text-sm text-foreground">
                          {title}
                        </div>
                        <div className="mt-0.5 text-[11px] text-muted">
                          {meta}
                        </div>
                      </div>
                      <OpenHint kind="open" className="mt-0.5 shrink-0" />
                    </button>
                  );
                })}
              </div>
            </GlassCard>
          </motion.div>
        ) : null}

        <motion.div variants={item}>
          <GlassCard className="grid gap-2.5">
            <div className="flex items-center justify-between gap-2">
              <TypeTitle>Browse</TypeTitle>
              <button
                type="button"
                onClick={() => setFiltersOpen((open) => !open)}
                className={`soft-chip gap-1 text-[11px] ${
                  selectedTags.length > 0
                    ? "text-accent"
                    : "text-muted hover:text-foreground"
                }`}
              >
                Filters
                {selectedTags.length > 0 ? ` · ${selectedTags.length}` : ""}
                <OpenHint kind="expand" />
              </button>
            </div>

            <input
              type="search"
              placeholder="Search recipes…"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="soft-tile w-full px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted"
            />

            <div className="grid grid-cols-4 gap-1 rounded-xl bg-card-strong/40 p-1">
              {mealTabs.map((tab) => {
                const active = selectedTab === tab;
                return (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setSelectedTab(tab)}
                    className={`rounded-lg px-1 py-2 text-center transition ${
                      active
                        ? "bg-accent/15 text-accent"
                        : "text-muted hover:text-foreground"
                    }`}
                  >
                    <div className="text-[10px] font-semibold sm:text-[11px]">
                      {tab}
                    </div>
                    <div
                      className={`text-[9px] ${
                        active ? "text-accent/80" : "text-muted"
                      }`}
                    >
                      {recipesByMeal[tab].length}
                    </div>
                  </button>
                );
              })}
            </div>

            {filtersOpen ? (
              <div className="grid gap-2 border-t border-border/40 pt-2">
                <div className="flex flex-wrap gap-1.5">
                  {allTags.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={`soft-chip text-[10px] transition ${
                        selectedTags.includes(tag)
                          ? "bg-accent/15 text-accent"
                          : "text-muted"
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
                {searchQuery || selectedTags.length > 0 ? (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedTags([]);
                    }}
                    className="self-start text-[11px] text-muted hover:text-foreground"
                  >
                    Clear
                  </button>
                ) : null}
              </div>
            ) : null}
          </GlassCard>
        </motion.div>

        {favorites.length > 0 ? (
          <motion.div variants={item}>
            <div className="grid gap-1.5">
              <div className="flex items-center justify-between px-0.5">
                <div className="text-xs font-semibold text-foreground">
                  Favorites
                </div>
                <div className="text-[11px] text-muted">{favorites.length}</div>
              </div>
              <DataList>
                {recipes
                  .filter((entry) => favorites.includes(entry.id))
                  .map((entry) => (
                    <RecipeRow
                      key={`fav-${entry.id}`}
                      recipe={entry}
                      isFavorite
                      onToggleFavorite={toggleFavorite}
                      onOpenRecipe={setSelectedRecipe}
                    />
                  ))}
              </DataList>
            </div>
          </motion.div>
        ) : null}

        <motion.div variants={item}>
          <div className="grid gap-1.5">
            <div className="flex items-center justify-between px-0.5">
              <div className="text-xs font-semibold text-foreground">
                {selectedTab}
              </div>
              <div className="text-[11px] text-muted">
                {activeRecipes.length}
              </div>
            </div>

            {activeRecipes.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted">
                No recipes match. Clear filters or try another meal.
              </div>
            ) : (
              <DataList>
                {activeRecipes.map((entry) => (
                  <RecipeRow
                    key={entry.id}
                    recipe={entry}
                    isFavorite={favorites.includes(entry.id)}
                    onToggleFavorite={toggleFavorite}
                    onOpenRecipe={setSelectedRecipe}
                  />
                ))}
              </DataList>
            )}
          </div>
        </motion.div>
          </motion.div>
        )}

      </motion.div>

      <AnimatePresence>
        {selectedRecipe ? (
          <RecipeModal
            recipe={selectedRecipe}
            isFavorite={favorites.includes(selectedRecipe.id)}
            onToggleFavorite={toggleFavorite}
            onClose={() => setSelectedRecipe(null)}
          />
        ) : null}
      </AnimatePresence>
    </>
  );
}

function RecipeRow({
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
    <DataRow className="items-center gap-2">
      <button
        type="button"
        onClick={() => onOpenRecipe(recipe)}
        className="openable min-w-0 flex-1 text-left"
        aria-label={`Open ${recipe.title}`}
      >
        <TypeHeading className="truncate">{recipe.title}</TypeHeading>
        <div className="type-meta mt-0.5 flex flex-wrap gap-x-2 gap-y-0.5">
          <span>{recipe.nutrition.calories} kcal</span>
          <span>{recipe.nutrition.protein_g}g P</span>
          <span>{recipe.timeMinutes} min</span>
        </div>
      </button>
      <button
        type="button"
        onClick={() => onToggleFavorite(recipe.id)}
        className="soft-chip shrink-0 px-2 py-1 text-[11px]"
        aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
      >
        <span className={isFavorite ? "text-accent" : "text-muted"}>
          {isFavorite ? "Saved" : "Save"}
        </span>
      </button>
      <OpenHint kind="open" />
    </DataRow>
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
  const [showMore, setShowMore] = useState(false);
  const mounted = useIsClient();

  useOverlayLock(true);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  if (!mounted) {
    return null;
  }

  return createPortal(
    <motion.div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-[var(--scrim)] p-3 sm:items-center sm:p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      onClick={onClose}
    >
      <motion.div
        className="glass-card flex max-h-[min(92vh,720px)] w-full max-w-md flex-col overflow-hidden p-0"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 12 }}
        transition={{ duration: 0.2 }}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={recipe.title}
      >
        <div className="flex items-start justify-between gap-3 px-4 pt-4 pb-3">
          <div className="min-w-0">
            <div className="type-kicker">
              {recipe.meal} · {recipe.timeMinutes} min
            </div>
            <h3 className="type-title mt-0.5 leading-snug">{recipe.title}</h3>
          </div>
          <div className="flex shrink-0 gap-1">
            <button
              type="button"
              onClick={() => onToggleFavorite(recipe.id)}
              className={`soft-chip px-2.5 py-1 text-[11px] ${
                isFavorite ? "text-accent" : "text-muted"
              }`}
            >
              {isFavorite ? "Saved" : "Save"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="soft-chip px-2.5 py-1 text-[11px] text-muted"
            >
              Close
            </button>
          </div>
        </div>

        <div className="themed-scroll overflow-y-auto px-4 pb-5">
          <div className="grid gap-4">
            <StatStrip cols={4}>
              <StatCell label="Cal" value={n.calories} />
              <StatCell label="Protein" value={`${n.protein_g}g`} />
              <StatCell label="Carbs" value={`${n.carbs_g}g`} />
              <StatCell label="Fat" value={`${n.fat_g}g`} />
            </StatStrip>

            <section className="grid gap-1.5">
              <div className="type-kicker">Ingredients</div>
              <ul className="grid gap-1">
                {recipe.ingredients.map((ingredient) => (
                  <li key={ingredient} className="text-sm text-foreground/90">
                    {ingredient}
                  </li>
                ))}
              </ul>
            </section>

            <section className="grid gap-1.5">
              <div className="type-kicker">Steps</div>
              <ol className="grid gap-2">
                {recipe.steps.map((step, index) => (
                  <li key={step} className="flex gap-2 text-sm text-foreground/90">
                    <span className="w-4 shrink-0 text-muted">{index + 1}</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </section>

            <div className="border-t border-border/40 pt-3">
              <button
                type="button"
                onClick={() => setShowMore((open) => !open)}
                className="openable flex w-full items-center justify-between gap-2 text-left text-[11px] text-muted hover:text-foreground"
              >
                <span>More details</span>
                <OpenHint kind="expand" />
              </button>

              {showMore ? (
                <div className="mt-3 grid gap-3">
                  <p className="text-xs text-muted">{recipe.description}</p>

                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] text-muted">
                    {(
                      [
                        ["Fiber", `${n.fiber_g}g`],
                        ["Sugar", `${n.sugar_g}g`],
                        ["Sodium", `${n.sodium_mg}mg`],
                        ["Iron", `${n.iron_mg}mg`],
                        ["Calcium", `${n.calcium_mg}mg`],
                        ["Potassium", `${n.potassium_mg}mg`],
                        ["Vit C", `${n.vitaminC_mg}mg`],
                        ["Vit D", `${n.vitaminD_mcg}mcg`],
                      ] as const
                    ).map(([label, value]) => (
                      <div
                        key={label}
                        className="flex justify-between gap-2 border-b border-border/30 py-1"
                      >
                        <span>{label}</span>
                        <span className="text-foreground">{value}</span>
                      </div>
                    ))}
                  </div>

                  <p className="text-xs text-muted">{recipe.benefits}</p>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>,
    document.body,
  );
}
