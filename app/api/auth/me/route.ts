import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { connectToDatabase } from "@/lib/db/mongoose";
import { User } from "@/lib/models/User";

export async function GET() {
  const session = await requireSession();
  if (!session) {
    return NextResponse.json({ user: null });
  }

  await connectToDatabase();
  const user = await User.findOne({ uid: session.uid })
    .select("uid username email name photoURL")
    .lean();

  if (!user) {
    return NextResponse.json({ user: null });
  }

  return NextResponse.json({
    user: {
      uid: user.uid,
      username: user.username ?? null,
      email: user.email ?? null,
      name: user.name ?? null,
      photoURL: user.photoURL ?? null,
    },
  });
}
