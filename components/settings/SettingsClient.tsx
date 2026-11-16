"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import GlassCard from "@/components/shared/GlassCard";
import {
  DataList,
  DataRow,
  OpenHint,
} from "@/components/shared/DataSurfaces";
import DisabledWithHint, {
  getBlockReasons,
} from "@/components/shared/FormBlockHint";
import SectionHeader from "@/components/shared/SectionHeader";
import StylePicker from "@/components/settings/StylePicker";
import { logoutClient } from "@/lib/auth/logout-client";
import {
  USER_ERRORS,
  userMessageFromResponse,
} from "@/lib/errors/user-facing";

type Preference = {
  email: boolean;
  push: boolean;
  sms: boolean;
};

const defaultPreference: Preference = {
  email: true,
  push: false,
  sms: false,
};

const container = {
  hidden: { opacity: 0, y: 8 },
  show: {
    opacity: 1,
    y: 0,
    transition: { staggerChildren: 0.05 },
  },
};

const item = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25 } },
};

export default function SettingsClient() {
  const router = useRouter();
  const notificationsPanelId = useId();
  const saveSeq = useRef(0);
  const [preference, setPreference] = useState<Preference>(defaultPreference);
  const [prefsReady, setPrefsReady] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [pushReady] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }
    return "serviceWorker" in navigator && "PushManager" in window;
  });
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";
  const normalizedPublicKey = publicKey.trim();
  const isPlaceholderKey =
    !normalizedPublicKey ||
    normalizedPublicKey.includes("your_public_vapid_key_here");
  const isLikelyVapidKey =
    /^[A-Za-z0-9\-_]+$/.test(normalizedPublicKey) &&
    normalizedPublicKey.length >= 80;
  const pushConfigured = !isPlaceholderKey && isLikelyVapidKey;

  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const response = await fetch("/api/notifications/preferences");
        if (!response.ok) {
          setStatus("Could not load preferences");
          return;
        }
        const data = (await response.json()) as { preference: Preference };
        setPreference(data.preference);
        setPrefsReady(true);
      } catch {
        setStatus("Could not load preferences");
      }
    };
    void loadPreferences();
  }, []);

  useEffect(() => {
    if (!status) {
      return;
    }
    const timer = window.setTimeout(() => setStatus(null), 3200);
    return () => window.clearTimeout(timer);
  }, [status]);

  const urlBase64ToUint8Array = (value: string) => {
    const padding = "=".repeat((4 - (value.length % 4)) % 4);
    const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
    const rawData = atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; i += 1) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const savePreferences = async (nextPreference: Preference) => {
    const seq = ++saveSeq.current;
    const response = await fetch("/api/notifications/preferences", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(nextPreference),
    });
    if (seq !== saveSeq.current) {
      return "stale" as const;
    }
    if (!response.ok) {
      setStatus("Could not save preferences");
      return false;
    }
    return true;
  };

  const subscribePush = async (): Promise<boolean> => {
    if (!pushConfigured) {
      setStatus(USER_ERRORS.pushUnavailable);
      return false;
    }
    if (!pushReady) {
      setStatus(USER_ERRORS.pushUnsupported);
      return false;
    }

    try {
      const registration = await navigator.serviceWorker.register("/sw.js");
      const pushManager = (
        registration as ServiceWorkerRegistration & {
          pushManager?: PushManager;
        }
      ).pushManager;

      if (!pushManager) {
        setStatus(USER_ERRORS.pushUnsupported);
        return false;
      }

      const subscription = await pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(normalizedPublicKey),
      });

      const response = await fetch("/api/notifications/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subscription),
      });

      if (!response.ok) {
        setStatus("Could not save push subscription");
        return false;
      }

      return true;
    } catch (error) {
      if (error instanceof DOMException && error.name === "InvalidAccessError") {
        setStatus(USER_ERRORS.pushUnavailable);
        return false;
      }
      setStatus(USER_ERRORS.pushUnavailable);
      return false;
    }
  };

  const handleToggle = async (key: "email" | "push") => {
    if (!prefsReady) {
      setStatus("Preferences still loading");
      return;
    }

    const previous = preference;
    const enabling = !preference[key];

    if (key === "push" && enabling) {
      const subscribed = await subscribePush();
      if (!subscribed) {
        return;
      }
      const nextPreference = { ...preference, push: true };
      setPreference(nextPreference);
      const ok = await savePreferences(nextPreference);
      if (ok === false) {
        setPreference(previous);
        return;
      }
      if (ok === true) {
        setStatus("Push notifications enabled");
      }
      return;
    }

    const nextPreference = { ...preference, [key]: enabling };
    setPreference(nextPreference);
    const ok = await savePreferences(nextPreference);
    if (ok === false) {
      setPreference(previous);
      return;
    }
    if (ok === true) {
      setStatus("Preferences updated");
    }
  };

  const handleSubscribePush = async () => {
    if (!prefsReady) {
      setStatus("Preferences still loading");
      return;
    }
    const previous = preference;
    const subscribed = await subscribePush();
    if (!subscribed) {
      return;
    }
    if (!preference.push) {
      const nextPreference = { ...preference, push: true };
      setPreference(nextPreference);
      const ok = await savePreferences(nextPreference);
      if (ok === false) {
        setPreference(previous);
        return;
      }
    }
    setStatus("Push notifications enabled");
  };

  const handleTestNotification = async () => {
    if (!prefsReady) {
      setStatus("Preferences still loading");
      return;
    }

    const channels: Array<"email" | "push"> = [];
    if (preference.email) {
      channels.push("email");
    }
    if (preference.push) {
      channels.push("push");
    }
    if (!channels.length) {
      setStatus("Enable a notification channel first");
      return;
    }

    const mode =
      channels.length === 2 ? "both" : channels[0] === "email" ? "email" : "push";

    setStatus("Sending test…");
    const response = await fetch(`/api/notifications/test?mode=${mode}`, {
      method: "POST",
    });
    setStatus(
      response.ok
        ? "Test notification sent"
        : await userMessageFromResponse(response, USER_ERRORS.testFailed),
    );
  };

  const handleLogout = async () => {
    const ok = await logoutClient();
    if (!ok) {
      setStatus("Logout failed. Try again.");
      return;
    }
    router.push("/welcome");
  };

  const channelsLabel =
    [preference.email ? "Email" : null, preference.push ? "Push" : null]
      .filter(Boolean)
      .join(" · ") || "Off";

  return (
    <motion.div
      className="grid gap-3"
      variants={container}
      initial="hidden"
      animate="show"
    >
      <motion.div variants={item}>
        <SectionHeader title="Settings" />
      </motion.div>

      {status ? (
        <motion.div variants={item}>
          <div className="type-meta px-1" role="status" aria-live="polite">
            {status}
          </div>
        </motion.div>
      ) : null}

      <motion.div variants={item}>
        <GlassCard className="overflow-hidden p-0">
          <DataList>
            <Link href="/profile" className="openable mx-1 block rounded-xl">
              <DataRow>
                <div className="min-w-0">
                  <div className="type-heading">Profile</div>
                  <div className="type-meta">Account</div>
                </div>
                <OpenHint kind="open" />
              </DataRow>
            </Link>

            <div className="mx-1 px-2 py-2">
              <div className="type-meta mb-1.5 px-1">Theme</div>
              <StylePicker compact />
            </div>

            <div className="mx-1 px-2 py-1.5">
              <button
                type="button"
                className="openable flex w-full items-center justify-between gap-3 rounded-xl px-2 py-2 text-left"
                aria-expanded={notificationsOpen}
                aria-controls={
                  notificationsOpen ? notificationsPanelId : undefined
                }
                onClick={() => setNotificationsOpen((value) => !value)}
              >
                <span className="min-w-0">
                  <span className="type-heading block">Notifications</span>
                  <span className="type-meta mt-0.5 block">{channelsLabel}</span>
                </span>
                <OpenHint kind="expand" />
              </button>

              {notificationsOpen ? (
                <div
                  id={notificationsPanelId}
                  className="mt-1 grid gap-0.5 px-1 pb-1"
                >
                  {(
                    [
                      ["Email", "email"],
                      ["Push", "push"],
                    ] as const
                  ).map(([label, key]) => (
                    <label
                      key={key}
                      className="flex items-center justify-between gap-3 py-2"
                    >
                      <span className="type-body">{label}</span>
                      <input
                        type="checkbox"
                        checked={preference[key]}
                        disabled={!prefsReady}
                        onChange={() => {
                          void handleToggle(key);
                        }}
                        className="h-4 w-4 accent-accent disabled:opacity-50"
                        aria-label={`Enable ${label} notifications`}
                      />
                    </label>
                  ))}

                  <div className="grid gap-2 pt-1">
                    {(() => {
                      const pushBlockReasons = getBlockReasons([
                        {
                          ok: prefsReady,
                          reason: "Preferences are still loading",
                        },
                        {
                          ok: pushReady,
                          reason: USER_ERRORS.pushUnsupported,
                        },
                        {
                          ok: pushConfigured,
                          reason: USER_ERRORS.pushUnavailable,
                        },
                      ]);
                      const testBlockReasons = getBlockReasons([
                        {
                          ok: prefsReady,
                          reason: "Preferences are still loading",
                        },
                      ]);
                      const canEnablePush = pushBlockReasons.length === 0;
                      const canTest = testBlockReasons.length === 0;
                      return (
                        <div className="flex flex-wrap gap-1.5">
                          <DisabledWithHint
                            disabled={!canEnablePush}
                            reasons={pushBlockReasons}
                            className="inline-flex"
                          >
                            <button
                              type="button"
                              className="soft-chip type-meta disabled:opacity-50"
                              onClick={() => {
                                void handleSubscribePush();
                              }}
                              disabled={!canEnablePush}
                            >
                              Enable push
                            </button>
                          </DisabledWithHint>
                          <DisabledWithHint
                            disabled={!canTest}
                            reasons={testBlockReasons}
                            className="inline-flex"
                          >
                            <button
                              type="button"
                              className="soft-chip type-meta disabled:opacity-50"
                              disabled={!canTest}
                              onClick={() => {
                                void handleTestNotification();
                              }}
                            >
                              Test
                            </button>
                          </DisabledWithHint>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              ) : null}
            </div>

            <button
              type="button"
              className="data-row openable mx-1 w-[calc(100%-0.5rem)] text-left"
              onClick={() => {
                void handleLogout();
              }}
            >
              <div className="type-heading text-accent">Logout</div>
            </button>
          </DataList>
        </GlassCard>
      </motion.div>
    </motion.div>
  );
}
