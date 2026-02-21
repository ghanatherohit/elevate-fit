import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongoose";
import { requireSession } from "@/lib/auth/session";
import { RoutineChecklist } from "@/lib/models/RoutineChecklist";
import {
  getFirstZodError,
  routineChecklistUpdateSchema,
} from "@/lib/validation/schemas";

type ChecklistDoc = {
  date: string;
  completedItemIds?: string[];
};

const toDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const buildCurrentWeekRange = () => {
  const now = new Date();
  const mondayOffset = (now.getDay() + 6) % 7;
  const monday = new Date(now);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(now.getDate() - mondayOffset);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  return {
    startDate: toDateKey(monday),
    endDate: toDateKey(sunday),
  };
};

export async function GET(request: Request) {
  const session = await requireSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const defaults = buildCurrentWeekRange();
  const startDate = searchParams.get("startDate") || defaults.startDate;
  const endDate = searchParams.get("endDate") || defaults.endDate;

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
}

export async function PUT(request: Request) {
  const session = await requireSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

  return NextResponse.json({
    date,
    completedItemIds: checklist.completedItemIds,
  });
}
