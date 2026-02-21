import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongoose";
import { requireSession } from "@/lib/auth/session";
import { WeeklyProgramPreference } from "@/lib/models/WeeklyProgramPreference";
import {
  getFirstZodError,
  weeklyProgramPreferenceUpdateSchema,
} from "@/lib/validation/schemas";

export async function GET() {
  const session = await requireSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectToDatabase();

    const preference = await WeeklyProgramPreference.findOne({ uid: session.uid })
      .select("trackWeeklyProgram programType startDate")
      .lean();

    return NextResponse.json({ preference: preference ?? null });
  } catch {
    return NextResponse.json(
      { error: "Database unavailable" },
      { status: 503 },
    );
  }
}

export async function PUT(request: Request) {
  const session = await requireSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = weeklyProgramPreferenceUpdateSchema.safeParse(await request.json());
  if (!payload.success) {
    return NextResponse.json(
      { error: getFirstZodError(payload.error) },
      { status: 400 },
    );
  }

  const { trackWeeklyProgram, programType, startDate } = payload.data;

  try {
    await connectToDatabase();

    const update: Record<string, unknown> = {
      uid: session.uid,
      trackWeeklyProgram,
      programType,
    };

    if (startDate) {
      update.startDate = new Date(startDate);
    }

    const preference = await WeeklyProgramPreference.findOneAndUpdate(
      { uid: session.uid },
      update,
      { new: true, upsert: true },
    );

    return NextResponse.json({ preference });
  } catch {
    return NextResponse.json(
      { error: "Database unavailable" },
      { status: 503 },
    );
  }
}
