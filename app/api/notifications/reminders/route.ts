import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongoose";
import { Reminder } from "@/lib/models/Reminder";
import { requireSession } from "@/lib/auth/session";

export async function GET() {
  const session = await requireSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectToDatabase();

  const reminders = await Reminder.find({ uid: session.uid })
    .sort({ scheduledFor: 1 })
    .limit(20);

  return NextResponse.json({ reminders });
}

export async function POST(request: Request) {
  const session = await requireSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { title, scheduledFor, channels } = (await request.json()) as {
    title?: string;
    scheduledFor?: string;
    channels?: { email?: boolean; push?: boolean; sms?: boolean };
  };

  if (!title || !scheduledFor) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  await connectToDatabase();

  const reminder = await Reminder.create({
    uid: session.uid,
    title,
    scheduledFor: new Date(scheduledFor),
    channels: {
      email: channels?.email ?? true,
      push: channels?.push ?? false,
      sms: channels?.sms ?? false,
    },
  });

  return NextResponse.json({ reminder });
}
