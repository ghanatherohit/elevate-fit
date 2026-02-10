"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardShell from "@/components/DashboardShell";
import GlassCard from "@/components/GlassCard";
import SectionHeader from "@/components/SectionHeader";
import { registerWithEmail } from "@/lib/auth/client";
import {
  getUsernameHint,
  isUsernameValid,
  normalizeUsername,
} from "@/lib/validation/username";

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      const response = await fetch("/api/auth/me");
      const data = (await response.json()) as { user: unknown | null };
      if (data.user) {
        router.replace("/");
        return;
      }
      setChecking(false);
    };
    checkSession();
  }, [router]);

  const handleRegister = async () => {
    setError(null);
    setLoading(true);
    try {
      const normalized = normalizeUsername(username);
      if (!normalized) {
        throw new Error("Username is required");
      }
      if (!isUsernameValid(normalized)) {
        throw new Error(getUsernameHint());
      }

      const user = await registerWithEmail(email, password, normalized);
      const idToken = await user.getIdToken();
      const session = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken, username: normalized }),
      });

      if (!session.ok) {
        const body = (await session.json()) as { error?: string };
        throw new Error(body.error || "Session failed");
      }

      router.push("/profile");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign up failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardShell>
      <SectionHeader title="Create account" action="Start now" />
      <GlassCard className="grid gap-4">
        {checking ? (
          <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] px-4 py-3 text-xs text-[color:var(--muted)]">
            Checking session...
          </div>
        ) : null}
        <div className="grid gap-2">
          <label className="text-xs text-[color:var(--muted)]">Username</label>
          <input
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] px-4 py-3 text-sm text-[color:var(--text)]"
          />
          <div className="text-[10px] text-[color:var(--muted)]">
            {getUsernameHint()}
          </div>
        </div>
        <div className="grid gap-2">
          <label className="text-xs text-[color:var(--muted)]">Email</label>
          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] px-4 py-3 text-sm text-[color:var(--text)]"
          />
        </div>
        <div className="grid gap-2">
          <label className="text-xs text-[color:var(--muted)]">Password</label>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] px-4 py-3 text-sm text-[color:var(--text)]"
          />
        </div>
        {error ? (
          <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] px-4 py-2 text-xs text-[color:var(--accent)]">
            {error}
          </div>
        ) : null}
        <button
          className="rounded-2xl bg-[color:var(--accent)]/15 px-4 py-3 text-sm font-semibold text-[color:var(--accent)]"
          onClick={handleRegister}
          disabled={loading || checking}
        >
          {loading ? "Creating..." : "Create account"}
        </button>
        <button
          className="text-xs text-[color:var(--muted)]"
          onClick={() => router.push("/auth/login")}
        >
          Already have an account? Sign in
        </button>
      </GlassCard>
    </DashboardShell>
  );
}
