import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/auth/jwt";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("ef_session")?.value;

  if (!token) {
    return NextResponse.json({ user: null });
  }

  try {
    const payload = verifySession(token);
    return NextResponse.json({ user: payload });
  } catch {
    return NextResponse.json({ user: null }, { status: 401 });
  }
}
