"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardShell from "@/components/DashboardShell";
import GlassCard from "@/components/GlassCard";
import SectionHeader from "@/components/SectionHeader";
import {
  loginWithEmail,
  loginWithGoogle,
  requestPasswordReset,
} from "@/lib/auth/client";

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
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

  const handleEmailLogin = async () => {
    setError(null);
    setMessage(null);
    setLoading(true);
    try {
      let email = identifier.trim();
      if (!email.includes("@")) {
        const response = await fetch("/api/auth/resolve", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ identifier: email }),
        });
        if (!response.ok) {
          throw new Error("Username not found");
        }
        const data = (await response.json()) as { email: string };
        email = data.email;
      }

      const user = await loginWithEmail(email, password);
      const idToken = await user.getIdToken();
      const session = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });

      if (!session.ok) {
        throw new Error("Session failed");
      }

      router.push("/profile");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setMessage(null);
    setLoading(true);
    try {
      const user = await loginWithGoogle();
      const idToken = await user.getIdToken();
      const session = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });
      if (!session.ok) {
        throw new Error("Session failed");
      }
      router.push("/profile");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    setError(null);
    setMessage(null);
    if (!identifier.trim()) {
      setError("Enter your email first.");
      return;
    }
    try {
      let email = identifier.trim();
      if (!email.includes("@")) {
        const response = await fetch("/api/auth/resolve", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ identifier: email }),
        });
        if (!response.ok) {
          throw new Error("Username not found");
        }
        const data = (await response.json()) as { email: string };
        email = data.email;
      }
      await requestPasswordReset(email);
      setMessage("Password reset email sent.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Reset failed");
    }
  };

  return (
    <DashboardShell>
      <SectionHeader title="Login" action="Welcome back" />
      <GlassCard className="grid gap-4">
        {checking ? (
          <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] px-4 py-3 text-xs text-[color:var(--muted)]">
            Checking session...
          </div>
        ) : null}
        <div className="grid gap-2">
          <label className="text-xs text-[color:var(--muted)]">
            Username or email
          </label>
          <input
            value={identifier}
            onChange={(event) => setIdentifier(event.target.value)}
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
        {message ? (
          <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] px-4 py-2 text-xs text-[color:var(--muted)]">
            {message}
          </div>
        ) : null}
        <button
          className="rounded-2xl bg-[color:var(--accent)]/15 px-4 py-3 text-sm font-semibold text-[color:var(--accent)]"
          onClick={handleEmailLogin}
          disabled={loading || checking}
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>
        <button
          className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] px-4 py-3 text-sm text-[color:var(--text)]"
          onClick={handleGoogleLogin}
          disabled={loading || checking}
        >
          Continue with Google
        </button>
        <button
          className="text-xs text-[color:var(--muted)]"
          onClick={handleResetPassword}
        >
          Forgot password?
        </button>
        <button
          className="text-xs text-[color:var(--muted)]"
          onClick={() => router.push("/auth/register")}
        >
          Create an account
        </button>
      </GlassCard>
    </DashboardShell>
  );
}
