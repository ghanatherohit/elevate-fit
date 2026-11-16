import { NextResponse } from "next/server";
import {
  apiError,
  apiNotFound,
  apiUnauthorized,
  apiUnavailable,
  withApiHandler,
} from "@/lib/api/response";
import { USER_ERRORS } from "@/lib/errors/user-facing";
import { connectToDatabase } from "@/lib/db/mongoose";
import { requireSession } from "@/lib/auth/session";
import { User } from "@/lib/models/User";
import { RoutineTaskList } from "@/lib/models/RoutineTaskList";
import { RoutineChecklist } from "@/lib/models/RoutineChecklist";
import { DailyProgress } from "@/lib/models/DailyProgress";
import { routineItems } from "@/lib/data/routines";
import { recipes } from "@/lib/data/recipes";
import {
  buildDailyDietPlan,
  calculateDietTargets,
  type DietProfile,
} from "@/lib/diet/planner";
import {
  buildRecentIstDateKeys,
  getDayNameFromDateKey,
  getIstDayName,
  toIstDateKey,
} from "@/lib/datetime/ist";
import {
  classifyTasksByDay,
  isTasksByDayEmpty,
  resolveEndTime,
  type DayName,
  type RoutineTaskInput,
  type TasksByDay,
} from "@/lib/routine/tasks";
import {
  computeStreakDays,
  computeWeeklyCompletion,
  waterMlToGlasses,
} from "@/lib/progress/metrics";
import { DIET_FORMULA_VERSION } from "@/lib/diet/version";

export async function GET() {
  return withApiHandler("[dashboard]", async () => {
  
    const session = await requireSession();
    if (!session) {
      return apiUnauthorized();
    }
  
    await connectToDatabase();
  
    const todayKey = toIstDateKey();
    const streakDateKeys = buildRecentIstDateKeys(10);
    const weekDateKeys = buildRecentIstDateKeys(7);
    const recentStart = streakDateKeys[streakDateKeys.length - 1];
  
    const [user, taskList, checklistDocs, progressDocs] = await Promise.all([
      User.findOne({ uid: session.uid }).lean(),
      RoutineTaskList.findOne({ uid: session.uid }).lean(),
      RoutineChecklist.find({
        uid: session.uid,
        date: { $gte: recentStart, $lte: todayKey },
      })
        .select("date completedItemIds")
        .lean(),
      DailyProgress.find({
        uid: session.uid,
        date: { $gte: recentStart, $lte: todayKey },
      })
        .select("date tasksDone tasksTotal routineDone workoutDone water")
        .lean(),
    ]);
  
    let tasksByDay = (taskList?.tasksByDay ?? null) as TasksByDay | null;
    if (!tasksByDay || isTasksByDayEmpty(tasksByDay)) {
      const raw = await RoutineTaskList.collection.findOne({ uid: session.uid });
      const sourceItems = (raw?.items?.length
        ? raw.items
        : routineItems) as RoutineTaskInput[];
      tasksByDay = classifyTasksByDay(
        sourceItems.map((item) => ({
          ...item,
          endTime: resolveEndTime(item.time, item.endTime),
        })),
      );
    }
  
    const todayDay = getIstDayName() as DayName;
    const todayTasks = tasksByDay[todayDay] ?? [];
  
    const completionByDate: Record<string, Record<string, boolean>> = {};
    checklistDocs.forEach((entry) => {
      completionByDate[entry.date] = Object.fromEntries(
        (entry.completedItemIds ?? []).map((id: string) => [id, true]),
      );
    });
  
    const progressByDate: Record<string, { water?: number }> = {};
    progressDocs.forEach((entry) => {
      progressByDate[entry.date] = { water: entry.water ?? 0 };
    });
  
    const tasksTotalByDate: Record<string, number> = {};
    [...new Set([...weekDateKeys, ...streakDateKeys])].forEach((dateKey) => {
      const dayName = getDayNameFromDateKey(dateKey) as DayName;
      tasksTotalByDate[dateKey] = tasksByDay?.[dayName]?.length ?? 0;
    });
  
    const todayCompleted = completionByDate[todayKey] || {};
    const tasksWithStatus = todayTasks.map((task) => ({
      ...task,
      completed: Boolean(todayCompleted[task.id]),
    }));
  
    let dietPlan = {
      breakfast: null as null | {
        id: string;
        title: string;
        calories: number;
        protein: number;
      },
      lunch: null as null | {
        id: string;
        title: string;
        calories: number;
        protein: number;
      },
      dinner: null as null | {
        id: string;
        title: string;
        calories: number;
        protein: number;
      },
      totalCalories: 0,
      totalProtein: 0,
      onboardingRequired: true,
    };
  
    if (user?.dietProfile) {
      let targets = user.dietTargets ?? null;
      if (!targets || (user.dietFormulaVersion ?? 1) < DIET_FORMULA_VERSION) {
        targets = calculateDietTargets(user.dietProfile as DietProfile);
        await User.updateOne(
          { uid: session.uid },
          {
            $set: {
              dietTargets: targets,
              dietFormulaVersion: DIET_FORMULA_VERSION,
            },
          },
        );
      }
  
      const plan = buildDailyDietPlan(targets);
      const mealMap = Object.fromEntries(
        plan.meals.map((entry) => {
          const recipe = recipes.find((item) => item.id === entry.recipeId);
          return [
            entry.meal.toLowerCase(),
            recipe
              ? {
                  id: recipe.id,
                  title: recipe.title,
                  calories: entry.adjustedCalories,
                  protein: entry.adjustedProteinG,
                }
              : null,
          ];
        }),
      );
  
      dietPlan = {
        breakfast: mealMap.breakfast ?? null,
        lunch: mealMap.lunch ?? null,
        dinner: mealMap.dinner ?? null,
        totalCalories: plan.totalPlannedCalories,
        totalProtein: plan.totalPlannedProteinG,
        onboardingRequired: false,
      };
    }
  
    const done = tasksWithStatus.filter((t) => t.completed).length;
    const total = tasksWithStatus.length;
    const todayProgress = progressByDate[todayKey] || {};
    const waterGoal = waterMlToGlasses(user?.dietTargets?.waterMl);
    const nextWorkout =
      tasksWithStatus.find((task) => task.type === "workout" && !task.completed) ??
      null;
  
    return NextResponse.json({
      user: user
        ? {
            uid: user.uid,
            username: user.username,
            name: user.name,
            email: user.email,
            photoURL: user.photoURL,
            dietTargets: user.dietTargets,
          }
        : null,
      todayKey,
      todayTasks: tasksWithStatus,
      dietPlan,
      nextWorkout,
      weeklyProgress: computeWeeklyCompletion(
        weekDateKeys,
        completionByDate,
        tasksTotalByDate,
      ),
      streakDays: computeStreakDays(
        streakDateKeys,
        completionByDate,
        tasksTotalByDate,
      ),
      todayStats: {
        tasks: { done, total },
        meals: {
          planned: [dietPlan.breakfast, dietPlan.lunch, dietPlan.dinner].filter(
            Boolean,
          ).length,
        },
        water: {
          current: todayProgress.water ?? 0,
          goal: waterGoal,
        },
      },
    });

  });
}
