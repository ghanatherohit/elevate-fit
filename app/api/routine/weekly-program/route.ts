import { NextResponse } from "next/server";
import {
  apiError,
  apiUnauthorized,
  withApiHandler,
} from "@/lib/api/response";
import { USER_ERRORS } from "@/lib/errors/user-facing";
import { connectToDatabase } from "@/lib/db/mongoose";
import { requireSession } from "@/lib/auth/session";
import { WeeklyProgramPreference } from "@/lib/models/WeeklyProgramPreference";
import {
  getFirstZodError,
  weeklyProgramPreferenceUpdateSchema,
} from "@/lib/validation/schemas";

function toPublicPreference(preference: {
  trackWeeklyProgram?: boolean;
  programType?: string | null;
  startDate?: Date | string | null;
} | null) {
  if (!preference) {
    return null;
  }
  return {
    trackWeeklyProgram: Boolean(preference.trackWeeklyProgram),
    programType: preference.programType ?? null,
    startDate: preference.startDate
      ? new Date(preference.startDate).toISOString()
      : null,
  };
}

export async function GET() {
  return withApiHandler("[weekly-program GET]", async () => {
    const session = await requireSession();
    if (!session) {
      return apiUnauthorized();
    }

    await connectToDatabase();

    const preference = await WeeklyProgramPreference.findOne({
      uid: session.uid,
    })
      .select("trackWeeklyProgram programType startDate")
      .lean();

    return NextResponse.json({
      preference: toPublicPreference(preference),
    });
  });
}

export async function PUT(request: Request) {
  return withApiHandler("[weekly-program PUT]", async () => {
    const session = await requireSession();
    if (!session) {
      return apiUnauthorized();
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return apiError(USER_ERRORS.invalidPayload, 400);
    }

    const payload = weeklyProgramPreferenceUpdateSchema.safeParse(body);
    if (!payload.success) {
      return apiError(
        getFirstZodError(payload.error) || USER_ERRORS.invalidPayload,
        400,
      );
    }

    const { trackWeeklyProgram, programType, startDate } = payload.data;

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
    ).select("trackWeeklyProgram programType startDate");

    return NextResponse.json({
      preference: toPublicPreference(preference),
    });
  });
}
