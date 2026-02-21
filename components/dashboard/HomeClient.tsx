"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import GlassCard from "@/components/shared/GlassCard";
import ProgressRing from "@/components/progress/ProgressRing";
import { recipes } from "@/lib/data/recipes";
import { routineItems, type RoutineItem } from "@/lib/data/routines";
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
    targetId?: string;
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

type TasksByDay = {
  monday: RoutineItem[];
  tuesday: RoutineItem[];
  wednesday: RoutineItem[];
  thursday: RoutineItem[];
  friday: RoutineItem[];
  saturday: RoutineItem[];
  sunday: RoutineItem[];
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
  const toMinutes = (time: string) => {
    const match = time.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (!match) {
      return 0;
    }
    const hours = Number(match[1]) % 12;
    const minutes = Number(match[2]);
    const period = match[3].toUpperCase();
    return hours * 60 + minutes + (period === "PM" ? 12 * 60 : 0);
  };

  // Get current time in India (IST - UTC+5:30)
  const getCurrentTimeInIndia = () => {
    const now = new Date();
    const utcHours = now.getUTCHours();
    const utcMinutes = now.getUTCMinutes();
    
    // IST is UTC+5:30
    let istHours = (utcHours + 5) % 24;
    let istMinutes = utcMinutes + 30;
    
    if (istMinutes >= 60) {
      istHours = (istHours + 1) % 24;
      istMinutes -= 60;
    }
    
    return { hours: istHours, minutes: istMinutes };
  };

  const getCurrentOrNextTask = (tasks: typeof data.todayTasks) => {
    const istTime = getCurrentTimeInIndia();
    const currentMinutes = istTime.hours * 60 + istTime.minutes;

    const sortedTasks = [...tasks].sort(
      (a, b) => toMinutes(a.time) - toMinutes(b.time)
    );

    // Parse duration from meta (e.g., "55 mins" -> 55)
    const getDurationMinutes = (meta?: string): number => {
      if (!meta) return 60; // Default 60 mins if no meta
      const match = meta.match(/(\d+)\s*mins?/i);
      return match ? parseInt(match[1], 10) : 60;
    };

    // Find current task (current time falls within task's time range)
    const currentTask = sortedTasks.find((task) => {
      const taskStartMinutes = toMinutes(task.time);
      const durationMinutes = 
        (task as any).endTime 
          ? toMinutes((task as any).endTime) - taskStartMinutes
          : getDurationMinutes((task as any).meta);
      const taskEndMinutes = taskStartMinutes + durationMinutes;
      
      // Check if current time is between start and end time
      return currentMinutes >= taskStartMinutes && currentMinutes < taskEndMinutes;
    });

    if (currentTask) {
      return { task: currentTask, isNext: false };
    }

    // Find next upcoming task
    const nextTask = sortedTasks.find(
      (task) => toMinutes(task.time) > currentMinutes
    );

    if (nextTask) {
      return { task: nextTask, isNext: true };
    }

    // No upcoming task today
    return null;
  };

  // Get day name in India timezone (IST - UTC+5:30)
  // Helper to get day of week from year, month (0-11), date
  const getDayOfWeek = (year: number, month: number, day: number): string => {
    // Zeller's congruence (adapted for 0-11 months)
    const adjustedMonth = month < 2 ? month + 12 : month;
    const adjustedYear = month < 2 ? year - 1 : year;
    
    const dayOfWeek = (day + Math.floor((13 * (adjustedMonth + 1)) / 5) + adjustedYear + Math.floor(adjustedYear / 4) - Math.floor(adjustedYear / 100) + Math.floor(adjustedYear / 400)) % 7;
    
    // dayOfWeek: 0=Saturday, 1=Sunday, 2=Monday, 3=Tuesday, 4=Wednesday, 5=Thursday, 6=Friday
    const dayNames = ["saturday", "sunday", "monday", "tuesday", "wednesday", "thursday", "friday"];
    return dayNames[dayOfWeek];
  };

  const getDayKey = (date: Date = new Date()) => {
    const utcHours = date.getUTCHours();
    const utcMinutes = date.getUTCMinutes();
    const utcDate = date.getUTCDate();
    const utcMonth = date.getUTCMonth();
    const utcYear = date.getUTCFullYear();

    // IST is UTC+5:30
    let istHours = (utcHours + 5) % 24;
    let istMinutes = utcMinutes + 30;
    let istDate = utcDate;
    let istMonth = utcMonth;
    let istYear = utcYear;

    if (istMinutes >= 60) {
      istHours = (istHours + 1) % 24;
      istMinutes -= 60;
    }

    if (istHours >= 24) {
      istHours -= 24;
      istDate += 1;
    }

    return getDayOfWeek(istYear, istMonth, istDate);
  };

  const buildDateKey = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const buildRecentDates = (count: number) => {
    return Array.from({ length: count }, (_, index) => {
      const day = new Date();
      day.setDate(day.getDate() - index);
      return day;
    });
  };

  const createEmptyTasksByDay = (): TasksByDay => ({
    monday: [],
    tuesday: [],
    wednesday: [],
    thursday: [],
    friday: [],
    saturday: [],
    sunday: [],
  });

  const classifyTasksByDay = (items: RoutineItem[]): TasksByDay => {
    const tasksByDay = createEmptyTasksByDay();
    const dayNames = [
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
      "sunday",
    ] as const;

    items.forEach((task) => {
      const meta = task.meta?.toLowerCase() ?? "";
      if (meta.includes("daily")) {
        dayNames.forEach((day) => tasksByDay[day].push(task));
        return;
      }

      let matched = false;
      dayNames.forEach((day) => {
        if (meta.includes(day)) {
          tasksByDay[day].push(task);
          matched = true;
        }
      });

      if (!matched) {
        dayNames.forEach((day) => tasksByDay[day].push(task));
      }
    });

    return tasksByDay;
  };
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
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good morning");
    else if (hour < 18) setGreeting("Good afternoon");
    else setGreeting("Good evening");

    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const today = new Date();
      const todayKey = buildDateKey(today);
      const streakDates = buildRecentDates(10);
      const weekDates = buildRecentDates(7);
      const recentStart = buildDateKey(streakDates[streakDates.length - 1]);

      const [userRes, tasksRes, checklistRes, dietRes] = await Promise.all([
        fetch("/api/auth/me"),
        fetch("/api/routine/tasks", { cache: "no-store" }),
        fetch(`/api/routine/checklist?startDate=${recentStart}&endDate=${todayKey}`),
        fetch("/api/diet/daily"),
      ]);

      const userData = await userRes.json();
      const tasksPayload = tasksRes.ok ? await tasksRes.json() : null;
      const checklistData = checklistRes.ok ? await checklistRes.json() : { completionByDate: {} };
      const tasksByDay = tasksPayload?.tasksByDay ?? classifyTasksByDay(routineItems);
      const user = userData.user;

      // Get today's tasks with completion status
      const todayDayKey = getDayKey(today);
      const todayTasksData = tasksByDay[todayDayKey as keyof TasksByDay] || [];
      const todayCompleted = checklistData.completionByDate?.[todayKey] || {};

      const tasksWithStatus = todayTasksData.map((task: any) => ({
        id: task.id,
        title: task.title,
        time: task.time,
        type: task.type || "general",
        targetId: task.targetId,
        completed: !!todayCompleted[task.id],
      }));

      const tasksSorted = [...tasksWithStatus].sort(
        (a, b) => toMinutes(a.time) - toMinutes(b.time),
      );
      const timeBuckets: Record<"morning" | "afternoon" | "evening", typeof tasksSorted> = {
        morning: [],
        afternoon: [],
        evening: [],
      };

      tasksSorted.forEach((task) => {
        const minutes = toMinutes(task.time);
        if (minutes < 12 * 60) {
          timeBuckets.morning.push(task);
        } else if (minutes < 17 * 60) {
          timeBuckets.afternoon.push(task);
        } else {
          timeBuckets.evening.push(task);
        }
      });

      const featuredTasks = [
        timeBuckets.morning[0],
        timeBuckets.afternoon[0],
        timeBuckets.evening[0],
      ].filter(Boolean) as typeof tasksSorted;

      // Fetch diet plan
      let dietPlanData: DashboardData['dietPlan'] = {
        breakfast: null,
        lunch: null,
        dinner: null,
        totalCalories: 0,
        totalProtein: 0,
      };

      try {
        if (dietRes.ok) {
          const dietData = await dietRes.json();
          
          const breakfast = dietData.meals?.find((m: any) => m.meal === "Breakfast");
          const lunch = dietData.meals?.find((m: any) => m.meal === "Lunch");
          const dinner = dietData.meals?.find((m: any) => m.meal === "Dinner");

          dietPlanData = {
            breakfast: breakfast ? {
              id: breakfast.recipe?.id || breakfast.recipeId,
              title: breakfast.recipe?.title || "Breakfast",
              calories: breakfast.recipe?.nutrition?.calories || 0,
              protein: `${Math.round(breakfast.recipe?.nutrition?.protein_g || 0)}g`,
            } : null,
            lunch: lunch ? {
              id: lunch.recipe?.id || lunch.recipeId,
              title: lunch.recipe?.title || "Lunch",
              calories: lunch.recipe?.nutrition?.calories || 0,
              protein: `${Math.round(lunch.recipe?.nutrition?.protein_g || 0)}g`,
            } : null,
            dinner: dinner ? {
              id: dinner.recipe?.id || dinner.recipeId,
              title: dinner.recipe?.title || "Dinner",
              calories: dinner.recipe?.nutrition?.calories || 0,
              protein: `${Math.round(dinner.recipe?.nutrition?.protein_g || 0)}g`,
            } : null,
            totalCalories: dietData.totals?.targetCalories || 0,
            totalProtein: dietData.totals?.targetProteinG || 0,
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
      const completionByDate = checklistData.completionByDate || {};
      const totalTasks = weekDates.reduce((sum, date) => {
        const dayKey = getDayKey(date);
        const dayTasks = tasksByDay[dayKey as keyof TasksByDay] || [];
        return sum + dayTasks.length;
      }, 0);
      const allCompleted = weekDates.reduce((sum, date) => {
        const dateKey = buildDateKey(date);
        const completed = completionByDate[dateKey] || {};
        return sum + Object.keys(completed).length;
      }, 0);
      const progressPercent = totalTasks > 0
        ? Math.round((allCompleted / totalTasks) * 100)
        : 0;

      let streakCount = 0;
      for (const date of streakDates) {
        const dateKey = buildDateKey(date);
        const completed = completionByDate[dateKey] || {};
        if (Object.keys(completed).length > 0) {
          streakCount += 1;
        } else {
          break;
        }
      }

      // Get next workout
      const nextWorkoutTask = tasksSorted.find((task) => task.type === "workout");
      const nextWorkoutData = nextWorkoutTask?.targetId
        ? workouts.find((workout) => workout.id === nextWorkoutTask.targetId)
        : workouts[0];

      // Today's stats
      const todayTasksDone = tasksWithStatus.filter((t: any) => t.completed).length;
      const todayTasksTotal = tasksWithStatus.length;
      const mealsPlanned = [dietPlanData.breakfast, dietPlanData.lunch, dietPlanData.dinner]
        .filter(m => m !== null).length;

      setData({
        user,
        todayTasks: featuredTasks.length > 0 ? featuredTasks : tasksSorted.slice(0, 3),
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
        streakDays: streakCount,
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

  const handleTaskToggle = async (taskId: string) => {
    setUpdatingTaskId(taskId);
    try {
      const today = buildDateKey(new Date());
      const response = await fetch("/api/routine/checklist", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: today,
          taskId,
          completed: true,
        }),
      });

      if (response.ok) {
        // Update local state to mark task as completed
        setData((prev) => ({
          ...prev,
          todayTasks: prev.todayTasks.map((task) =>
            task.id === taskId ? { ...task, completed: true } : task
          ),
          todayStats: {
            ...prev.todayStats,
            tasks: {
              done: prev.todayStats.tasks.done + 1,
              total: prev.todayStats.tasks.total,
            },
          },
        }));
      }
    } catch (error) {
      console.error("Error updating task:", error);
    } finally {
      setUpdatingTaskId(null);
    }
  };

  const displayName = data.user?.username || data.user?.name || "Rohit";
  const avatarUrl = data.user?.photoURL || null;
  const showAvatar = Boolean(avatarUrl) && !avatarError;
  const tasksPercent = data.todayStats.tasks.total > 0 
    ? Math.round((data.todayStats.tasks.done / data.todayStats.tasks.total) * 100)
    : 0;
  const resolveTaskHref = (task: DashboardData["todayTasks"][number]) => {
    if (task.type === "workout" && task.targetId) {
      return `/gym/${task.targetId}`;
    }
    if (task.type === "recipe" && task.targetId) {
      return `/recipes/${task.targetId}`;
    }
    return "/routine";
  };

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

      {/* Current/Next Task - Premium Display with Checkbox */}
      {data.todayTasks.length > 0 && getCurrentOrNextTask(data.todayTasks) && (
        <motion.div variants={item}>
          {(() => {
            const current = getCurrentOrNextTask(data.todayTasks);
            if (!current) return null;

            const { task, isNext } = current;
            const taskIcon =
              task.type === "workout"
                ? "💪"
                : task.type === "recipe"
                  ? "🍽️"
                  : "⭐";

            return (
              <div
                className="cursor-pointer transition-all"
                onClick={() => {
                  if (!task.completed) {
                    void handleTaskToggle(task.id);
                  }
                }}
              >
                <GlassCard className="group relative overflow-hidden transition-all">
                  {/* Background accent glow */}
                  <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-accent/5 blur-3xl transition group-hover:bg-accent/10" />

                <div className="relative">
                  {/* Header with status */}
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-semibold ${
                        task.completed
                          ? "bg-green-500/20 text-green-500"
                          : isNext
                            ? "bg-accent/15 text-accent"
                            : "bg-accent/20 text-accent"
                      }`}>
                        {task.completed
                          ? "✓ Completed"
                          : isNext
                            ? "📍 Next task"
                            : "🔥 Current task"}
                      </span>
                    </div>
                    <div className="text-xs text-muted font-medium">{task.time}</div>
                  </div>

                  {/* Main task display */}
                  <div className="flex items-start gap-4">
                    {/* Checkbox */}
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-card-strong">
                      <input
                        type="checkbox"
                        checked={task.completed}
                        onChange={(e) => {
                          e.stopPropagation();
                          if (!task.completed) {
                            void handleTaskToggle(task.id);
                          }
                        }}
                        disabled={updatingTaskId === task.id}
                        className="h-7 w-7 cursor-pointer accent-accent"
                        aria-label={`Mark ${task.title} as complete`}
                      />
                    </div>

                    {/* Task details */}
                    <div className="flex-1 min-w-0 pt-1">
                      <h3 className={`text-lg font-bold mb-1 ${
                        task.completed ? "text-muted line-through" : "text-foreground"
                      }`}>
                        {task.title}
                      </h3>
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-medium ${
                          task.type === "workout"
                            ? "bg-blue-500/15 text-blue-500"
                            : task.type === "recipe"
                              ? "bg-green-500/15 text-green-500"
                              : "bg-accent/15 text-accent"
                        }`}>
                          {task.type === "workout"
                            ? "Workout"
                            : task.type === "recipe"
                              ? "Meal"
                              : "Task"}
                        </div>
                        <div className="text-xs text-muted">
                          {task.completed ? "Finished" : isNext ? "Upcoming" : "In progress"}
                        </div>
                      </div>
                    </div>

                    {/* Link icon - only show if not current task */}
                    {isNext && (
                      <Link href={resolveTaskHref(task)} onClick={(e) => e.stopPropagation()}>
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-card-strong text-accent transition hover:translate-x-1">
                          →
                        </div>
                      </Link>
                    )}
                  </div>

                  {/* Footer - Progress and link to all tasks */}
                  <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                    <span className="text-xs text-muted">
                      {data.todayStats.tasks.done} of {data.todayStats.tasks.total} tasks done today
                    </span>
                    <Link href="/routine" className="text-xs font-semibold text-accent hover:underline">
                      All tasks →
                    </Link>
                  </div>
                </div>
              </GlassCard>
              </div>
            );
          })()}
        </motion.div>
      )}

      {/* No current task - Show all tasks link */}
      {data.todayTasks.length > 0 && !getCurrentOrNextTask(data.todayTasks) && (
        <motion.div variants={item}>
          <Link href="/routine">
            <GlassCard className="group relative overflow-hidden transition-all hover:border-accent/40 cursor-pointer">
              {/* Background accent glow */}
              <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-accent/5 blur-3xl transition group-hover:bg-accent/10" />

              <div className="relative text-center py-6">
                <div className="text-4xl mb-3">🎯</div>
                <h3 className="text-lg font-bold text-foreground mb-2">
                  No current task
                </h3>
                <p className="text-sm text-muted mb-4">
                  You've completed all tasks for today. Great job! 🎉
                </p>
                <div className="text-xs font-semibold text-accent inline-flex items-center gap-1">
                  View full schedule →
                </div>
              </div>
            </GlassCard>
          </Link>
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




