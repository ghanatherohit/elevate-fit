import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongoose";
import { NotificationPreference } from "@/lib/models/NotificationPreference";
import { requireSession } from "@/lib/auth/session";

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

  const { email, push, sms } = (await request.json()) as {
    email?: boolean;
    push?: boolean;
    sms?: boolean;
  };

  await connectToDatabase();

  const preference = await NotificationPreference.findOneAndUpdate(
    { uid: session.uid },
    {
      uid: session.uid,
      email: email ?? true,
      push: push ?? false,
      sms: sms ?? false,
    },
    { new: true, upsert: true },
  );

  return NextResponse.json({ preference });
}
