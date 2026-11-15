import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { signSession } from "@/lib/auth/jwt";
import {
  requireSession,
  SESSION_MAX_AGE_SECONDS,
} from "@/lib/auth/session";
import { connectToDatabase } from "@/lib/db/mongoose";
import { User } from "@/lib/models/User";
import {
  getFirstZodError,
  profileUpdateSchema,
} from "@/lib/validation/schemas";
import { normalizeUsername } from "@/lib/validation/username";

export async function PATCH(request: Request) {
  const session = await requireSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

  const currentUser = await User.findOne({ uid: session.uid });
  if (!currentUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const normalizedUsername = username
    ? normalizeUsername(username)
    : undefined;

  // Username is chosen once at registration and cannot be changed later.
  if (
    currentUser.username &&
    normalizedUsername &&
    normalizedUsername !== currentUser.username
  ) {
    return NextResponse.json(
      { error: "Username cannot be changed after registration." },
      { status: 400 },
    );
  }

  if (!currentUser.username && normalizedUsername) {
    const existing = await User.findOne({
      username: normalizedUsername,
      uid: { $ne: session.uid },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Username already in use" },
        { status: 409 },
      );
    }
  }

  const update: Record<string, unknown> = {};
  if (!currentUser.username && normalizedUsername) {
    update.username = normalizedUsername;
  }
  if (name !== undefined) {
    update.name = name;
  }
  if (photoURL !== undefined) {
    update.photoURL = photoURL;
  }

  const user = await User.findOneAndUpdate(
    { uid: session.uid },
    update,
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
    sessionVersion: user.sessionVersion ?? 1,
  });

  const cookieStore = await cookies();
  cookieStore.set("ef_session", nextToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });

  return NextResponse.json({ user });
}
