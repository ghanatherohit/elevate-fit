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
import { RoutineChecklist } from "@/lib/models/RoutineChecklist";
import { RoutineTaskList } from "@/lib/models/RoutineTaskList";
import { DailyProgress } from "@/lib/models/DailyProgress";
import {
  buildIstWeekRange,
  getDayNameFromDateKey,
  shiftDateKey,
} from "@/lib/datetime/ist";
import {
  getFirstZodError,
  routineChecklistUpdateSchema,
} from "@/lib/validation/schemas";
import { deriveProgressFromChecklist } from "@/lib/progress/metrics";
import type { DayName, TasksByDay } from "@/lib/routine/tasks";

type ChecklistDoc = {
  date: string;
  completedItemIds?: string[];
};

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MAX_RANGE_DAYS = 366;

function parseDateRange(startDate: string, endDate: string) {
  if (!DATE_RE.test(startDate) || !DATE_RE.test(endDate)) {
    return { error: USER_ERRORS.invalidPayload };
  }
  if (startDate > endDate) {
    return { error: USER_ERRORS.invalidPayload };
  }
  let days = 0;
  let cursor = startDate;
  while (cursor <= endDate && days <= MAX_RANGE_DAYS) {
    days += 1;
    cursor = shiftDateKey(cursor, 1);
  }
  if (days > MAX_RANGE_DAYS) {
    return { error: USER_ERRORS.invalidPayload };
  }
  return { startDate, endDate };
}

async function tasksTotalForDate(uid: string, date: string) {
  const taskList = await RoutineTaskList.findOne({ uid }).lean();
  const day = getDayNameFromDateKey(date) as DayName;
  const tasksByDay = (taskList?.tasksByDay ?? null) as TasksByDay | null;
  return tasksByDay?.[day]?.length ?? 0;
}

export async function GET(request: Request) {
  return withApiHandler("[routine/checklist]", async () => {
  
    const session = await requireSession();
    if (!session) {
      return apiUnauthorized();
    }
  
    const { searchParams } = new URL(request.url);
    const defaults = buildIstWeekRange();
    const startDate = searchParams.get("startDate") || defaults.startDate;
    const endDate = searchParams.get("endDate") || defaults.endDate;
    const range = parseDateRange(startDate, endDate);
    if ("error" in range && range.error) {
      return NextResponse.json({ error: range.error }, { status: 400 });
    }
  
    await connectToDatabase();
  
    const docs = (await RoutineChecklist.find({
      uid: session.uid,
      date: { $gte: startDate, $lte: endDate },
    })
      .select("date completedItemIds")
      .lean()) as ChecklistDoc[];
  
    const completionByDate: Record<string, Record<string, boolean>> = {};
  
    docs.forEach((entry) => {
      completionByDate[entry.date] = Object.fromEntries(
        (entry.completedItemIds ?? []).map((itemId) => [itemId, true]),
      );
    });
  
    return NextResponse.json({ completionByDate });

  });
}

export async function PUT(request: Request) {
  return withApiHandler("[routine/checklist]", async () => {
  
    const session = await requireSession();
    if (!session) {
      return apiUnauthorized();
    }
  
    const payload = routineChecklistUpdateSchema.safeParse(await request.json());
    if (!payload.success) {
      return NextResponse.json(
        { error: getFirstZodError(payload.error) },
        { status: 400 },
      );
    }
  
    const { date, itemId, checked } = payload.data;
  
    await connectToDatabase();
  
    const update = checked
      ? { $addToSet: { completedItemIds: itemId } }
      : { $pull: { completedItemIds: itemId } };
  
    const checklist = await RoutineChecklist.findOneAndUpdate(
      { uid: session.uid, date },
      {
        $setOnInsert: {
          uid: session.uid,
          date,
        },
        ...update,
      },
      { new: true, upsert: true },
    );
  
    const completedItemIds = checklist.completedItemIds ?? [];
    const tasksTotal = await tasksTotalForDate(session.uid, date);
    const existingProgress = await DailyProgress.findOne({
      uid: session.uid,
      date,
    }).lean();
  
    const derived = deriveProgressFromChecklist({
      completedItemIds,
      tasksTotal,
      workoutDone: existingProgress?.workoutDone,
      water: existingProgress?.water,
    });
  
    await DailyProgress.findOneAndUpdate(
      { uid: session.uid, date },
      {
        $set: derived,
        $setOnInsert: {
          uid: session.uid,
          date,
        },
      },
      { upsert: true },
    );
  
    return NextResponse.json({
      date,
      completedItemIds,
      progress: derived,
    });

  });
}
