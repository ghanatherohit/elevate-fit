import { NextResponse } from "next/server";
import {
  apiError,
  apiNotFound,
  apiUnauthorized,
  apiUnavailable,
  withApiHandler,
} from "@/lib/api/response";
import { USER_ERRORS } from "@/lib/errors/user-facing";
import { connectToDatabase } from "@/lib/db/mongoose";
import { Reminder } from "@/lib/models/Reminder";
import { requireSession } from "@/lib/auth/session";
import {
  getFirstZodError,
  reminderCreateSchema,
  reminderUpdateSchema,
} from "@/lib/validation/schemas";

export async function GET() {
  return withApiHandler("[notifications/reminders]", async () => {
  
    const session = await requireSession();
    if (!session) {
      return apiUnauthorized();
    }
  
    await connectToDatabase();
  
    const reminders = await Reminder.find({ uid: session.uid })
      .sort({ scheduledFor: 1 })
      .limit(20);
  
    return NextResponse.json({ reminders });

  });
}

export async function POST(request: Request) {
  return withApiHandler("[notifications/reminders]", async () => {
  
    const session = await requireSession();
    if (!session) {
      return apiUnauthorized();
    }
  
    const payload = reminderCreateSchema.safeParse(await request.json());
    if (!payload.success) {
      return NextResponse.json(
        { error: getFirstZodError(payload.error) },
        { status: 400 },
      );
    }
  
    const { title, scheduledFor, channels } = payload.data;
  
    await connectToDatabase();
  
    const reminder = await Reminder.create({
      uid: session.uid,
      title,
      scheduledFor: new Date(scheduledFor),
      channels: {
        email: channels?.email ?? true,
        push: channels?.push ?? false,
        sms: false,
      },
    });
  
    return NextResponse.json({ reminder });

  });
}

export async function PATCH(request: Request) {
  return withApiHandler("[notifications/reminders]", async () => {
  
    const session = await requireSession();
    if (!session) {
      return apiUnauthorized();
    }
  
    const payload = reminderUpdateSchema.safeParse(await request.json());
    if (!payload.success) {
      return NextResponse.json(
        { error: getFirstZodError(payload.error) },
        { status: 400 },
      );
    }
  
    const { id, title, scheduledFor } = payload.data;
  
    await connectToDatabase();
  
    const reminder = await Reminder.findOneAndUpdate(
      { _id: id, uid: session.uid },
      {
        ...(title !== undefined ? { title } : {}),
        ...(scheduledFor !== undefined
          ? { scheduledFor: new Date(scheduledFor), status: "pending" }
          : {}),
      },
      { new: true },
    );
  
    if (!reminder) {
      return apiNotFound();
    }
  
    return NextResponse.json({ reminder });

  });
}

export async function DELETE(request: Request) {
  return withApiHandler("[notifications/reminders]", async () => {
  
    const session = await requireSession();
    if (!session) {
      return apiUnauthorized();
    }
  
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
  
    if (!id) {
      return apiError(USER_ERRORS.invalidPayload, 400);
    }
  
    await connectToDatabase();
  
    const result = await Reminder.deleteOne({ _id: id, uid: session.uid });
  
    if (result.deletedCount === 0) {
      return apiNotFound();
    }
  
    return NextResponse.json({ ok: true });

  });
}
