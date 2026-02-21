import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { adminAuth } from "@/lib/auth/firebase-admin";
import { connectToDatabase } from "@/lib/db/mongoose";
import { User } from "@/lib/models/User";
import { signSession } from "@/lib/auth/jwt";
import { getFirstZodError, sessionRequestSchema } from "@/lib/validation/schemas";
import {
  normalizeUsername,
} from "@/lib/validation/username";

export async function POST(request: Request) {
  try {
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

    if (normalizedUsername) {
      const existing = await User.findOne({
        username: normalizedUsername,
        uid: { $ne: uid },
      });
      if (existing) {
        return NextResponse.json(
          { error: "Username already in use" },
          { status: 409 },
        );
      }
    }

    const user = await User.findOneAndUpdate(
      { uid },
      { uid, email, name, photoURL: picture, username: normalizedUsername },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );

    const token = signSession({
      uid: user.uid,
      username: user.username,
      email: user.email,
      name: user.name,
      photoURL: user.photoURL,
    });

    const cookieStore = await cookies();
    cookieStore.set("ef_session", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return NextResponse.json({ user });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Session failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
