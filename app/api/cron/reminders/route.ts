import { NextResponse } from "next/server";
import { apiUnauthorized, withApiHandler } from "@/lib/api/response";
import { connectToDatabase } from "@/lib/db/mongoose";
import { Reminder } from "@/lib/models/Reminder";
import { NotificationPreference } from "@/lib/models/NotificationPreference";
import { NotificationSubscription } from "@/lib/models/NotificationSubscription";
import { User } from "@/lib/models/User";
import { RecurringReminder } from "@/lib/models/RecurringReminder";
import { sendEmail } from "@/lib/notifications/email";
import { sendPush } from "@/lib/notifications/push";
import {
  getDayNameFromDateKey,
  getIstParts,
  toIstDateKey,
} from "@/lib/datetime/ist";
import { authorizeBearerSecret } from "@/lib/security/timing-safe";
import { escapeHtml } from "@/lib/security/html";

function authorizeCron(request: Request) {
  return authorizeBearerSecret(request, process.env.CRON_SECRET);
}

const weekdayToJsIndex: Record<string, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

/** Build a Date for an IST wall-clock time on the IST calendar day of `now`. */
function scheduledAtIst(now: Date, hours: number, minutes: number) {
  const parts = getIstParts(now);
  const utcMillis =
    Date.UTC(parts.year, parts.month - 1, parts.day, hours, minutes, 0, 0) -
    (5 * 60 + 30) * 60 * 1000;
  return new Date(utcMillis);
}

export async function GET(request: Request) {
  if (!authorizeCron(request)) {
    return apiUnauthorized();
  }

  return withApiHandler("[cron/reminders]", async () => {
  await connectToDatabase();

  const now = new Date();
  const todayKey = toIstDateKey(now);
  const todayDay =
    weekdayToJsIndex[getDayNameFromDateKey(todayKey)] ?? now.getUTCDay();

  const recurringItems = await RecurringReminder.find({
    paused: false,
  }).limit(500);

  for (const recurring of recurringItems) {
    const shouldRunDaily = recurring.frequency === "daily";
    const shouldRunWeekly =
      recurring.frequency === "weekly" &&
      recurring.daysOfWeek.includes(todayDay);

    if (!shouldRunDaily && !shouldRunWeekly) {
      continue;
    }

    const [hours, minutes] = recurring.time.split(":").map(Number);
    const scheduledFor = scheduledAtIst(now, hours || 0, minutes || 0);

    if (scheduledFor > now) {
      continue;
    }

    const lastKey = recurring.lastScheduledAt
      ? toIstDateKey(new Date(recurring.lastScheduledAt))
      : null;
    if (lastKey === todayKey) {
      continue;
    }

    await Reminder.create({
      uid: recurring.uid,
      title: recurring.title,
      scheduledFor,
      channels: {
        email: recurring.channels.email,
        push: recurring.channels.push,
        // SMS channel is not wired — ignore until a provider exists.
        sms: false,
      },
    });

    recurring.lastScheduledAt = scheduledFor;
    await recurring.save();
  }

  const due = await Reminder.find({
    status: "pending",
    scheduledFor: { $lte: now },
  })
    .sort({ scheduledFor: 1 })
    .limit(50);

  if (!due.length) {
    return NextResponse.json({ processed: 0 });
  }

  for (const reminder of due) {
    const [user, preference, subscriptions] = await Promise.all([
      User.findOne({ uid: reminder.uid }),
      NotificationPreference.findOne({ uid: reminder.uid }),
      NotificationSubscription.find({ uid: reminder.uid }),
    ]);

    const channels = {
      email: reminder.channels.email && (preference?.email ?? true),
      push: reminder.channels.push && (preference?.push ?? false),
      sms: false,
    };

    const safeTitle = escapeHtml(reminder.title);

    try {
      if (channels.email && user?.email) {
        await sendEmail({
          to: user.email,
          subject: `ElevateFit reminder: ${reminder.title.slice(0, 80)}`,
          html: `<p>${safeTitle}</p><p>Scheduled for ${escapeHtml(
            reminder.scheduledFor.toLocaleString("en-IN", {
              timeZone: "Asia/Kolkata",
            }),
          )} IST.</p>`,
        });
      }

      if (channels.push && subscriptions.length) {
        await Promise.all(
          subscriptions.map((sub) =>
            sendPush(sub, { title: "ElevateFit", body: reminder.title }),
          ),
        );
      }

      // SMS-only reminders are skipped rather than falsely marked sent.
      if (
        reminder.channels.sms &&
        !channels.email &&
        !channels.push &&
        !reminder.channels.email &&
        !reminder.channels.push
      ) {
        reminder.status = "skipped";
        await reminder.save();
        continue;
      }

      reminder.status = "sent";
      await reminder.save();
    } catch (error) {
      console.error("[cron/reminders]", reminder._id, error);
      reminder.status = "failed";
      await reminder.save();
    }
  }

  return NextResponse.json({ processed: due.length });
  });
}
