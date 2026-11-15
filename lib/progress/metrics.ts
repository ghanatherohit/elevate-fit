export type DayProgress = {
  tasksDone?: number;
  tasksTotal?: number;
  routineDone?: boolean;
  workoutDone?: boolean;
  water?: number;
};

export function computeStreakDays(
  dateKeysNewestFirst: string[],
  completionByDate: Record<string, Record<string, boolean>>,
  tasksTotalByDate?: Record<string, number>,
): number {
  let streak = 0;

  for (const dateKey of dateKeysNewestFirst) {
    const completed = completionByDate[dateKey] || {};
    const doneCount = Object.keys(completed).filter((id) => completed[id]).length;
    const total = tasksTotalByDate?.[dateKey];
    const complete =
      typeof total === "number" && total > 0
        ? doneCount >= total
        : doneCount > 0;

    if (!complete) {
      break;
    }
    streak += 1;
  }

  return streak;
}

export function computeWeeklyCompletion(
  dateKeys: string[],
  completionByDate: Record<string, Record<string, boolean>>,
  tasksTotalByDate: Record<string, number>,
): { completed: number; total: number; percent: number } {
  let completed = 0;
  let total = 0;

  dateKeys.forEach((dateKey) => {
    const dayTotal = tasksTotalByDate[dateKey] ?? 0;
    const done = Object.keys(completionByDate[dateKey] || {}).filter(
      (id) => completionByDate[dateKey][id],
    ).length;
    total += dayTotal;
    completed += Math.min(done, dayTotal);
  });

  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
  return { completed, total, percent };
}

export function deriveProgressFromChecklist(params: {
  completedItemIds: string[];
  tasksTotal: number;
  workoutDone?: boolean;
  water?: number;
}): {
  tasksDone: number;
  tasksTotal: number;
  routineDone: boolean;
  workoutDone: boolean;
  water: number;
} {
  const tasksDone = params.completedItemIds.length;
  const tasksTotal = Math.max(params.tasksTotal, tasksDone);
  return {
    tasksDone,
    tasksTotal,
    routineDone: tasksTotal > 0 && tasksDone >= tasksTotal,
    workoutDone: params.workoutDone ?? false,
    water: params.water ?? 0,
  };
}

/** Convert diet target milliliters to ~250ml glasses. */
export function waterMlToGlasses(waterMl?: number | null, fallback = 8): number {
  if (!waterMl || waterMl <= 0) {
    return fallback;
  }
  return Math.max(1, Math.round(waterMl / 250));
}
