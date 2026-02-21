import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongoose";
import { User } from "@/lib/models/User";
import { normalizeUsername } from "@/lib/validation/username";
import { authResolveSchema, getFirstZodError } from "@/lib/validation/schemas";

export async function POST(request: Request) {
  try {
    const payload = authResolveSchema.safeParse(await request.json());
    if (!payload.success) {
      return NextResponse.json(
        { error: getFirstZodError(payload.error) },
        { status: 400 },
      );
    }

    const { identifier } = payload.data;

    await connectToDatabase();

    const user = await User.findOne({ username: normalizeUsername(identifier) });

    if (!user?.email) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ email: user.email });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Resolve failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
