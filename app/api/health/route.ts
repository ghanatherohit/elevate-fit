import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db/mongoose";
import { hasFirebaseAdminCredentials } from "@/lib/auth/firebase-admin";
import { authorizeBearerSecret } from "@/lib/security/timing-safe";

export const dynamic = "force-dynamic";

/**
 * Public probe returns only status + timestamp (no config fingerprint).
 * Send `Authorization: Bearer $CRON_SECRET` to see subsystem checks.
 */
export async function GET(request: Request) {
  const checks: Record<string, "ok" | "error" | "skipped"> = {
    mongo: "error",
    jwt: process.env.JWT_SECRET ? "ok" : "error",
    firebase: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? "ok" : "error",
    firebaseAdmin: hasFirebaseAdminCredentials()
      ? "ok"
      : process.env.NODE_ENV === "production"
        ? "error"
        : "skipped",
  };

  try {
    await connectToDatabase();
    checks.mongo = mongoose.connection.readyState === 1 ? "ok" : "error";
  } catch {
    checks.mongo = "error";
  }

  const healthy = Object.values(checks).every(
    (value) => value === "ok" || value === "skipped",
  );

  const detailed = authorizeBearerSecret(request, process.env.CRON_SECRET);

  return NextResponse.json(
    detailed
      ? {
          status: healthy ? "ok" : "degraded",
          checks,
          timestamp: new Date().toISOString(),
        }
      : {
          status: healthy ? "ok" : "degraded",
          timestamp: new Date().toISOString(),
        },
    { status: healthy ? 200 : 503 },
  );
}
