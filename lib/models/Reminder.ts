import mongoose, { Schema } from "mongoose";

type ReminderDocument = {
  uid: string;
  title: string;
  scheduledFor: Date;
  channels: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  status: "pending" | "sent" | "failed";
  createdAt: Date;
  updatedAt: Date;
};

const ReminderSchema = new Schema<ReminderDocument>(
  {
    uid: { type: String, required: true },
    title: { type: String, required: true },
    scheduledFor: { type: Date, required: true },
    channels: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: false },
      sms: { type: Boolean, default: false },
    },
    status: { type: String, default: "pending" },
  },
  { timestamps: true },
);

export const Reminder =
  mongoose.models.Reminder || mongoose.model<ReminderDocument>("Reminder", ReminderSchema);
