import webpush from "web-push";

type PushPayload = {
  title: string;
  body: string;
};

const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const privateKey = process.env.VAPID_PRIVATE_KEY;
const subject = process.env.VAPID_SUBJECT;

if (!publicKey || !privateKey || !subject) {
  throw new Error("Missing VAPID keys or subject");
}

webpush.setVapidDetails(subject, publicKey, privateKey);

export async function sendPush(subscription: webpush.PushSubscription, payload: PushPayload) {
  return webpush.sendNotification(subscription, JSON.stringify(payload));
}
