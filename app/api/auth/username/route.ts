import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongoose";
import { User } from "@/lib/models/User";
import {
  isUsernameValid,
  normalizeUsername,
} from "@/lib/validation/username";
import { allowRequest, clientIp } from "@/lib/security/rate-limit";
import { USER_ERRORS } from "@/lib/errors/user-facing";

export const dynamic = "force-dynamic";

/**
 * Public username availability check for register (and profile edits).
 * GET /api/auth/username?username=foo
 */
export async function GET(request: Request) {
  try {
    const ip = clientIp(request);
    const allowed = await allowRequest({
      key: `auth-username:${ip}`,
      limit: 40,
      windowMs: 60_000,
    });
    if (!allowed) {
      return NextResponse.json(
        { error: USER_ERRORS.rateLimit },
        { status: 429 },
      );
    }

    const { searchParams } = new URL(request.url);
    const raw = searchParams.get("username") ?? "";
    const normalized = normalizeUsername(raw);

    if (!normalized) {
      return NextResponse.json({
        available: false,
        normalized: "",
        reason: "empty",
        message: "Enter a username.",
      });
    }

    if (!isUsernameValid(normalized)) {
      return NextResponse.json({
        available: false,
        normalized,
        reason: "invalid",
        message: "Use 3-20 chars: lowercase letters, numbers, underscore.",
      });
    }

    await connectToDatabase();

    const existing = await User.findOne({ username: normalized })
      .select("_id")
      .lean();

    if (existing) {
      return NextResponse.json({
        available: false,
        normalized,
        reason: "taken",
        message: USER_ERRORS.usernameInUse,
      });
    }

    return NextResponse.json({
      available: true,
      normalized,
      reason: null,
      message: "Username is available.",
    });
  } catch (error) {
    console.error("[auth/username]", error);
    return NextResponse.json(
      {
        available: false,
        reason: "error",
        error: USER_ERRORS.usernameCheckFailed,
        message: USER_ERRORS.usernameCheckFailed,
      },
      { status: 503 },
    );
  }
}
