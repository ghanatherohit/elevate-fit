import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongoose";
import { requireSession } from "@/lib/auth/session";
import { RoutineTaskList } from "@/lib/models/RoutineTaskList";
import { routineItems } from "@/lib/data/routines";
import { getFirstZodError, routineTasksUpdateSchema } from "@/lib/validation/schemas";

const resolveEndTime = (time: string, endTime?: string) => {
  if (endTime && endTime.trim()) {
    return endTime;
  }

  return time;
};

type TaskItem = {
  id: string;
  time: string;
  endTime?: string;
  title: string;
  highlight?: boolean;
  type: "recipe" | "workout" | "general";
  targetId?: string;
  notes: string;
  alarmLabel: string;
};

type TaskItemInput = TaskItem & {
  meta?: string;
};

type TasksByDay = {
  monday: TaskItem[];
  tuesday: TaskItem[];
  wednesday: TaskItem[];
  thursday: TaskItem[];
  friday: TaskItem[];
  saturday: TaskItem[];
  sunday: TaskItem[];
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

const sanitizeTask = (task: TaskItemInput): TaskItem => ({
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

const sanitizeTasksByDay = (tasksByDay: Partial<TasksByDay>): TasksByDay => ({
  monday: (tasksByDay.monday ?? []).map(sanitizeTask),
  tuesday: (tasksByDay.tuesday ?? []).map(sanitizeTask),
  wednesday: (tasksByDay.wednesday ?? []).map(sanitizeTask),
  thursday: (tasksByDay.thursday ?? []).map(sanitizeTask),
  friday: (tasksByDay.friday ?? []).map(sanitizeTask),
  saturday: (tasksByDay.saturday ?? []).map(sanitizeTask),
  sunday: (tasksByDay.sunday ?? []).map(sanitizeTask),
});

const classifyTasksByDay = (tasks: TaskItemInput[]): TasksByDay => {
  const tasksByDay = createEmptyTasksByDay();

  tasks.forEach((task) => {
    const sanitized = sanitizeTask(task);
    const meta = task.meta?.toLowerCase() ?? "";
    if (meta.includes("daily")) {
      tasksByDay.monday.push(sanitized);
      tasksByDay.tuesday.push(sanitized);
      tasksByDay.wednesday.push(sanitized);
      tasksByDay.thursday.push(sanitized);
      tasksByDay.friday.push(sanitized);
      tasksByDay.saturday.push(sanitized);
      tasksByDay.sunday.push(sanitized);
    } else if (meta.includes("monday")) {
      tasksByDay.monday.push(sanitized);
    } else if (meta.includes("tuesday")) {
      tasksByDay.tuesday.push(sanitized);
    } else if (meta.includes("wednesday")) {
      tasksByDay.wednesday.push(sanitized);
    } else if (meta.includes("thursday")) {
      tasksByDay.thursday.push(sanitized);
    } else if (meta.includes("friday")) {
      tasksByDay.friday.push(sanitized);
    } else if (meta.includes("saturday")) {
      tasksByDay.saturday.push(sanitized);
    } else if (meta.includes("sunday")) {
      tasksByDay.sunday.push(sanitized);
    } else {
      tasksByDay.monday.push(sanitized);
      tasksByDay.tuesday.push(sanitized);
      tasksByDay.wednesday.push(sanitized);
      tasksByDay.thursday.push(sanitized);
      tasksByDay.friday.push(sanitized);
      tasksByDay.saturday.push(sanitized);
      tasksByDay.sunday.push(sanitized);
    }
  });

  return tasksByDay;
};

const isTasksByDayEmpty = (tasksByDay?: TasksByDay | null) => {
  if (!tasksByDay) {
    return true;
  }
  return Object.values(tasksByDay).every((day) => day.length === 0);
};

export async function GET() {
  const session = await requireSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectToDatabase();

  const taskList = await RoutineTaskList.findOne({ uid: session.uid }).lean();

  if (!taskList || isTasksByDayEmpty(taskList.tasksByDay)) {
    const rawTaskList = await RoutineTaskList.collection.findOne({ uid: session.uid });
    const sourceItems = (rawTaskList?.items?.length ? rawTaskList.items : routineItems) as TaskItemInput[];
    const itemsWithEndTime = sourceItems.map((item) => ({
      ...item,
      endTime: resolveEndTime(item.time, item.endTime),
    }));
    const tasksByDay = classifyTasksByDay(itemsWithEndTime);

    const saved = await RoutineTaskList.findOneAndUpdate(
      { uid: session.uid },
      {
        $set: { tasksByDay },
        $setOnInsert: { uid: session.uid },
        $unset: { items: "" },
      },
      { new: true, upsert: true },
    );

    return NextResponse.json({ tasksByDay: saved?.tasksByDay ?? tasksByDay });
  }

  return NextResponse.json({ tasksByDay: taskList.tasksByDay });
}

export async function PUT(request: Request) {
  const session = await requireSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = routineTasksUpdateSchema.safeParse(await request.json());
  if (!payload.success) {
    return NextResponse.json(
      { error: getFirstZodError(payload.error) },
      { status: 400 },
    );
  }

  await connectToDatabase();

  const tasksByDay = sanitizeTasksByDay(payload.data.tasksByDay);

  const taskList = await RoutineTaskList.findOneAndUpdate(
    { uid: session.uid },
    {
      $set: { tasksByDay },
      $setOnInsert: { uid: session.uid },
      $unset: { items: "" },
    },
    { new: true, upsert: true },
  );

  return NextResponse.json({ tasksByDay: taskList.tasksByDay });
}

export async function DELETE(request: Request) {
  const session = await requireSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const itemId = searchParams.get("itemId");

  if (!itemId) {
    return NextResponse.json({ error: "Missing itemId" }, { status: 400 });
  }

  if (routineItems.some((item) => item.id === itemId)) {
    return NextResponse.json({ error: "Default tasks cannot be deleted" }, { status: 403 });
  }

  await connectToDatabase();

  const taskList = await RoutineTaskList.findOneAndUpdate(
    { uid: session.uid },
    {
      $pull: {
        "tasksByDay.monday": { id: itemId },
        "tasksByDay.tuesday": { id: itemId },
        "tasksByDay.wednesday": { id: itemId },
        "tasksByDay.thursday": { id: itemId },
        "tasksByDay.friday": { id: itemId },
        "tasksByDay.saturday": { id: itemId },
        "tasksByDay.sunday": { id: itemId },
      },
    },
    { new: true },
  );

  if (!taskList) {
    return NextResponse.json({
      tasksByDay: {
        monday: [],
        tuesday: [],
        wednesday: [],
        thursday: [],
        friday: [],
        saturday: [],
        sunday: [],
      },
    });
  }

  return NextResponse.json({ tasksByDay: taskList.tasksByDay });
}
