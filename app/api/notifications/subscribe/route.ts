import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongoose";
import { requireSession } from "@/lib/auth/session";
import { NotificationSubscription } from "@/lib/models/NotificationSubscription";
import {
  getFirstZodError,
  pushSubscriptionSchema,
} from "@/lib/validation/schemas";

export async function POST(request: Request) {
  const session = await requireSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = pushSubscriptionSchema.safeParse(await request.json());
  if (!payload.success) {
    return NextResponse.json(
      { error: getFirstZodError(payload.error) },
      { status: 400 },
    );
  }

  const subscription = payload.data;

  await connectToDatabase();

  await NotificationSubscription.findOneAndUpdate(
    { uid: session.uid, endpoint: subscription.endpoint },
    {
      uid: session.uid,
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
    },
    { new: true, upsert: true },
  );

  return NextResponse.json({ ok: true });
}
