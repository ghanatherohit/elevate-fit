import { NextResponse } from "next/server";
import {
  apiError,
  apiNotFound,
  apiUnauthorized,
  apiUnavailable,
  withApiHandler,
} from "@/lib/api/response";
import { USER_ERRORS } from "@/lib/errors/user-facing";
import { z } from "zod";
import { connectToDatabase } from "@/lib/db/mongoose";
import { requireSession } from "@/lib/auth/session";
import { DailyProgress } from "@/lib/models/DailyProgress";
import {
  buildIstWeekRange,
  shiftDateKey,
  toIstDateKey,
} from "@/lib/datetime/ist";
import { getFirstZodError } from "@/lib/validation/schemas";

type ProgressDoc = {
  date: string;
  tasksDone?: number;
  tasksTotal?: number;
  routineDone?: boolean;
  workoutDone?: boolean;
  water?: number;
};

const progressUpdateSchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format.")
    .optional(),
  tasksDone: z.number().int().min(0).optional(),
  tasksTotal: z.number().int().min(0).optional(),
  routineDone: z.boolean().optional(),
  workoutDone: z.boolean().optional(),
  water: z.number().int().min(0).max(40).optional(),
});

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

export async function GET(request: Request) {
  return withApiHandler("[progress]", async () => {
  
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
  
    const docs = (await DailyProgress.find({
      uid: session.uid,
      date: { $gte: startDate, $lte: endDate },
    })
      .select("date tasksDone tasksTotal routineDone workoutDone water")
      .lean()) as ProgressDoc[];
  
    const progressByDate: Record<
      string,
      {
        tasksDone?: number;
        tasksTotal?: number;
        routineDone?: boolean;
        workoutDone?: boolean;
        water?: number;
      }
    > = {};
  
    docs.forEach((entry) => {
      progressByDate[entry.date] = {
        tasksDone: entry.tasksDone ?? 0,
        tasksTotal: entry.tasksTotal ?? 0,
        routineDone: entry.routineDone ?? false,
        workoutDone: entry.workoutDone ?? false,
        water: entry.water ?? 0,
      };
    });
  
    return NextResponse.json({ progressByDate });

  });
}

export async function POST(request: Request) {
  return withApiHandler("[progress]", async () => {
  
    const session = await requireSession();
    if (!session) {
      return apiUnauthorized();
    }
  
    const payload = progressUpdateSchema.safeParse(await request.json());
    if (!payload.success) {
      return NextResponse.json(
        { error: getFirstZodError(payload.error) },
        { status: 400 },
      );
    }
  
    const { date: dateInput, ...fields } = payload.data;
    const date = dateInput || toIstDateKey();
  
    const updates: Record<string, number | boolean> = {};
    if (typeof fields.tasksDone === "number") updates.tasksDone = fields.tasksDone;
    if (typeof fields.tasksTotal === "number") updates.tasksTotal = fields.tasksTotal;
    if (typeof fields.routineDone === "boolean") {
      updates.routineDone = fields.routineDone;
    }
    if (typeof fields.workoutDone === "boolean") {
      updates.workoutDone = fields.workoutDone;
    }
    if (typeof fields.water === "number") updates.water = fields.water;
  
  if (!Object.keys(updates).length) {
    return apiError(USER_ERRORS.invalidPayload, 400);
  }
  
    await connectToDatabase();
  
    const progress = await DailyProgress.findOneAndUpdate(
      { uid: session.uid, date },
      {
        $set: updates,
        $setOnInsert: {
          uid: session.uid,
          date,
        },
      },
      { new: true, upsert: true },
    );
  
    return NextResponse.json({
      date,
      progress: {
        tasksDone: progress.tasksDone,
        tasksTotal: progress.tasksTotal,
        routineDone: progress.routineDone,
        workoutDone: progress.workoutDone,
        water: progress.water,
      },
    });

  });
}
