import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongoose";
import { Reminder } from "@/lib/models/Reminder";
import { NotificationPreference } from "@/lib/models/NotificationPreference";
import { NotificationSubscription } from "@/lib/models/NotificationSubscription";
import { User } from "@/lib/models/User";
import { RecurringReminder } from "@/lib/models/RecurringReminder";
import { sendEmail } from "@/lib/notifications/email";
import { sendPush } from "@/lib/notifications/push";

export async function GET() {
  await connectToDatabase();

  const now = new Date();
  const todayKey = now.toDateString();
  const todayDay = now.getDay();

  const recurringItems = await RecurringReminder.find({});

  for (const recurring of recurringItems) {
    if (recurring.paused) {
      continue;
    }
    const shouldRunDaily = recurring.frequency === "daily";
    const shouldRunWeekly =
      recurring.frequency === "weekly" &&
      recurring.daysOfWeek.includes(todayDay);

    if (!shouldRunDaily && !shouldRunWeekly) {
      continue;
    }

    const [hours, minutes] = recurring.time.split(":").map(Number);
    const scheduledFor = new Date(now);
    scheduledFor.setHours(hours || 0, minutes || 0, 0, 0);

    if (scheduledFor > now) {
      continue;
    }

    const lastKey = recurring.lastScheduledAt
      ? new Date(recurring.lastScheduledAt).toDateString()
      : null;
    if (lastKey === todayKey) {
      continue;
    }

    await Reminder.create({
      uid: recurring.uid,
      title: recurring.title,
      scheduledFor,
      channels: recurring.channels,
    });

    recurring.lastScheduledAt = scheduledFor;
    await recurring.save();
  }

  const due = await Reminder.find({
    status: "pending",
    scheduledFor: { $lte: now },
  }).limit(50);

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
      sms: reminder.channels.sms && (preference?.sms ?? false),
    };

    try {
      if (channels.email && user?.email) {
        await sendEmail({
          to: user.email,
          subject: `ElevateFit reminder: ${reminder.title}`,
          html: `<p>${reminder.title}</p><p>Scheduled for ${reminder.scheduledFor.toLocaleString()}.</p>`,
        });
      }

      if (channels.push && subscriptions.length) {
        await Promise.all(
          subscriptions.map((sub) =>
            sendPush(sub, { title: "ElevateFit", body: reminder.title }),
          ),
        );
      }

      if (channels.sms) {
        // SMS delivery requires a paid provider. Add when credentials are available.
      }

      reminder.status = "sent";
      await reminder.save();
    } catch {
      reminder.status = "failed";
      await reminder.save();
    }
  }

  return NextResponse.json({ processed: due.length });
}
