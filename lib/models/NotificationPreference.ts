import mongoose, { Schema } from "mongoose";

type NotificationPreferenceDocument = {
  uid: string;
  email: boolean;
  push: boolean;
  sms: boolean;
  lastTestAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

const NotificationPreferenceSchema = new Schema<NotificationPreferenceDocument>(
  {
    uid: { type: String, required: true, unique: true },
    email: { type: Boolean, default: true },
    push: { type: Boolean, default: false },
    sms: { type: Boolean, default: false },
    lastTestAt: { type: Date, default: null },
  },
  { timestamps: true },
);

export const NotificationPreference =
  mongoose.models.NotificationPreference ||
  mongoose.model<NotificationPreferenceDocument>(
    "NotificationPreference",
    NotificationPreferenceSchema,
  );
