"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardShell from "@/components/layout/DashboardShell";
import GlassCard from "@/components/shared/GlassCard";
import SectionHeader from "@/components/shared/SectionHeader";
import { registerWithEmail } from "@/lib/auth/client";
import { getUsernameHint } from "@/lib/validation/username";
import { getFirstZodError, registerInputSchema } from "@/lib/validation/schemas";

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  const safeJson = async <T,>(response: Response): Promise<T | null> => {
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      return null;
    }
    return (await response.json()) as T;
  };

  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch("/api/auth/me");
        const data = await safeJson<{ user: unknown | null }>(response);
        if (data?.user) {
          router.replace("/");
          return;
        }
      } finally {
        setChecking(false);
      }
    };
    checkSession();
  }, [router]);

  const handleRegister = async () => {
    setError(null);
    setLoading(true);
    try {
      const parsed = registerInputSchema.safeParse({ email, password, username });
      if (!parsed.success) {
        throw new Error(getFirstZodError(parsed.error));
      }

      const { username: normalized, email: validEmail, password: validPassword } = parsed.data;

      const user = await registerWithEmail(validEmail, validPassword, normalized);
      const idToken = await user.getIdToken();
      const session = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken, username: normalized }),
      });

      if (!session.ok) {
        const body = await safeJson<{ error?: string }>(session);
        throw new Error(body?.error || "Session failed");
      }

      const dietResponse = await fetch("/api/profile/diet", { cache: "no-store" });
      const dietData = await safeJson<{ onboardingRequired?: boolean }>(dietResponse);
      if (dietResponse.ok && dietData?.onboardingRequired) {
        router.push("/recipes?setup=diet");
        return;
      }

      router.push("/");
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
          <div className="rounded-2xl border border-border bg-card px-4 py-3 text-xs text-muted">
            Checking session...
          </div>
        ) : null}
        <div className="grid gap-2">
          <label className="text-xs text-muted">Username</label>
          <input
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            className="rounded-2xl border border-border bg-card px-4 py-3 text-sm text-foreground"
          />
          <div className="text-[10px] text-muted">
            {getUsernameHint()}
          </div>
        </div>
        <div className="grid gap-2">
          <label className="text-xs text-muted">Email</label>
          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="rounded-2xl border border-border bg-card px-4 py-3 text-sm text-foreground"
          />
        </div>
        <div className="grid gap-2">
          <label className="text-xs text-muted">Password</label>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="rounded-2xl border border-border bg-card px-4 py-3 text-sm text-foreground"
          />
        </div>
        {error ? (
          <div className="rounded-2xl border border-border bg-card px-4 py-2 text-xs text-accent">
            {error}
          </div>
        ) : null}
        <button
          className="rounded-2xl bg-accent/15 px-4 py-3 text-sm font-semibold text-accent"
          onClick={handleRegister}
          disabled={loading || checking}
        >
          {loading ? "Creating..." : "Create account"}
        </button>
        <button
          className="text-xs text-muted"
          onClick={() => router.push("/auth/login")}
        >
          Already have an account? Sign in
        </button>
      </GlassCard>
    </DashboardShell>
  );
}


