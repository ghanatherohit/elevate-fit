import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongoose";
import { User } from "@/lib/models/User";
import { normalizeUsername } from "@/lib/validation/username";

export async function POST(request: Request) {
  const { identifier } = (await request.json()) as { identifier?: string };

  if (!identifier) {
    return NextResponse.json({ error: "Missing identifier" }, { status: 400 });
  }

  await connectToDatabase();

  const user = await User.findOne({ username: normalizeUsername(identifier) });

  if (!user?.email) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({ email: user.email });
}
