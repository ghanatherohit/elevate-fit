import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongoose";
import { User } from "@/lib/models/User";
import { normalizeUsername } from "@/lib/validation/username";
import {
  getFirstZodError,
  loginInputSchema,
} from "@/lib/validation/schemas";
import { allowRequest, clientIp } from "@/lib/security/rate-limit";
import { adminAuth } from "@/lib/auth/firebase-admin";
import { authFailureResponse } from "@/lib/auth/auth-errors";
import { getMongoDuplicateKey } from "@/lib/auth/mongo-errors";
import { attachSessionCookie } from "@/lib/auth/session-cookie";
import { USER_ERRORS } from "@/lib/errors/user-facing";

export const dynamic = "force-dynamic";

const INVALID = { error: USER_ERRORS.invalidCredentials } as const;

async function resolveEmail(identifier: string) {
  if (identifier.includes("@")) {
    return identifier.trim().toLowerCase();
  }

  await connectToDatabase();
  const user = await User.findOne({
    username: normalizeUsername(identifier),
  }).lean();
  return user?.email ?? null;
}

async function signInWithPassword(email: string, password: string) {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  if (!apiKey) {
    throw new Error("Missing Firebase API key");
  }

  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        password,
        returnSecureToken: true,
      }),
    },
  );

  const data = (await response.json()) as {
    idToken?: string;
    error?: { message?: string };
  };

  if (!response.ok || !data.idToken) {
    return null;
  }

  return data;
}

export async function POST(request: Request) {
  try {
    const ip = clientIp(request);
    const allowed = await allowRequest({
      key: `auth-login:${ip}`,
      limit: 10,
      windowMs: 60_000,
    });
    if (!allowed) {
      return NextResponse.json(
        { error: USER_ERRORS.rateLimit },
        { status: 429 },
      );
    }

    const payload = loginInputSchema.safeParse(await request.json());
    if (!payload.success) {
      return NextResponse.json(
        { error: getFirstZodError(payload.error) },
        { status: 400 },
      );
    }

    const email = await resolveEmail(payload.data.identifier);
    if (!email) {
      return NextResponse.json(INVALID, { status: 401 });
    }

    const firebaseSession = await signInWithPassword(
      email,
      payload.data.password,
    );
    if (!firebaseSession?.idToken) {
      return NextResponse.json(INVALID, { status: 401 });
    }

    const decoded = await adminAuth.verifyIdToken(firebaseSession.idToken);
    await connectToDatabase();

    let user;
    try {
      user = await User.findOneAndUpdate(
        { uid: decoded.uid },
        {
          $set: {
            uid: decoded.uid,
            email: (decoded.email ?? email).trim().toLowerCase(),
            ...(typeof decoded.name === "string" && decoded.name.trim()
              ? { name: decoded.name.trim() }
              : {}),
            ...(decoded.picture ? { photoURL: decoded.picture } : {}),
          },
          $setOnInsert: { sessionVersion: 1, dietFormulaVersion: 1 },
        },
        { new: true, upsert: true, setDefaultsOnInsert: true },
      );
    } catch (error) {
      const duplicate = getMongoDuplicateKey(error);
      if (duplicate) {
        return NextResponse.json(
          {
            error: duplicate.fields.includes("email")
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
    console.error("[auth/login]", error);
    return authFailureResponse(error, { fallback: USER_ERRORS.signInFailed });
  }
}
