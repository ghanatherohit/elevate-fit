import { z } from "zod";
import {
  dietProfileSchema,
  profileUpdateSchema,
  routineChecklistUpdateSchema,
  routineTasksUpdateSchema,
} from "@/lib/validation/schemas";
import type { TasksByDay } from "@/lib/routine/tasks";
import type { DietProfile, DietTargets } from "@/lib/diet/planner";

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
export type DietProfileInput = z.infer<typeof dietProfileSchema>;
export type RoutineChecklistUpdate = z.infer<
  typeof routineChecklistUpdateSchema
>;
export type RoutineTasksUpdate = z.infer<typeof routineTasksUpdateSchema>;

export type ApiErrorBody = { error: string };

export type DashboardResponse = {
  user: {
    uid: string;
    username?: string | null;
    name?: string | null;
    email?: string | null;
    photoURL?: string | null;
    dietTargets?: DietTargets | null;
  } | null;
  todayKey: string;
  todayTasks: Array<{
    id: string;
    title: string;
    time: string;
    type: string;
    targetId?: string;
    completed: boolean;
  }>;
  dietPlan: {
    breakfast: { id: string; title: string; calories: number; protein: number } | null;
    lunch: { id: string; title: string; calories: number; protein: number } | null;
    dinner: { id: string; title: string; calories: number; protein: number } | null;
    totalCalories: number;
    totalProtein: number;
    onboardingRequired: boolean;
  };
  weeklyProgress: { completed: number; total: number; percent: number };
  streakDays: number;
  todayStats: {
    tasks: { done: number; total: number };
    meals: { planned: number };
    water: { current: number; goal: number };
  };
};

export type { TasksByDay, DietProfile, DietTargets };
