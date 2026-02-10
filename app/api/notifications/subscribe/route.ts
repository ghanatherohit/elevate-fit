import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongoose";
import { requireSession } from "@/lib/auth/session";
import { NotificationSubscription } from "@/lib/models/NotificationSubscription";

export async function POST(request: Request) {
  const session = await requireSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const subscription = (await request.json()) as {
    endpoint?: string;
    keys?: { p256dh?: string; auth?: string };
  };

  if (!subscription.endpoint || !subscription.keys?.p256dh || !subscription.keys?.auth) {
    return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });
  }

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
