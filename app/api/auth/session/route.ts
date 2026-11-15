import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { adminAuth } from "@/lib/auth/firebase-admin";
import { connectToDatabase } from "@/lib/db/mongoose";
import { User } from "@/lib/models/User";
import { signSession } from "@/lib/auth/jwt";
import { SESSION_MAX_AGE_SECONDS } from "@/lib/auth/session";
import { getFirstZodError, sessionRequestSchema } from "@/lib/validation/schemas";
import { normalizeUsername } from "@/lib/validation/username";
import { allowRequest, clientIp } from "@/lib/security/rate-limit";

export async function POST(request: Request) {
  try {
    const ip = clientIp(request);
    const allowed = await allowRequest({
      key: `auth-session:${ip}`,
      limit: 20,
      windowMs: 60_000,
    });
    if (!allowed) {
      return NextResponse.json(
        { error: "Too many attempts. Try again shortly." },
        { status: 429 },
      );
    }

    const payload = sessionRequestSchema.safeParse(await request.json());
    if (!payload.success) {
      return NextResponse.json(
        { error: getFirstZodError(payload.error) },
        { status: 400 },
      );
    }

    const { idToken, username } = payload.data;

    const decoded = await adminAuth.verifyIdToken(idToken);
    const { uid, email, name, picture } = decoded;

    await connectToDatabase();

    const normalizedUsername = username
      ? normalizeUsername(username)
      : undefined;

    const existingUser = await User.findOne({ uid });

    // Username is chosen once — if already set, ignore client payload and
    // still establish the session (e.g. returning Google user on /register).
    const shouldSetUsername = Boolean(
      normalizedUsername && !existingUser?.username,
    );

    if (shouldSetUsername && normalizedUsername) {
      const taken = await User.findOne({
        username: normalizedUsername,
        uid: { $ne: uid },
      });
      if (taken) {
        return NextResponse.json(
          { error: "Username already in use" },
          { status: 409 },
        );
      }
    }

    let user;
    try {
      user = await User.findOneAndUpdate(
        { uid },
        {
          $set: {
            uid,
            email,
            name,
            // Only overwrite when Google/Firebase actually sent a picture claim.
            ...(picture ? { photoURL: picture } : {}),
            ...(shouldSetUsername ? { username: normalizedUsername } : {}),
          },
          $setOnInsert: { sessionVersion: 1, dietFormulaVersion: 1 },
        },
        { new: true, upsert: true, setDefaultsOnInsert: true },
      );
    } catch (error) {
      // Race: unique username index can still throw if two signups collide.
      const code =
        error && typeof error === "object" && "code" in error
          ? (error as { code?: number }).code
          : undefined;
      if (code === 11000) {
        const keyPattern =
          error && typeof error === "object" && "keyPattern" in error
            ? (error as { keyPattern?: Record<string, unknown> }).keyPattern
            : undefined;
        const emailConflict = Boolean(keyPattern && "email" in keyPattern);
        return NextResponse.json(
          {
            error: emailConflict
              ? "That email is already registered."
              : "Username already in use",
          },
          { status: 409 },
        );
      }
      throw error;
    }

    const token = signSession({
      uid: user.uid,
      username: user.username,
      email: user.email,
      name: user.name,
      photoURL: user.photoURL,
      sessionVersion: user.sessionVersion ?? 1,
    });

    const cookieStore = await cookies();
    cookieStore.set("ef_session", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: SESSION_MAX_AGE_SECONDS,
    });

    return NextResponse.json({ user });
  } catch (error) {
    console.error("[auth/session]", error);
    return NextResponse.json({ error: "Session failed" }, { status: 500 });
  }
}
