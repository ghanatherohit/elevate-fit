import { NextResponse } from "next/server";
import {
  apiError,
  apiNotFound,
  apiUnauthorized,
  apiUnavailable,
} from "@/lib/api/response";
import { USER_ERRORS } from "@/lib/errors/user-facing";
import { requireSession } from "@/lib/auth/session";
import { connectToDatabase } from "@/lib/db/mongoose";
import { calculateDietTargets } from "@/lib/diet/planner";
import { User } from "@/lib/models/User";
import {
  dietProfileSchema,
  getFirstZodError,
} from "@/lib/validation/schemas";

export async function GET() {
  try {
    const session = await requireSession();
    if (!session) {
      return apiUnauthorized();
    }

    await connectToDatabase();
    const user = await User.findOne({ uid: session.uid }).select(
      "dietProfile dietTargets dietProfileCompletedAt",
    );

    if (!user) {
      return apiNotFound(USER_ERRORS.userNotFound);
    }

    const hasDietProfile = Boolean(user.dietProfile && user.dietTargets);
    return NextResponse.json({
      profile: user.dietProfile ?? null,
      targets: user.dietTargets ?? null,
      dietProfileCompletedAt: user.dietProfileCompletedAt ?? null,
      onboardingRequired: !hasDietProfile,
    });
  } catch (error) {
    return apiUnavailable("[profile/diet GET]", error);
  }
}

export async function PUT(request: Request) {
  try {
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

    const payload = dietProfileSchema.safeParse(body);
    if (!payload.success) {
      return NextResponse.json(
        { error: getFirstZodError(payload.error) },
        { status: 400 },
      );
    }

    const profile = payload.data;
    const targets = calculateDietTargets(profile);

    await connectToDatabase();
    const updatedUser = await User.findOneAndUpdate(
      { uid: session.uid },
      {
        dietProfile: profile,
        dietTargets: targets,
        dietProfileCompletedAt: new Date(),
      },
      { new: true },
    ).select("dietProfile dietTargets dietProfileCompletedAt");

    if (!updatedUser) {
      return apiNotFound(USER_ERRORS.userNotFound);
    }

    return NextResponse.json({
      profile: updatedUser.dietProfile,
      targets: updatedUser.dietTargets,
      dietProfileCompletedAt: updatedUser.dietProfileCompletedAt,
      onboardingRequired: false,
    });
  } catch (error) {
    return apiUnavailable("[profile/diet PUT]", error);
  }
}
