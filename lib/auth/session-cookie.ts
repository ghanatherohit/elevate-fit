import { cookies } from "next/headers";
import { signSession } from "@/lib/auth/jwt";
import { SESSION_MAX_AGE_SECONDS } from "@/lib/auth/session";

export type SessionUserFields = {
  uid: string;
  username?: string | null;
  email?: string | null;
  name?: string | null;
  photoURL?: string | null;
  sessionVersion?: number | null;
};

/** Public user shape returned by auth APIs (never dump raw Mongoose docs). */
export function toPublicUser(user: SessionUserFields) {
  return {
    uid: user.uid,
    username: user.username ?? null,
    email: user.email ?? null,
    name: user.name ?? null,
    photoURL: user.photoURL ?? null,
    sessionVersion: user.sessionVersion ?? 1,
  };
}

export async function attachSessionCookie(user: SessionUserFields) {
  const publicUser = toPublicUser(user);
  const token = signSession({
    uid: publicUser.uid,
    username: publicUser.username,
    email: publicUser.email,
    name: publicUser.name,
    photoURL: publicUser.photoURL,
    sessionVersion: publicUser.sessionVersion,
  });

  const cookieStore = await cookies();
  cookieStore.set("ef_session", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });

  return publicUser;
}
