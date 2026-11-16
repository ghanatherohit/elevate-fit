import { NextResponse } from "next/server";
import {
  apiError,
  apiNotFound,
  apiUnauthorized,
  apiUnavailable,
} from "@/lib/api/response";
import { USER_ERRORS } from "@/lib/errors/user-facing";
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
    return apiError(USER_ERRORS.invalidPayload, 400);
  }
  const session = await requireSession();
  if (!session) {
    return apiUnauthorized();
  }

  try {
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
        { error: USER_ERRORS.rateLimit },
        { status: 429 },
      );
    }
    // Respect saved channel prefs (email defaults on when unset).
    const emailEnabled = preference?.email !== false;
    const pushEnabled = preference?.push === true;
    const deliverEmail = wantsEmail && emailEnabled;
    const deliverPush = wantsPush && pushEnabled;

    if (!deliverEmail && !deliverPush) {
      return apiError(
        "Turn on email or push notifications before sending a test.",
        400,
      );
    }

    if (deliverEmail && !user?.email) {
      return apiError(
        "Add an email to your account to receive email notifications.",
        400,
      );
    }

    if (deliverPush && !subscriptions.length) {
      return apiError(
        "Enable push on this device before sending a push test.",
        400,
      );
    }

    const tasks: Promise<unknown>[] = [];

    if (deliverEmail && user?.email) {
      tasks.push(
        sendEmail({
          to: user.email,
          subject: "ElevateFit test notification",
          html: "<p>This is a test notification.</p>",
        }),
      );
    }

    if (deliverPush) {
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
    return apiUnavailable("[notifications/test]", error, USER_ERRORS.testFailed);
  }
}
