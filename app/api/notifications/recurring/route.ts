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
import { requireSession } from "@/lib/auth/session";
import { RecurringReminder } from "@/lib/models/RecurringReminder";
import {
  getFirstZodError,
  recurringReminderCreateSchema,
  recurringReminderUpdateSchema,
} from "@/lib/validation/schemas";

export async function GET() {
  return withApiHandler("[notifications/recurring]", async () => {
  
    const session = await requireSession();
    if (!session) {
      return apiUnauthorized();
    }
  
    await connectToDatabase();
  
    const recurring = await RecurringReminder.find({ uid: session.uid }).sort({
      createdAt: -1,
    });
  
    return NextResponse.json({ recurring });

  });
}

export async function POST(request: Request) {
  return withApiHandler("[notifications/recurring]", async () => {
  
    const session = await requireSession();
    if (!session) {
      return apiUnauthorized();
    }
  
    const payload = recurringReminderCreateSchema.safeParse(await request.json());
    if (!payload.success) {
      return NextResponse.json(
        { error: getFirstZodError(payload.error) },
        { status: 400 },
      );
    }
  
    const { title, frequency, time, daysOfWeek, channels } = payload.data;
  
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
        sms: false,
      },
    });
  
    return NextResponse.json({ recurring });

  });
}

export async function PATCH(request: Request) {
  return withApiHandler("[notifications/recurring]", async () => {
  
    const session = await requireSession();
    if (!session) {
      return apiUnauthorized();
    }
  
    const payload = recurringReminderUpdateSchema.safeParse(await request.json());
    if (!payload.success) {
      return NextResponse.json(
        { error: getFirstZodError(payload.error) },
        { status: 400 },
      );
    }
  
    const { id, title, frequency, time, daysOfWeek, channels, paused } =
      payload.data;
  
    await connectToDatabase();
  
    const recurring = await RecurringReminder.findOneAndUpdate(
      { _id: id, uid: session.uid },
      {
        ...(title !== undefined ? { title } : {}),
        ...(frequency !== undefined ? { frequency } : {}),
        ...(time !== undefined ? { time } : {}),
        ...(paused !== undefined ? { paused } : {}),
        ...(Array.isArray(daysOfWeek) ? { daysOfWeek } : {}),
        ...(channels
          ? {
              channels: {
                email: channels.email ?? true,
                push: channels.push ?? false,
                sms: false,
              },
            }
          : {}),
      },
      { new: true },
    );
  
    if (!recurring) {
      return apiNotFound();
    }
  
    return NextResponse.json({ recurring });

  });
}

export async function DELETE(request: Request) {
  return withApiHandler("[notifications/recurring]", async () => {
  
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
  
    const result = await RecurringReminder.deleteOne({
      _id: id,
      uid: session.uid,
    });
  
    if (result.deletedCount === 0) {
      return apiNotFound();
    }
  
    return NextResponse.json({ ok: true });

  });
}
