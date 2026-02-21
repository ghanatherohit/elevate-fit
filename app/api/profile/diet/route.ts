import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/auth/jwt";
import { connectToDatabase } from "@/lib/db/mongoose";
import { calculateDietTargets } from "@/lib/diet/planner";
import { User } from "@/lib/models/User";
import {
  dietProfileSchema,
  getFirstZodError,
} from "@/lib/validation/schemas";

const unauthorized = () =>
  NextResponse.json({ error: "Unauthorized" }, { status: 401 });

const getSessionUid = async () => {
  const cookieStore = await cookies();
  const token = cookieStore.get("ef_session")?.value;

  if (!token) {
    return null;
  }

  try {
    const payload = verifySession(token);
    return payload.uid;
  } catch {
    return null;
  }
};

export async function GET() {
  try {
    const uid = await getSessionUid();
    if (!uid) {
      return unauthorized();
    }

    await connectToDatabase();
    const user = await User.findOne({ uid }).select(
      "dietProfile dietTargets dietProfileCompletedAt",
    );

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const hasDietProfile = Boolean(user.dietProfile && user.dietTargets);
    return NextResponse.json({
      profile: user.dietProfile ?? null,
      targets: user.dietTargets ?? null,
      dietProfileCompletedAt: user.dietProfileCompletedAt ?? null,
      onboardingRequired: !hasDietProfile,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to load diet profile";
    return NextResponse.json(
      {
        error:
          "Diet profile service is temporarily unavailable. Please check your database connection and try again.",
        details: message,
      },
      { status: 503 },
    );
  }
}

export async function PUT(request: Request) {
  try {
    const uid = await getSessionUid();
    if (!uid) {
      return unauthorized();
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON payload" },
        { status: 400 },
      );
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
      { uid },
      {
        dietProfile: profile,
        dietTargets: targets,
        dietProfileCompletedAt: new Date(),
      },
      { new: true },
    ).select("dietProfile dietTargets dietProfileCompletedAt");

    if (!updatedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      profile: updatedUser.dietProfile,
      targets: updatedUser.dietTargets,
      dietProfileCompletedAt: updatedUser.dietProfileCompletedAt,
      onboardingRequired: false,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to save diet profile";
    return NextResponse.json(
      {
        error:
          "Diet profile service is temporarily unavailable. Please check your database connection and try again.",
        details: message,
      },
      { status: 503 },
    );
  }
}
