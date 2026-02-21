import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySession, signSession } from "@/lib/auth/jwt";
import { connectToDatabase } from "@/lib/db/mongoose";
import { User } from "@/lib/models/User";
import {
  getFirstZodError,
  profileUpdateSchema,
} from "@/lib/validation/schemas";
import {
  normalizeUsername,
} from "@/lib/validation/username";

export async function PATCH(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get("ef_session")?.value;

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload;
  try {
    payload = verifySession(token);
  } catch {
    return NextResponse.json({ error: "Invalid session" }, { status: 401 });
  }

  const payloadData = profileUpdateSchema.safeParse(await request.json());
  if (!payloadData.success) {
    return NextResponse.json(
      { error: getFirstZodError(payloadData.error) },
      { status: 400 },
    );
  }

  const { username, name, photoURL } = payloadData.data;

  await connectToDatabase();

  const normalizedUsername = username
    ? normalizeUsername(username)
    : undefined;

  if (normalizedUsername) {
    const existing = await User.findOne({
      username: normalizedUsername,
      uid: { $ne: payload.uid },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Username already in use" },
        { status: 409 },
      );
    }
  }

  const user = await User.findOneAndUpdate(
    { uid: payload.uid },
    { username: normalizedUsername, name, photoURL },
    { new: true },
  );

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const nextToken = signSession({
    uid: user.uid,
    username: user.username,
    email: user.email,
    name: user.name,
    photoURL: user.photoURL,
  });

  cookieStore.set("ef_session", nextToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return NextResponse.json({ user });
}
