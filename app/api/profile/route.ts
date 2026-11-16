import { NextResponse } from "next/server";
import {
  apiError,
  apiNotFound,
  apiUnauthorized,
  apiUnavailable,
  withApiHandler,
} from "@/lib/api/response";
import { USER_ERRORS } from "@/lib/errors/user-facing";
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
import { toPublicUser } from "@/lib/auth/session-cookie";

export async function PATCH(request: Request) {
  return withApiHandler("[profile]", async () => {
    const session = await requireSession();
    if (!session) {
      return apiUnauthorized();
    }

    const payloadData = profileUpdateSchema.safeParse(await request.json());
    if (!payloadData.success) {
      return apiError(
        getFirstZodError(payloadData.error) || USER_ERRORS.invalidPayload,
        400,
      );
    }

    const { username, name, photoURL } = payloadData.data;

    await connectToDatabase();

    const currentUser = await User.findOne({ uid: session.uid });
    if (!currentUser) {
      return apiNotFound(USER_ERRORS.userNotFound);
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
      return apiError(USER_ERRORS.usernameLocked, 400);
    }

    if (!currentUser.username && normalizedUsername) {
      const existing = await User.findOne({
        username: normalizedUsername,
        uid: { $ne: session.uid },
      });
      if (existing) {
        return apiError(USER_ERRORS.usernameInUse, 409);
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
      return apiNotFound(USER_ERRORS.userNotFound);
    }

    const publicUser = toPublicUser(user);

    const nextToken = signSession({
      uid: publicUser.uid,
      username: publicUser.username,
      email: publicUser.email,
      name: publicUser.name,
      photoURL: publicUser.photoURL,
      sessionVersion: publicUser.sessionVersion,
    });

    const cookieStore = await cookies();
    cookieStore.set("ef_session", nextToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: SESSION_MAX_AGE_SECONDS,
    });

    return NextResponse.json({ user: publicUser });
  });
}
