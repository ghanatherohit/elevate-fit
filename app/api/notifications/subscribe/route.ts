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
import { NotificationSubscription } from "@/lib/models/NotificationSubscription";
import {
  getFirstZodError,
  pushSubscriptionSchema,
} from "@/lib/validation/schemas";

export async function POST(request: Request) {
  return withApiHandler("[notifications/subscribe]", async () => {
  
    const session = await requireSession();
    if (!session) {
      return apiUnauthorized();
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

  });
}
