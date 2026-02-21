import webpush from "web-push";

type PushPayload = {
  title: string;
  body: string;
};

let vapidConfigured = false;

const ensureVapidConfigured = () => {
  if (vapidConfigured) {
    return;
  }

  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;

  if (!publicKey || !privateKey || !subject) {
    throw new Error("Missing VAPID keys or subject");
  }

  webpush.setVapidDetails(subject, publicKey, privateKey);
  vapidConfigured = true;
};

export async function sendPush(subscription: webpush.PushSubscription, payload: PushPayload) {
  ensureVapidConfigured();
  return webpush.sendNotification(subscription, JSON.stringify(payload));
}
