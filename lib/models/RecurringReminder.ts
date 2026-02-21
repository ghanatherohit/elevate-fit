import mongoose, { Schema } from "mongoose";

type RecurringReminderDocument = {
  uid: string;
  title: string;
  frequency: "daily" | "weekly";
  time: string;
  daysOfWeek: number[];
  paused: boolean;
  channels: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  lastScheduledAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

const RecurringReminderSchema = new Schema<RecurringReminderDocument>(
  {
    uid: { type: String, required: true },
    title: { type: String, required: true },
    frequency: { type: String, required: true },
    time: { type: String, required: true },
    daysOfWeek: { type: [Number], default: [] },
    paused: { type: Boolean, default: false },
    channels: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: false },
      sms: { type: Boolean, default: false },
    },
    lastScheduledAt: { type: Date, default: null },
  },
  { timestamps: true },
);

export const RecurringReminder =
  mongoose.models.RecurringReminder ||
  mongoose.model<RecurringReminderDocument>(
    "RecurringReminder",
    RecurringReminderSchema,
  );
