import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { connectToDatabase } from "@/lib/db/mongoose";
import { User } from "@/lib/models/User";
import { signSession } from "@/lib/auth/jwt";
import { SESSION_MAX_AGE_SECONDS } from "@/lib/auth/session";
import { normalizeUsername } from "@/lib/validation/username";
import {
  getFirstZodError,
  loginInputSchema,
} from "@/lib/validation/schemas";
import { allowRequest, clientIp } from "@/lib/security/rate-limit";
import { adminAuth } from "@/lib/auth/firebase-admin";

const INVALID = { error: "Invalid credentials" } as const;

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
        { error: "Too many attempts. Try again shortly." },
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

    const user = await User.findOneAndUpdate(
      { uid: decoded.uid },
      {
        $set: {
          uid: decoded.uid,
          email: decoded.email ?? email,
          name: decoded.name,
          ...(decoded.picture ? { photoURL: decoded.picture } : {}),
        },
        $setOnInsert: { sessionVersion: 1, dietFormulaVersion: 1 },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );

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
    console.error("[auth/login]", error);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
