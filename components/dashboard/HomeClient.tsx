"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import GlassCard from "@/components/shared/GlassCard";
import {
  DataList,
  DataRow,
  OpenHint,
} from "@/components/shared/DataSurfaces";
import DashboardLoading from "@/components/dashboard/DashboardLoading";
import ProgressRing from "@/components/progress/ProgressRing";
import { logoutClient } from "@/lib/auth/logout-client";
import { getIstClock, toIstDateKey } from "@/lib/datetime/ist";

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
  protein: number;
};

type DashboardData = {
  user: SessionUser | null;
  todayTasks: {
    id: string;
    title: string;
    time: string;
    endTime?: string;
    meta?: string;
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

  const getCurrentOrNextTask = (tasks: typeof data.todayTasks) => {
    const istTime = getIstClock();
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
      const durationMinutes = task.endTime
        ? toMinutes(task.endTime) - taskStartMinutes
        : getDurationMinutes(task.meta);
      const taskEndMinutes = taskStartMinutes + durationMinutes;

      return (
        currentMinutes >= taskStartMinutes && currentMinutes < taskEndMinutes
      );
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
  const [logoutError, setLogoutError] = useState<string | null>(null);

  useEffect(() => {
    const hour = getIstClock().hours;
    if (hour < 12) setGreeting("Good morning");
    else if (hour < 18) setGreeting("Good afternoon");
    else setGreeting("Good evening");

    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch("/api/dashboard", { cache: "no-store" });
      if (!response.ok) {
        throw new Error("Failed to load dashboard");
      }
      const payload = await response.json();

      const tasksSorted = [...(payload.todayTasks || [])].sort(
        (a: { time: string }, b: { time: string }) =>
          toMinutes(a.time) - toMinutes(b.time),
      );

      const nextWorkoutTask = tasksSorted.find(
        (task: { type: string; completed: boolean; targetId?: string; title: string }) =>
          task.type === "workout" && !task.completed,
      );

      setData({
        user: payload.user,
        todayTasks: tasksSorted,
        dietPlan: payload.dietPlan || {
          breakfast: null,
          lunch: null,
          dinner: null,
          totalCalories: 0,
          totalProtein: 0,
        },
        weeklyProgress: payload.weeklyProgress || {
          completed: 0,
          total: 0,
          percent: 0,
        },
        nextWorkout: nextWorkoutTask
          ? {
              id: nextWorkoutTask.targetId || nextWorkoutTask.id,
              title: nextWorkoutTask.title,
              focus: "Workout",
              duration: "",
            }
          : payload.nextWorkout
            ? {
                id: payload.nextWorkout.targetId || payload.nextWorkout.id,
                title: payload.nextWorkout.title,
                focus: "Workout",
                duration: "",
              }
            : null,
        streakDays: payload.streakDays ?? 0,
        todayStats: payload.todayStats || {
          tasks: { done: 0, total: 0 },
          meals: { planned: 0 },
          water: { current: 0, goal: 8 },
        },
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    const ok = await logoutClient();
    if (!ok) {
      return;
    }
    router.push("/welcome");
  };

  const handleTaskToggle = async (taskId: string, checked: boolean) => {
    setUpdatingTaskId(taskId);
    try {
      const today = toIstDateKey();
      const response = await fetch("/api/routine/checklist", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: today,
          itemId: taskId,
          checked,
        }),
      });

      if (response.ok) {
        setData((prev) => {
          const todayTasks = prev.todayTasks.map((task) =>
            task.id === taskId ? { ...task, completed: checked } : task,
          );
          const done = todayTasks.filter((task) => task.completed).length;
          const total = todayTasks.length;

          return {
            ...prev,
            todayTasks,
            todayStats: {
              ...prev.todayStats,
              tasks: { done, total },
            },
          };
        });
      }
    } catch (error) {
      console.error("Error updating task:", error);
    } finally {
      setUpdatingTaskId(null);
    }
  };

  const displayName = data.user?.username || data.user?.name || "Athlete";
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
    return <DashboardLoading />;
  }

  return (
    <motion.div
      className="grid gap-3"
      variants={container}
      initial="hidden"
      animate="show"
    >
      <motion.div variants={item}>
        <header className="flex items-center justify-between gap-3">
          <Link href="/profile" className="openable flex min-w-0 items-center gap-3 px-1 py-1">
            {showAvatar ? (
              <Image
                src={avatarUrl as string}
                alt={displayName}
                width={44}
                height={44}
                unoptimized
                referrerPolicy="no-referrer"
                className="h-11 w-11 rounded-2xl object-cover"
                onError={() => setAvatarError(true)}
              />
            ) : (
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-card-strong type-heading">
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <div className="type-kicker">{greeting}</div>
              <div className="type-title truncate">{displayName}</div>
            </div>
          </Link>
          <button
            type="button"
            className="soft-chip type-meta"
            onClick={() => {
              void handleLogout();
            }}
          >
            Logout
          </button>
        </header>
        {logoutError ? (
          <div className="type-meta mt-1 px-1" role="status" aria-live="polite">
            {logoutError}
          </div>
        ) : null}
      </motion.div>

      <motion.div variants={item}>
        <GlassCard className="grid gap-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="type-kicker">Today</div>
              <div className="type-title mt-0.5">
                {data.todayStats.tasks.done}/{data.todayStats.tasks.total} tasks
              </div>
              <div className="type-meta mt-1">
                {data.streakDays} day streak · {data.weeklyProgress.percent}% week
              </div>
            </div>
            <ProgressRing
              value={tasksPercent}
              label="Done"
              subtitle={`${tasksPercent}%`}
            />
          </div>

          <div className="grid grid-cols-3 gap-2 border-t border-border/40 pt-3">
            <div className="stat-cell">
              <div className="type-meta">Tasks</div>
              <div className="type-heading">
                {data.todayStats.tasks.done}/{data.todayStats.tasks.total}
              </div>
            </div>
            <div className="stat-cell">
              <div className="type-meta">Water</div>
              <div className="type-heading">
                {data.todayStats.water.current}/{data.todayStats.water.goal}
              </div>
            </div>
            <div className="stat-cell">
              <div className="type-meta">Meals</div>
              <div className="type-heading">
                {data.todayStats.meals.planned}/3
              </div>
            </div>
          </div>
        </GlassCard>
      </motion.div>

      {data.todayTasks.length > 0 && getCurrentOrNextTask(data.todayTasks) ? (
        <motion.div variants={item}>
          {(() => {
            const current = getCurrentOrNextTask(data.todayTasks);
            if (!current) return null;
            const { task, isNext } = current;
            const statusLabel = task.completed
              ? "Done"
              : isNext
                ? "Up next"
                : "Now";

            return (
              <GlassCard className="grid gap-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <div className="type-kicker">Focus</div>
                    <div className="type-meta mt-0.5">{statusLabel}</div>
                  </div>
                  <div className="type-meta">{task.time}</div>
                </div>

                <div className="flex items-start gap-3">
                  <label className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-xl bg-card-strong/60">
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={(event) => {
                        void handleTaskToggle(task.id, event.target.checked);
                      }}
                      disabled={updatingTaskId === task.id}
                      className="h-4 w-4 accent-accent"
                      aria-label={
                        task.completed
                          ? `Mark ${task.title} as incomplete`
                          : `Mark ${task.title} as complete`
                      }
                    />
                  </label>

                  <div className="min-w-0 flex-1">
                    <div
                      className={`type-title ${
                        task.completed ? "text-muted line-through" : ""
                      }`}
                    >
                      {task.title}
                    </div>
                    <div className="type-meta mt-1 capitalize">
                      {task.type === "workout"
                        ? "Workout"
                        : task.type === "recipe"
                          ? "Meal"
                          : "Task"}
                      {task.meta ? ` · ${task.meta}` : ""}
                    </div>
                  </div>

                  <Link
                    href={resolveTaskHref(task)}
                    className="openable soft-chip shrink-0 gap-1 type-meta"
                  >
                    Open
                    <OpenHint kind="open" />
                  </Link>
                </div>

                <div className="flex items-center justify-between border-t border-border/40 pt-3">
                  <span className="type-meta">
                    {data.todayStats.tasks.done} of {data.todayStats.tasks.total}{" "}
                    done
                  </span>
                  <Link
                    href="/routine"
                    className="openable soft-chip gap-1 type-meta"
                  >
                    Schedule
                    <OpenHint kind="open" />
                  </Link>
                </div>
              </GlassCard>
            );
          })()}
        </motion.div>
      ) : null}

      {data.todayTasks.length > 0 && !getCurrentOrNextTask(data.todayTasks) ? (
        <motion.div variants={item}>
          <Link href="/routine" className="block">
            <GlassCard className="openable grid gap-1.5">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <div className="type-kicker">Schedule</div>
                  <div className="type-title">
                    {data.todayStats.tasks.done >= data.todayStats.tasks.total &&
                    data.todayStats.tasks.total > 0
                      ? "All tasks done"
                      : "Nothing on the clock"}
                  </div>
                </div>
                <OpenHint kind="open" />
              </div>
              <p className="type-meta">
                {data.todayStats.tasks.done >= data.todayStats.tasks.total &&
                data.todayStats.tasks.total > 0
                  ? "Today's checklist is clear."
                  : `${data.todayStats.tasks.done} of ${data.todayStats.tasks.total} checked — open the full schedule.`}
              </p>
            </GlassCard>
          </Link>
        </motion.div>
      ) : null}

      {(data.dietPlan.breakfast ||
        data.dietPlan.lunch ||
        data.dietPlan.dinner) && (
        <motion.div variants={item}>
          <GlassCard className="grid gap-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <div className="type-kicker">Meals</div>
                <div className="type-title">
                  {data.dietPlan.totalCalories} kcal ·{" "}
                  {Math.round(data.dietPlan.totalProtein)}g protein
                </div>
              </div>
              <Link
                href="/recipes"
                className="openable soft-chip gap-1 type-meta"
              >
                Recipes
                <OpenHint kind="open" />
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {(
                [
                  ["Breakfast", data.dietPlan.breakfast],
                  ["Lunch", data.dietPlan.lunch],
                  ["Dinner", data.dietPlan.dinner],
                ] as const
              ).map(([label, meal]) =>
                meal ? (
                  <Link
                    key={label}
                    href={`/recipes/${meal.id}`}
                    className="soft-tile openable flex items-start gap-2 px-3 py-2.5"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="type-kicker">{label}</div>
                      <div className="type-heading mt-0.5 line-clamp-2">
                        {meal.title}
                      </div>
                      <div className="type-meta mt-0.5">
                        {meal.calories} kcal · {Math.round(meal.protein)}g
                      </div>
                    </div>
                    <OpenHint kind="open" className="mt-0.5" />
                  </Link>
                ) : null,
              )}
            </div>
          </GlassCard>
        </motion.div>
      )}

      {data.nextWorkout ? (
        <motion.div variants={item}>
          <Link href={`/gym/${data.nextWorkout.id}`} className="block">
            <GlassCard className="openable flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="type-kicker">Next workout</div>
                <div className="type-title truncate">{data.nextWorkout.title}</div>
                <div className="type-meta mt-0.5">
                  {[data.nextWorkout.focus, data.nextWorkout.duration]
                    .filter(Boolean)
                    .join(" · ") || "Open session"}
                </div>
              </div>
              <OpenHint kind="open" />
            </GlassCard>
          </Link>
        </motion.div>
      ) : null}

      <motion.div variants={item}>
        <Link href="/progress" className="block">
          <GlassCard className="openable grid gap-2.5">
            <div className="flex items-center justify-between gap-2">
              <div>
                <div className="type-kicker">This week</div>
                <div className="type-title">{data.weeklyProgress.percent}%</div>
                <div className="type-meta mt-0.5">
                  {data.weeklyProgress.completed} of {data.weeklyProgress.total}{" "}
                  tasks
                </div>
              </div>
              <OpenHint kind="open" />
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-card-strong/60">
              <div
                className="h-full rounded-full bg-accent transition-all duration-500"
                style={{
                  width: `${Math.min(100, Math.max(0, data.weeklyProgress.percent))}%`,
                }}
              />
            </div>
          </GlassCard>
        </Link>
      </motion.div>

      <motion.div variants={item}>
        <GlassCard className="grid gap-2.5">
          <div>
            <div className="type-kicker">Shortcuts</div>
            <div className="type-title">Explore</div>
          </div>
          <DataList>
            {(
              [
                ["/health-plan", "Health plan", "Goals & targets"],
                ["/guidance", "Guidance", "Tips & advice"],
                ["/settings", "Settings", "Notifications"],
                ["/profile", "Profile", "Your info"],
              ] as const
            ).map(([href, title, meta]) => (
              <Link key={href} href={href} className="block">
                <DataRow className="openable group">
                  <div className="min-w-0">
                    <div className="type-heading">{title}</div>
                    <div className="type-meta">{meta}</div>
                  </div>
                  <OpenHint kind="open" />
                </DataRow>
              </Link>
            ))}
          </DataList>
        </GlassCard>
      </motion.div>
    </motion.div>
  );
}


