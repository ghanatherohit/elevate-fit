/* ElevateFit service worker — push notifications only.
 * This is not a full offline PWA. No precache / offline shell is installed.
 * Register only after the user enables push in Settings.
 */

self.addEventListener("push", (event) => {
  let payload = { title: "ElevateFit", body: "You have a reminder." };
  try {
    if (event.data) {
      payload = { ...payload, ...event.data.json() };
    }
  } catch {
    // keep defaults
  }

  event.waitUntil(
    self.registration.showNotification(payload.title || "ElevateFit", {
      body: payload.body || "",
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow("/"));
});
