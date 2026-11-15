import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db/mongoose";

export const dynamic = "force-dynamic";

export async function GET() {
  const checks: Record<string, "ok" | "error" | "skipped"> = {
    mongo: "error",
    jwt: process.env.JWT_SECRET ? "ok" : "error",
    firebase: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? "ok" : "error",
  };

  try {
    await connectToDatabase();
    checks.mongo =
      mongoose.connection.readyState === 1 ? "ok" : "error";
  } catch {
    checks.mongo = "error";
  }

  const healthy = Object.values(checks).every((value) => value === "ok");

  return NextResponse.json(
    {
      status: healthy ? "ok" : "degraded",
      checks,
      timestamp: new Date().toISOString(),
    },
    { status: healthy ? 200 : 503 },
  );
}
