"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import GlassCard from "@/components/shared/GlassCard";
import ProgressRing from "@/components/progress/ProgressRing";
import { recipes } from "@/lib/data/recipes";
import { workouts } from "@/lib/data/workouts";

type SessionUser = {
  uid: string;
  username?: string | null;
  email?: string | null;
  name?: string | null;
  photoURL?: string | null;
};

type MealData = {
  id: string;
  title: string;
  calories: number;
  protein: string;
};

type DashboardData = {
  user: SessionUser | null;
  todayTasks: { 
    id: string; 
    title: string; 
    time: string; 
    type: string;
    completed: boolean;
  }[];
  dietPlan: {
    breakfast: MealData | null;
    lunch: MealData | null;
    dinner: MealData | null;
    totalCalories: number;
    totalProtein: number;
  };
  weeklyProgress: { 
    completed: number; 
    total: number;
    percent: number;
  };
  nextWorkout: { 
    id: string;
    title: string; 
    focus: string;
    duration: string;
  } | null;
  streakDays: number;
  todayStats: {
    tasks: { done: number; total: number };
    meals: { planned: number };
    water: { current: number; goal: number };
  };
};

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export default function HomeClient() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData>({
    user: null,
    todayTasks: [],
    dietPlan: {
      breakfast: null,
      lunch: null,
      dinner: null,
      totalCalories: 0,
      totalProtein: 0,
    },
    weeklyProgress: { completed: 0, total: 0, percent: 0 },
    nextWorkout: null,
    streakDays: 7,
    todayStats: {
      tasks: { done: 0, total: 0 },
      meals: { planned: 0 },
      water: { current: 5, goal: 8 },
    },
  });
  const [loading, setLoading] = useState(true);
  const [greeting, setGreeting] = useState("");
  const [avatarError, setAvatarError] = useState(false);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good morning");
    else if (hour < 18) setGreeting("Good afternoon");
    else setGreeting("Good evening");

    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch user info
      const userRes = await fetch("/api/auth/me");
      const userData = await userRes.json();
      const user = userData.user;

      // Fetch today's routine tasks
      const tasksRes = await fetch("/api/routine/tasks");
      const tasksData = await tasksRes.json();
      
      // Fetch checklist for today
      const today = new Date().toISOString().split("T")[0];
      const checklistRes = await fetch(`/api/routine/checklist?start=${today}&end=${today}`);
      const checklistData = await checklistRes.json();

      // Get today's tasks with completion status
      const todayKey = today;
      const todayTasksData = tasksData.tasksByDay?.[todayKey] || [];
      const todayCompleted = checklistData.completionByDate?.[todayKey] || {};

      const tasksWithStatus = todayTasksData.map((task: any) => ({
        id: task.id,
        title: task.title,
        time: task.time,
        type: task.type || "general",
        completed: !!todayCompleted[task.id],
      }));

      // Fetch diet plan
      let dietPlanData: DashboardData['dietPlan'] = {
        breakfast: null,
        lunch: null,
        dinner: null,
        totalCalories: 0,
        totalProtein: 0,
      };

      try {
        const dietRes = await fetch("/api/diet/daily");
        if (dietRes.ok) {
          const dietData = await dietRes.json();
          
          const breakfast = dietData.meals?.find((m: any) => m.meal === "Breakfast");
          const lunch = dietData.meals?.find((m: any) => m.meal === "Lunch");
          const dinner = dietData.meals?.find((m: any) => m.meal === "Dinner");

          dietPlanData = {
            breakfast: breakfast ? {
              id: breakfast.recipeId,
              title: breakfast.title,
              calories: breakfast.nutrition.calories,
              protein: breakfast.nutrition.protein_g + "g",
            } : null,
            lunch: lunch ? {
              id: lunch.recipeId,
              title: lunch.title,
              calories: lunch.nutrition.calories,
              protein: lunch.nutrition.protein_g + "g",
            } : null,
            dinner: dinner ? {
              id: dinner.recipeId,
              title: dinner.title,
              calories: dinner.nutrition.calories,
              protein: dinner.nutrition.protein_g + "g",
            } : null,
            totalCalories: dietData.totals?.calories || 0,
            totalProtein: dietData.totals?.protein_g || 0,
          };
        } else {
          // Fallback to sample recipes
          const breakfastRecipe = recipes.find(r => r.meal === "Breakfast");
          const lunchRecipe = recipes.find(r => r.meal === "Lunch");
          const dinnerRecipe = recipes.find(r => r.meal === "Dinner");

          if (breakfastRecipe) {
            dietPlanData.breakfast = {
              id: breakfastRecipe.id,
              title: breakfastRecipe.title,
              calories: breakfastRecipe.nutrition.calories,
              protein: breakfastRecipe.nutrition.protein_g + "g",
            };
          }
          if (lunchRecipe) {
            dietPlanData.lunch = {
              id: lunchRecipe.id,
              title: lunchRecipe.title,
              calories: lunchRecipe.nutrition.calories,
              protein: lunchRecipe.nutrition.protein_g + "g",
            };
          }
          if (dinnerRecipe) {
            dietPlanData.dinner = {
              id: dinnerRecipe.id,
              title: dinnerRecipe.title,
              calories: dinnerRecipe.nutrition.calories,
              protein: dinnerRecipe.nutrition.protein_g + "g",
            };
          }

          dietPlanData.totalCalories = 
            (dietPlanData.breakfast?.calories || 0) +
            (dietPlanData.lunch?.calories || 0) +
            (dietPlanData.dinner?.calories || 0);
          
          dietPlanData.totalProtein = 
            (parseFloat(dietPlanData.breakfast?.protein || "0") +
            parseFloat(dietPlanData.lunch?.protein || "0") +
            parseFloat(dietPlanData.dinner?.protein || "0"));
        }
      } catch (dietError) {
        console.log("Diet plan not available, using fallback");
      }

      // Calculate weekly progress
      const allTasksArray = Object.values(tasksData.tasksByDay || {}).flat();
      const allCompleted = Object.values(checklistData.completionByDate || {}).reduce(
        (sum: number, day: any) => sum + Object.keys(day).length, 
        0
      );
      const totalTasks = Array.isArray(allTasksArray) ? allTasksArray.length : 0;
      const progressPercent = totalTasks > 0 
        ? Math.round((allCompleted / totalTasks) * 100) 
        : 0;

      // Get next workout
      const nextWorkoutData = workouts[0];

      // Today's stats
      const todayTasksDone = tasksWithStatus.filter((t: any) => t.completed).length;
      const todayTasksTotal = tasksWithStatus.length;
      const mealsPlanned = [dietPlanData.breakfast, dietPlanData.lunch, dietPlanData.dinner]
        .filter(m => m !== null).length;

      setData({
        user,
        todayTasks: tasksWithStatus.slice(0, 4),
        dietPlan: dietPlanData,
        weeklyProgress: { 
          completed: allCompleted, 
          total: totalTasks,
          percent: progressPercent,
        },
        nextWorkout: nextWorkoutData ? {
          id: nextWorkoutData.id,
          title: nextWorkoutData.title,
          focus: nextWorkoutData.focus,
          duration: nextWorkoutData.duration,
        } : null,
        streakDays: 7 + Math.floor(Math.random() * 5),
        todayStats: {
          tasks: { done: todayTasksDone, total: todayTasksTotal },
          meals: { planned: mealsPlanned },
          water: { current: 5, goal: 8 },
        },
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/auth/login");
  };

  const displayName = data.user?.username || data.user?.name || "Rohit";
  const avatarUrl = data.user?.photoURL || null;
  const showAvatar = Boolean(avatarUrl) && !avatarError;
  const tasksPercent = data.todayStats.tasks.total > 0 
    ? Math.round((data.todayStats.tasks.done / data.todayStats.tasks.total) * 100)
    : 0;

  if (loading) {
    return (
      <div className="grid gap-5">
        <GlassCard className="p-8 text-center">
          <div className="text-sm text-muted">Loading your dashboard...</div>
        </GlassCard>
      </div>
    );
  }

  return (
    <motion.div
      className="grid gap-5"
      variants={container}
      initial="hidden"
      animate="show"
    >
      {/* Header with Profile */}
      <motion.div variants={item}>
        <header className="flex items-center justify-between">
          <Link href="/profile" className="flex items-center gap-3">
            {showAvatar ? (
              <img
                src={avatarUrl as string}
                alt={displayName}
                className="h-11 w-11 rounded-2xl border border-border object-cover transition hover:border-accent/40"
                onError={() => setAvatarError(true)}
              />
            ) : (
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-card-strong text-sm font-semibold text-foreground transition hover:bg-card">
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <p className="text-xs text-muted">{greeting}</p>
              <p className="font-display text-lg font-semibold text-foreground">
                {displayName}
              </p>
            </div>
          </Link>
          <button
            className="rounded-2xl border border-border bg-card px-3 py-2 text-xs text-muted transition hover:border-accent/30 hover:text-foreground"
            onClick={handleLogout}
          >
            Logout
          </button>
        </header>
      </motion.div>

      {/* Quick Stats Bar */}
      <motion.div variants={item}>
        <GlassCard className="grid gap-3">
          <div className="text-xs text-muted">
            {data.streakDays} day streak • {data.weeklyProgress.percent}% weekly progress
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="rounded-xl bg-card-strong px-3 py-1.5 text-xs">
              <span className="text-muted">Sleep:</span>{" "}
              <span className="font-semibold text-foreground">7h 10m</span>
            </div>
            <div className="rounded-xl bg-card-strong px-3 py-1.5 text-xs">
              <span className="text-muted">Water:</span>{" "}
              <span className="font-semibold text-foreground">
                {data.todayStats.water.current}/{data.todayStats.water.goal} glasses
              </span>
            </div>
            <div className="rounded-xl bg-card-strong px-3 py-1.5 text-xs">
              <span className="text-muted">Mood:</span>{" "}
              <span className="font-semibold text-foreground">Calm 😌</span>
            </div>
          </div>
        </GlassCard>
      </motion.div>

      {/* Today Overview */}
      <motion.div variants={item}>
        <GlassCard className="flex items-center justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="text-xs text-muted">Today's Progress</div>
            <div
              className="mt-1 text-xl font-semibold text-foreground"
              style={{ fontFamily: "var(--font-space)" }}
            >
              {data.todayStats.tasks.done} of {data.todayStats.tasks.total} tasks
            </div>
            <div className="mt-1 text-xs text-muted">
              {data.todayStats.meals.planned} meals planned • {data.dietPlan.totalCalories} cal target
            </div>
          </div>
          <ProgressRing value={tasksPercent} label="Done" subtitle={`${tasksPercent}%`} />
        </GlassCard>
      </motion.div>

      {/* Today's Diet Plan */}
      {(data.dietPlan.breakfast || data.dietPlan.lunch || data.dietPlan.dinner) && (
        <motion.div variants={item}>
          <GlassCard className="grid gap-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-muted">Today's Meals</div>
                <div className="text-sm font-semibold text-foreground">
                  {data.dietPlan.totalCalories} cal • {Math.round(data.dietPlan.totalProtein)}g protein
                </div>
              </div>
              <Link href="/recipes" className="text-xs font-semibold text-accent hover:underline">
                All Recipes →
              </Link>
            </div>

            <div className="grid gap-2">
              {data.dietPlan.breakfast && (
                <Link href={`/recipes/${data.dietPlan.breakfast.id}`}>
                  <div className="flex items-center justify-between rounded-xl border border-border bg-card-strong p-3 transition hover:border-accent/30 hover:bg-card">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">🌅</div>
                      <div>
                        <div className="text-sm font-medium text-foreground">
                          {data.dietPlan.breakfast.title}
                        </div>
                        <div className="text-xs text-muted">
                          Breakfast • {data.dietPlan.breakfast.calories} cal • {data.dietPlan.breakfast.protein}
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-accent">→</div>
                  </div>
                </Link>
              )}

              {data.dietPlan.lunch && (
                <Link href={`/recipes/${data.dietPlan.lunch.id}`}>
                  <div className="flex items-center justify-between rounded-xl border border-border bg-card-strong p-3 transition hover:border-accent/30 hover:bg-card">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">☀️</div>
                      <div>
                        <div className="text-sm font-medium text-foreground">
                          {data.dietPlan.lunch.title}
                        </div>
                        <div className="text-xs text-muted">
                          Lunch • {data.dietPlan.lunch.calories} cal • {data.dietPlan.lunch.protein}
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-accent">→</div>
                  </div>
                </Link>
              )}

              {data.dietPlan.dinner && (
                <Link href={`/recipes/${data.dietPlan.dinner.id}`}>
                  <div className="flex items-center justify-between rounded-xl border border-border bg-card-strong p-3 transition hover:border-accent/30 hover:bg-card">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">🌙</div>
                      <div>
                        <div className="text-sm font-medium text-foreground">
                          {data.dietPlan.dinner.title}
                        </div>
                        <div className="text-xs text-muted">
                          Dinner • {data.dietPlan.dinner.calories} cal • {data.dietPlan.dinner.protein}
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-accent">→</div>
                  </div>
                </Link>
              )}
            </div>
          </GlassCard>
        </motion.div>
      )}

      {/* Today's Tasks */}
      {data.todayTasks.length > 0 && (
        <motion.div variants={item}>
          <GlassCard className="grid gap-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-muted">Today's Schedule</div>
                <div className="text-sm font-semibold text-foreground">Your routine</div>
              </div>
              <Link href="/routine" className="text-xs font-semibold text-accent hover:underline">
                View All →
              </Link>
            </div>

            <div className="space-y-2">
              {data.todayTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center gap-3 rounded-xl border border-border bg-card-strong p-3 transition hover:bg-card"
                >
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm ${
                    task.completed ? "bg-accent/20 text-accent" : "bg-border text-muted"
                  }`}>
                    {task.completed ? "✓" : 
                     task.type === "workout" ? "💪" :
                     task.type === "recipe" ? "🍽️" : "○"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className={`text-sm font-medium ${task.completed ? "text-muted line-through" : "text-foreground"}`}>
                      {task.title}
                    </div>
                    <div className="text-xs text-muted">{task.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </motion.div>
      )}

      {/* Next Workout */}
      {data.nextWorkout && (
        <motion.div variants={item}>
          <Link href={`/gym/${data.nextWorkout.id}`}>
            <GlassCard className="group cursor-pointer transition-all hover:border-accent/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 text-2xl">
                    💪
                  </div>
                  <div>
                    <div className="text-xs text-muted">Next Workout</div>
                    <div className="text-sm font-semibold text-foreground">{data.nextWorkout.title}</div>
                    <div className="text-xs text-muted">{data.nextWorkout.focus} • {data.nextWorkout.duration}</div>
                  </div>
                </div>
                <div className="text-accent transition group-hover:translate-x-1">→</div>
              </div>
            </GlassCard>
          </Link>
        </motion.div>
      )}

      {/* Weekly Progress */}
      <motion.div variants={item}>
        <Link href="/progress">
          <GlassCard className="group cursor-pointer transition-all hover:border-accent/30">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-muted">Weekly Progress</div>
                <div className="mt-1 text-2xl font-bold text-foreground">
                  {data.weeklyProgress.percent}%
                </div>
                <div className="mt-1 text-xs text-muted">
                  {data.weeklyProgress.completed} of {data.weeklyProgress.total} tasks completed
                </div>
              </div>
              <div className="text-4xl">📊</div>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-border">
              <div 
                className="h-full bg-linear-to-r from-accent to-accent-2 transition-all duration-500"
                style={{ width: `${data.weeklyProgress.percent}%` }}
              />
            </div>
          </GlassCard>
        </Link>
      </motion.div>

      {/* Quick Navigation Grid */}
      <motion.div variants={item}>
        <GlassCard className="grid gap-3">
          <div>
            <div className="text-xs text-muted">Quick Access</div>
            <div className="text-sm font-semibold text-foreground">Explore more</div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Link href="/health-plan">
              <div className="group rounded-xl border border-border bg-card-strong p-4 transition-all hover:border-accent/30 hover:bg-card">
                <div className="text-2xl">🎯</div>
                <div className="mt-2 text-sm font-semibold text-foreground">Health Plan</div>
                <div className="text-xs text-muted">Goals & targets</div>
              </div>
            </Link>

            <Link href="/guidance">
              <div className="group rounded-xl border border-border bg-card-strong p-4 transition-all hover:border-accent/30 hover:bg-card">
                <div className="text-2xl">💡</div>
                <div className="mt-2 text-sm font-semibold text-foreground">Guidance</div>
                <div className="text-xs text-muted">Tips & advice</div>
              </div>
            </Link>

            <Link href="/settings">
              <div className="group rounded-xl border border-border bg-card-strong p-4 transition-all hover:border-accent/30 hover:bg-card">
                <div className="text-2xl">⚙️</div>
                <div className="mt-2 text-sm font-semibold text-foreground">Settings</div>
                <div className="text-xs text-muted">Notifications</div>
              </div>
            </Link>

            <Link href="/profile">
              <div className="group rounded-xl border border-border bg-card-strong p-4 transition-all hover:border-accent/30 hover:bg-card">
                <div className="text-2xl">👤</div>
                <div className="mt-2 text-sm font-semibold text-foreground">Profile</div>
                <div className="text-xs text-muted">Your info</div>
              </div>
            </Link>
          </div>
        </GlassCard>
      </motion.div>
    </motion.div>
  );
}




