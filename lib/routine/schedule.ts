import type { RoutineTask } from "@/lib/routine/tasks";

const toMinutes = (time: string) => {
  const [hours, minutes] = time.split(":").map(Number);
  return (hours || 0) * 60 + (minutes || 0);
};

export type CurrentOrNextTask = {
  task: RoutineTask;
  isNext: boolean;
};

/** Pick the task whose window covers `currentMinutes`, else the next upcoming task. */
export function findCurrentOrNextTask(
  tasks: RoutineTask[],
  currentMinutes: number,
): CurrentOrNextTask | null {
  const sortedTasks = [...tasks].sort(
    (a, b) => toMinutes(a.time) - toMinutes(b.time),
  );

  const currentTask = sortedTasks.find((task) => {
    const start = toMinutes(task.time);
    const end = toMinutes(task.endTime || task.time);
    if (end > start) {
      return currentMinutes >= start && currentMinutes < end;
    }
    return currentMinutes >= start && currentMinutes < start + 60;
  });

  if (currentTask) {
    return { task: currentTask, isNext: false };
  }

  const nextTask = sortedTasks.find(
    (task) => toMinutes(task.time) > currentMinutes,
  );

  if (nextTask) {
    return { task: nextTask, isNext: true };
  }

  return null;
}
