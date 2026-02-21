import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/auth/jwt";
import { buildDailyDietPlan } from "@/lib/diet/planner";
import { connectToDatabase } from "@/lib/db/mongoose";
import { recipes } from "@/lib/data/recipes";
import { User } from "@/lib/models/User";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("ef_session")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let uid = "";
    try {
      const payload = verifySession(token);
      uid = payload.uid;
    } catch {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    await connectToDatabase();

    const user = await User.findOne({ uid }).select("dietTargets dietProfile");
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!user.dietTargets || !user.dietProfile) {
      return NextResponse.json(
        { error: "Diet profile not configured", onboardingRequired: true },
        { status: 400 },
      );
    }

    const plan = buildDailyDietPlan(user.dietTargets);

    const meals = plan.meals
      .map((entry) => {
        const recipe = recipes.find((item) => item.id === entry.recipeId);
        if (!recipe) {
          return null;
        }

        return {
          ...entry,
          recipe,
        };
      })
      .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));

    return NextResponse.json({
      dateKey: plan.dateKey,
      profile: user.dietProfile,
      targets: user.dietTargets,
      meals,
      totals: {
        plannedCalories: plan.totalPlannedCalories,
        plannedProteinG: plan.totalPlannedProteinG,
        targetCalories: Math.round(user.dietTargets.targetCalories),
        targetProteinG: Math.round(user.dietTargets.proteinG),
        calorieGap: Math.round(user.dietTargets.targetCalories) - plan.totalPlannedCalories,
        proteinGap: Math.round(user.dietTargets.proteinG) - plan.totalPlannedProteinG,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to load daily diet plan";

    return NextResponse.json(
      {
        error:
          "Diet service is temporarily unavailable. Please check your database connection and try again.",
        details: message,
      },
      { status: 503 },
    );
  }
}
