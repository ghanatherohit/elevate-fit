import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongoose";
import { User } from "@/lib/models/User";
import { normalizeUsername } from "@/lib/validation/username";
import { authResolveSchema, getFirstZodError } from "@/lib/validation/schemas";
import { allowRequest, clientIp } from "@/lib/security/rate-limit";

const UNIFORM = {
  ok: true,
  message: "If an account exists, a reset email was sent.",
} as const;

/**
 * Password-reset helper. Never returns email or reveals account existence.
 * Sends Firebase reset email server-side when a matching account is found.
 */
export async function POST(request: Request) {
  try {
    const ip = clientIp(request);
    const allowed = await allowRequest({
      key: `auth-resolve:${ip}`,
      limit: 10,
      windowMs: 60_000,
    });
    if (!allowed) {
      return NextResponse.json(
        { error: "Too many attempts. Try again shortly." },
        { status: 429 },
      );
    }

    const payload = authResolveSchema.safeParse(await request.json());
    if (!payload.success) {
      return NextResponse.json(
        { error: getFirstZodError(payload.error) },
        { status: 400 },
      );
    }

    const { identifier } = payload.data;
    let email: string | null = null;

    if (identifier.includes("@")) {
      email = identifier.trim().toLowerCase();
    } else {
      await connectToDatabase();
      const user = await User.findOne({
        username: normalizeUsername(identifier),
      }).lean();
      email = user?.email ?? null;
    }

    if (email) {
      const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
      if (apiKey) {
        await fetch(
          `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              requestType: "PASSWORD_RESET",
              email,
            }),
          },
        ).catch(() => undefined);
      }
    }

    return NextResponse.json(UNIFORM);
  } catch {
    return NextResponse.json(UNIFORM);
  }
}
