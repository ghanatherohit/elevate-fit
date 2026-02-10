import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongoose";
import { requireSession } from "@/lib/auth/session";
import { User } from "@/lib/models/User";
import { NotificationPreference } from "@/lib/models/NotificationPreference";
import { NotificationSubscription } from "@/lib/models/NotificationSubscription";
import { sendEmail } from "@/lib/notifications/email";
import { sendPush } from "@/lib/notifications/push";

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("mode") || "both";
  const wantsEmail = mode === "email" || mode === "both";
  const wantsPush = mode === "push" || mode === "both";

  if (!wantsEmail && !wantsPush) {
    return NextResponse.json({ error: "Invalid test mode" }, { status: 400 });
  }
  const session = await requireSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectToDatabase();

  const [user, preference, subscriptions] = await Promise.all([
    User.findOne({ uid: session.uid }),
    NotificationPreference.findOne({ uid: session.uid }),
    NotificationSubscription.find({ uid: session.uid }),
  ]);

  const now = Date.now();
  const lastTest = preference?.lastTestAt?.getTime() ?? 0;
  if (now - lastTest < 60 * 1000) {
    return NextResponse.json(
      { error: "Test limited to once per minute" },
      { status: 429 },
    );
  }

  try {
    if (wantsEmail && !user?.email) {
      return NextResponse.json(
        { error: "No email found for this account" },
        { status: 400 },
      );
    }

    if (wantsPush && !subscriptions.length) {
      return NextResponse.json(
        { error: "No push subscription found" },
        { status: 400 },
      );
    }

    const tasks: Promise<unknown>[] = [];

    if (wantsEmail && user?.email) {
      tasks.push(
        sendEmail({
          to: user.email,
          subject: "ElevateFit test notification",
          html: "<p>This is a test notification.</p>",
        }),
      );
    }

    if (wantsPush) {
      tasks.push(
        ...subscriptions.map((sub) =>
          sendPush(sub, {
            title: "ElevateFit",
            body: "This is a test notification.",
          }),
        ),
      );
    }

    await Promise.all(tasks);

    await NotificationPreference.findOneAndUpdate(
      { uid: session.uid },
      { uid: session.uid, lastTestAt: new Date() },
      { new: true, upsert: true },
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Delivery failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
