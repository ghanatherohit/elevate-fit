import { cookies } from "next/headers";
import { verifySession, type SessionPayload } from "./jwt";
import { connectToDatabase } from "@/lib/db/mongoose";
import { User } from "@/lib/models/User";

/** Access-token lifetime in seconds — keep cookie maxAge in sync. */
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24;

export async function requireSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("ef_session")?.value;

  if (!token) {
    return null;
  }

  try {
    const payload = verifySession(token);
    const tokenVersion =
      typeof payload.sessionVersion === "number" ? payload.sessionVersion : 1;

    await connectToDatabase();
    const user = await User.findOne({ uid: payload.uid })
      .select("sessionVersion")
      .lean();

    if (!user) {
      return null;
    }

    const currentVersion = user.sessionVersion ?? 1;
    if (tokenVersion !== currentVersion) {
      return null;
    }

    return {
      ...payload,
      sessionVersion: currentVersion,
    };
  } catch {
    return null;
  }
}
