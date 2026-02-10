import mongoose, { Schema } from "mongoose";

type NotificationSubscriptionDocument = {
  uid: string;
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  createdAt: Date;
  updatedAt: Date;
};

const NotificationSubscriptionSchema = new Schema<NotificationSubscriptionDocument>(
  {
    uid: { type: String, required: true },
    endpoint: { type: String, required: true },
    keys: {
      p256dh: { type: String, required: true },
      auth: { type: String, required: true },
    },
  },
  { timestamps: true },
);

NotificationSubscriptionSchema.index({ uid: 1, endpoint: 1 }, { unique: true });

export const NotificationSubscription =
  mongoose.models.NotificationSubscription ||
  mongoose.model<NotificationSubscriptionDocument>(
    "NotificationSubscription",
    NotificationSubscriptionSchema,
  );
