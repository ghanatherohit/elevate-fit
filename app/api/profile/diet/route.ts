import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { connectToDatabase } from "@/lib/db/mongoose";
import { calculateDietTargets } from "@/lib/diet/planner";
import { User } from "@/lib/models/User";
import {
  dietProfileSchema,
  getFirstZodError,
} from "@/lib/validation/schemas";

const unauthorized = () =>
  NextResponse.json({ error: "Unauthorized" }, { status: 401 });

export async function GET() {
  try {
    const session = await requireSession();
    if (!session) {
      return unauthorized();
    }

    await connectToDatabase();
    const user = await User.findOne({ uid: session.uid }).select(
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
    console.error("[profile/diet GET]", error);
    return NextResponse.json(
      {
        error:
          "Diet profile service is temporarily unavailable. Please try again shortly.",
      },
      { status: 503 },
    );
  }
}

export async function PUT(request: Request) {
  try {
    const session = await requireSession();
    if (!session) {
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
      { uid: session.uid },
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
    console.error("[profile/diet PUT]", error);
    return NextResponse.json(
      {
        error:
          "Diet profile service is temporarily unavailable. Please try again shortly.",
      },
      { status: 503 },
    );
  }
}
