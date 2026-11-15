export type RoutineTaskType = "recipe" | "workout" | "general";

export type RoutineTask = {
  id: string;
  time: string;
  endTime?: string;
  title: string;
  highlight?: boolean;
  type: RoutineTaskType;
  targetId?: string;
  notes: string;
  alarmLabel: string;
};

export type RoutineTaskInput = RoutineTask & {
  meta?: string;
};

export type DayName =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export type TasksByDay = Record<DayName, RoutineTask[]>;

export const DAY_NAMES: DayName[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

export const resolveEndTime = (time: string, endTime?: string) => {
  if (endTime && endTime.trim()) {
    return endTime;
  }
  return time;
};

export const createEmptyTasksByDay = (): TasksByDay => ({
  monday: [],
  tuesday: [],
  wednesday: [],
  thursday: [],
  friday: [],
  saturday: [],
  sunday: [],
});

export const sanitizeTask = (task: RoutineTaskInput): RoutineTask => ({
  id: task.id,
  time: task.time,
  endTime: resolveEndTime(task.time, task.endTime),
  title: task.title,
  highlight: task.highlight,
  type: task.type,
  targetId: task.targetId,
  notes: task.notes,
  alarmLabel: task.alarmLabel,
});

export const sanitizeTasksByDay = (
  tasksByDay: Partial<TasksByDay>,
): TasksByDay => ({
  monday: (tasksByDay.monday ?? []).map(sanitizeTask),
  tuesday: (tasksByDay.tuesday ?? []).map(sanitizeTask),
  wednesday: (tasksByDay.wednesday ?? []).map(sanitizeTask),
  thursday: (tasksByDay.thursday ?? []).map(sanitizeTask),
  friday: (tasksByDay.friday ?? []).map(sanitizeTask),
  saturday: (tasksByDay.saturday ?? []).map(sanitizeTask),
  sunday: (tasksByDay.sunday ?? []).map(sanitizeTask),
});

export const classifyTasksByDay = (tasks: RoutineTaskInput[]): TasksByDay => {
  const tasksByDay = createEmptyTasksByDay();

  tasks.forEach((task) => {
    const sanitized = sanitizeTask(task);
    const meta = task.meta?.toLowerCase() ?? "";

    if (meta.includes("daily")) {
      DAY_NAMES.forEach((day) => tasksByDay[day].push(sanitized));
      return;
    }

    let matched = false;
    DAY_NAMES.forEach((day) => {
      if (meta.includes(day)) {
        tasksByDay[day].push(sanitized);
        matched = true;
      }
    });

    if (!matched) {
      DAY_NAMES.forEach((day) => tasksByDay[day].push(sanitized));
    }
  });

  return tasksByDay;
};

export const isTasksByDayEmpty = (tasksByDay?: TasksByDay | null) => {
  if (!tasksByDay) {
    return true;
  }
  return Object.values(tasksByDay).every((day) => day.length === 0);
};
