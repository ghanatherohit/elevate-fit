import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/auth/firebase-admin";
import { authFailureResponse } from "@/lib/auth/auth-errors";
import { getMongoDuplicateKey } from "@/lib/auth/mongo-errors";
import { attachSessionCookie } from "@/lib/auth/session-cookie";
import { connectToDatabase } from "@/lib/db/mongoose";
import { User } from "@/lib/models/User";
import { USER_ERRORS } from "@/lib/errors/user-facing";
import { getFirstZodError, sessionRequestSchema } from "@/lib/validation/schemas";
import { normalizeUsername } from "@/lib/validation/username";
import { allowRequest, clientIp } from "@/lib/security/rate-limit";

export const dynamic = "force-dynamic";

function normalizeEmail(email: unknown) {
  if (typeof email !== "string") {
    return undefined;
  }
  const trimmed = email.trim().toLowerCase();
  return trimmed.length ? trimmed : undefined;
}

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
        { error: USER_ERRORS.rateLimit },
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
    const uid = decoded.uid;
    const email = normalizeEmail(decoded.email);
    const name =
      typeof decoded.name === "string" && decoded.name.trim()
        ? decoded.name.trim()
        : undefined;
    const picture =
      typeof decoded.picture === "string" && decoded.picture.trim()
        ? decoded.picture.trim()
        : undefined;

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
          { error: USER_ERRORS.usernameInUse },
          { status: 409 },
        );
      }
    }

    // Pre-check email uniqueness so Google login gets a clear 409, not a 500.
    if (email) {
      const emailOwner = await User.findOne({
        email,
        uid: { $ne: uid },
      })
        .select("uid username")
        .lean();
      if (emailOwner) {
        return NextResponse.json(
          { error: USER_ERRORS.emailConflict },
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
            ...(email ? { email } : {}),
            ...(name ? { name } : {}),
            // Only overwrite when Google/Firebase actually sent a picture claim.
            ...(picture ? { photoURL: picture } : {}),
            ...(shouldSetUsername ? { username: normalizedUsername } : {}),
          },
          $setOnInsert: { sessionVersion: 1, dietFormulaVersion: 1 },
        },
        { new: true, upsert: true, setDefaultsOnInsert: true },
      );
    } catch (error) {
      const duplicate = getMongoDuplicateKey(error);
      if (duplicate) {
        const emailConflict = duplicate.fields.includes("email");
        return NextResponse.json(
          {
            error: emailConflict
              ? USER_ERRORS.emailInUse
              : USER_ERRORS.usernameInUse,
          },
          { status: 409 },
        );
      }
      throw error;
    }

    if (!user) {
      throw new Error("Unable to create user session");
    }

    const publicUser = await attachSessionCookie(user);
    return NextResponse.json({ user: publicUser });
  } catch (error) {
    console.error("[auth/session]", error);
    return authFailureResponse(error, { fallback: USER_ERRORS.sessionFailed });
  }
}
