import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongoose";
import { requireSession } from "@/lib/auth/session";
import { RecurringReminder } from "@/lib/models/RecurringReminder";

export async function GET() {
  const session = await requireSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectToDatabase();

  const recurring = await RecurringReminder.find({ uid: session.uid }).sort({
    createdAt: -1,
  });

  return NextResponse.json({ recurring });
}

export async function POST(request: Request) {
  const session = await requireSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { title, frequency, time, daysOfWeek, channels } =
    (await request.json()) as {
      title?: string;
      frequency?: "daily" | "weekly";
      time?: string;
      daysOfWeek?: number[];
      paused?: boolean;
      channels?: { email?: boolean; push?: boolean; sms?: boolean };
    };

  if (!title || !frequency || !time) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  await connectToDatabase();

  const recurring = await RecurringReminder.create({
    uid: session.uid,
    title,
    frequency,
    time,
    daysOfWeek: Array.isArray(daysOfWeek) ? daysOfWeek : [],
    paused: false,
    channels: {
      email: channels?.email ?? true,
      push: channels?.push ?? false,
      sms: channels?.sms ?? false,
    },
  });

  return NextResponse.json({ recurring });
}

export async function PATCH(request: Request) {
  const session = await requireSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, title, frequency, time, daysOfWeek, channels, paused } =
    (await request.json()) as {
      id?: string;
      title?: string;
      frequency?: "daily" | "weekly";
      time?: string;
      daysOfWeek?: number[];
      paused?: boolean;
      channels?: { email?: boolean; push?: boolean; sms?: boolean };
    };

  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  await connectToDatabase();

  const recurring = await RecurringReminder.findOneAndUpdate(
    { _id: id, uid: session.uid },
    {
      title,
      frequency,
      time,
      paused,
      daysOfWeek: Array.isArray(daysOfWeek) ? daysOfWeek : undefined,
      channels: channels
        ? {
            email: channels.email ?? true,
            push: channels.push ?? false,
            sms: channels.sms ?? false,
          }
        : undefined,
    },
    { new: true },
  );

  if (!recurring) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ recurring });
}

export async function DELETE(request: Request) {
  const session = await requireSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  await connectToDatabase();

  const result = await RecurringReminder.deleteOne({ _id: id, uid: session.uid });

  if (result.deletedCount === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
