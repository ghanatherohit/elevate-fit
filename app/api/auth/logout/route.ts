import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/auth/jwt";
import { connectToDatabase } from "@/lib/db/mongoose";
import { User } from "@/lib/models/User";

export async function POST() {
  const cookieStore = await cookies();
  const token = cookieStore.get("ef_session")?.value;

  if (token) {
    try {
      const payload = verifySession(token);
      await connectToDatabase();
      await User.updateOne(
        { uid: payload.uid },
        { $inc: { sessionVersion: 1 } },
      );
    } catch {
      // Cookie may already be invalid — still clear it.
    }
  }

  cookieStore.set("ef_session", "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });

  return NextResponse.json({ ok: true });
}
