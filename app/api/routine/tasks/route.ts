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
import { RoutineTaskList } from "@/lib/models/RoutineTaskList";
import { routineItems } from "@/lib/data/routines";
import { getFirstZodError, routineTasksUpdateSchema } from "@/lib/validation/schemas";
import {
  classifyTasksByDay,
  createEmptyTasksByDay,
  isTasksByDayEmpty,
  resolveEndTime,
  sanitizeTasksByDay,
  type RoutineTaskInput,
} from "@/lib/routine/tasks";

export async function GET() {
  return withApiHandler("[routine/tasks]", async () => {
  
    const session = await requireSession();
    if (!session) {
      return apiUnauthorized();
    }
  
    await connectToDatabase();
  
    const taskList = await RoutineTaskList.findOne({ uid: session.uid }).lean();
  
    if (!taskList || isTasksByDayEmpty(taskList.tasksByDay)) {
      const rawTaskList = await RoutineTaskList.collection.findOne({
        uid: session.uid,
      });
      const sourceItems = (rawTaskList?.items?.length
        ? rawTaskList.items
        : routineItems) as RoutineTaskInput[];
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

  });
}

export async function PUT(request: Request) {
  return withApiHandler("[routine/tasks]", async () => {
  
    const session = await requireSession();
    if (!session) {
      return apiUnauthorized();
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

  });
}

export async function DELETE(request: Request) {
  return withApiHandler("[routine/tasks]", async () => {
  
    const session = await requireSession();
    if (!session) {
      return apiUnauthorized();
    }
  
    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get("itemId");
  
  if (!itemId) {
    return apiError(USER_ERRORS.invalidPayload, 400);
  }

  if (routineItems.some((item) => item.id === itemId)) {
    return apiError("Default tasks can’t be deleted.", 403);
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
      return NextResponse.json({ tasksByDay: createEmptyTasksByDay() });
    }
  
    return NextResponse.json({ tasksByDay: taskList.tasksByDay });

  });
}
