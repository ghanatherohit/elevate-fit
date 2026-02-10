"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import GlassCard from "@/components/GlassCard";
import SectionHeader from "@/components/SectionHeader";
import ThemeToggle from "@/components/ThemeToggle";

type Preference = {
  email: boolean;
  push: boolean;
  sms: boolean;
};

const container = {
  hidden: { opacity: 0, y: 8 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45 } },
};

export default function SettingsClient() {
  const router = useRouter();
  const [preference, setPreference] = useState<Preference>({
    email: true,
    push: false,
    sms: false,
  });
  const [status, setStatus] = useState<string | null>(null);
  const [pushReady, setPushReady] = useState(false);
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";

  useEffect(() => {
    const loadPreferences = async () => {
      const response = await fetch("/api/notifications/preferences");
      if (!response.ok) {
        return;
      }
      const data = (await response.json()) as { preference: Preference };
      setPreference(data.preference);
    };
    loadPreferences();
    setPushReady("serviceWorker" in navigator && "PushManager" in window);
  }, []);

  const urlBase64ToUint8Array = (value: string) => {
    const padding = "=".repeat((4 - (value.length % 4)) % 4);
    const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
    const rawData = atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const savePreferences = async (nextPreference: Preference) => {
    const response = await fetch("/api/notifications/preferences", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(nextPreference),
    });
    if (!response.ok) {
      setStatus("Failed to save preferences");
      return false;
    }
    return true;
  };

  const handleToggle = async (key: keyof Preference) => {
    const nextPreference = { ...preference, [key]: !preference[key] };
    setPreference(nextPreference);
    const ok = await savePreferences(nextPreference);
    if (ok) {
      setStatus("Preferences updated");
    }
  };

  const handleSubscribePush = async () => {
    if (!publicKey) {
      setStatus("Missing VAPID public key");
      return;
    }
    const registration = await navigator.serviceWorker.register("/sw.js");
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });

    const response = await fetch("/api/notifications/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(subscription),
    });

    if (!response.ok) {
      setStatus("Failed to save push subscription");
      return;
    }

    setStatus("Push notifications enabled");
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/welcome");
  };

  return (
    <motion.div
      className="grid gap-5"
      variants={container}
      initial="hidden"
      animate="show"
    >
      <motion.div variants={item}>
        <SectionHeader title="Settings" action="Account" />
      </motion.div>

      <motion.div variants={item}>
        <div className="grid gap-4 sm:grid-cols-2">
          <GlassCard className="grid gap-3">
            <div className="text-xs text-[color:var(--muted)]">Personal</div>
            <Link
              href="/profile"
              className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] px-4 py-3 text-left text-sm text-[color:var(--text)] transition hover:-translate-y-0.5 hover:border-[color:var(--accent)]/40"
            >
              Profile
            </Link>
            <Link
              href="/health-plan"
              className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] px-4 py-3 text-left text-sm text-[color:var(--text)] transition hover:-translate-y-0.5 hover:border-[color:var(--accent)]/40"
            >
              Health plan
            </Link>
          </GlassCard>

          <GlassCard className="grid gap-3">
            <div className="text-xs text-[color:var(--muted)]">Appearance</div>
            <ThemeToggle />
          </GlassCard>
        </div>
      </motion.div>

      <motion.div variants={item}>
        <GlassCard className="grid gap-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-[color:var(--text)]">
                Notification channels
              </div>
              <div className="text-xs text-[color:var(--muted)]">
                Control how reminders reach you.
              </div>
            </div>
            <button
              className="rounded-full border border-[color:var(--border)] px-3 py-1 text-[10px] text-[color:var(--muted)]"
              onClick={handleSubscribePush}
              disabled={!pushReady}
            >
              {pushReady ? "Enable push" : "Push not supported"}
            </button>
          </div>

          <div className="grid gap-2">
            {(
              [
                ["Email", "email"],
                ["Push", "push"],
                ["SMS", "sms"],
              ] as const
            ).map(([label, key]) => (
              <label
                key={key}
                className="flex items-center justify-between rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] px-4 py-3 text-sm"
              >
                <span className="text-[color:var(--text)]">{label}</span>
                <input
                  type="checkbox"
                  checked={preference[key]}
                  onChange={() => handleToggle(key)}
                  className="h-5 w-5 accent-[color:var(--accent)]"
                />
              </label>
            ))}
          </div>

          {status ? (
            <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] px-4 py-2 text-xs text-[color:var(--muted)]">
              {status}
            </div>
          ) : null}
        </GlassCard>
      </motion.div>

      <motion.div variants={item}>
        <GlassCard className="grid gap-3">
          <div className="text-xs text-[color:var(--muted)]">Account</div>
          <button
            className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] px-4 py-3 text-left text-sm text-[color:var(--muted)]"
            onClick={handleLogout}
          >
            Log out
          </button>
        </GlassCard>
      </motion.div>

    </motion.div>
  );
}
