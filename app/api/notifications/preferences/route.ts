import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongoose";
import { NotificationPreference } from "@/lib/models/NotificationPreference";
import { requireSession } from "@/lib/auth/session";
import {
  getFirstZodError,
  notificationPreferenceSchema,
} from "@/lib/validation/schemas";

export async function GET() {
  const session = await requireSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectToDatabase();

  const preference = await NotificationPreference.findOne({ uid: session.uid });

  return NextResponse.json({
    preference: preference ?? { email: true, push: false, sms: false },
  });
}

export async function PUT(request: Request) {
  const session = await requireSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = notificationPreferenceSchema.safeParse(await request.json());
  if (!payload.success) {
    return NextResponse.json(
      { error: getFirstZodError(payload.error) },
      { status: 400 },
    );
  }

  const { email, push } = payload.data;
  // SMS channel is not delivered yet — always store false.
  const sms = false;

  await connectToDatabase();

  const preference = await NotificationPreference.findOneAndUpdate(
    { uid: session.uid },
    {
      uid: session.uid,
      email,
      push,
      sms,
    },
    { new: true, upsert: true },
  );

  return NextResponse.json({ preference });
}
