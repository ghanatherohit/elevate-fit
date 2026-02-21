"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardShell from "@/components/layout/DashboardShell";
import GlassCard from "@/components/shared/GlassCard";
import SectionHeader from "@/components/shared/SectionHeader";
import {
  loginWithEmail,
  loginWithGoogle,
  requestPasswordReset,
} from "@/lib/auth/client";
import { getFirstZodError, loginInputSchema } from "@/lib/validation/schemas";

type ResolveResponse = {
  email?: string;
  error?: string;
};

type SessionResponse = {
  error?: string;
};

type MeResponse = {
  user: unknown | null;
};

type DietProfileResponse = {
  onboardingRequired?: boolean;
};

const parseJson = async <T,>(response: Response): Promise<T | null> => {
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    return null;
  }
  return (await response.json()) as T;
};

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [popup, setPopup] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [busy, setBusy] = useState(false);
  const [checking, setChecking] = useState(true);
  const popupTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const canSubmit = useMemo(() => {
    return Boolean(identifier.trim()) && Boolean(password.trim()) && !busy;
  }, [identifier, password, busy]);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch("/api/auth/me");
        const data = await parseJson<MeResponse>(response);
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

  useEffect(() => {
    return () => {
      if (popupTimer.current) {
        clearTimeout(popupTimer.current);
      }
    };
  }, []);

  const showPopup = (type: "success" | "error", message: string) => {
    if (popupTimer.current) {
      clearTimeout(popupTimer.current);
    }
    setPopup({ type, message });
    popupTimer.current = setTimeout(() => {
      setPopup(null);
    }, 2200);
  };

  const resolveEmail = async (input: string) => {
    if (input.includes("@")) {
      return input;
    }

    const response = await fetch("/api/auth/resolve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier: input }),
    });
    const data = await parseJson<ResolveResponse>(response);
    if (!response.ok || !data?.email) {
      throw new Error(data?.error || "Username not found");
    }
    return data.email;
  };

  const startSession = async (idToken: string) => {
    const session = await fetch("/api/auth/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    });

    if (!session.ok) {
      const body = await parseJson<SessionResponse>(session);
      throw new Error(body?.error || "Session failed");
    }
  };

  const navigateAfterLogin = async () => {
    const response = await fetch("/api/profile/diet", { cache: "no-store" });
    const data = await parseJson<DietProfileResponse>(response);

    if (response.ok && data?.onboardingRequired) {
      router.push("/recipes?setup=diet");
      return;
    }

    router.push("/");
  };

  const handleEmailLogin = async () => {
    const parsed = loginInputSchema.safeParse({ identifier, password });
    if (!parsed.success) {
      showPopup("error", getFirstZodError(parsed.error));
      return;
    }

    setBusy(true);
    try {
      const email = await resolveEmail(parsed.data.identifier);
      const user = await loginWithEmail(email, parsed.data.password);
      await startSession(await user.getIdToken());
      showPopup("success", "Login successful. Redirecting...");
      setTimeout(() => {
        void navigateAfterLogin();
      }, 900);
    } catch (err) {
      showPopup("error", err instanceof Error ? err.message : "Login failed");
    } finally {
      setBusy(false);
    }
  };

  const handleGoogleLogin = async () => {
    setBusy(true);
    try {
      const user = await loginWithGoogle();
      await startSession(await user.getIdToken());
      showPopup("success", "Login successful. Redirecting...");
      setTimeout(() => {
        void navigateAfterLogin();
      }, 900);
    } catch (err) {
      showPopup("error", err instanceof Error ? err.message : "Login failed");
    } finally {
      setBusy(false);
    }
  };

  const handleResetPassword = async () => {
    const parsed = loginInputSchema.shape.identifier.safeParse(identifier);
    if (!parsed.success) {
      showPopup("error", getFirstZodError(parsed.error));
      return;
    }

    setBusy(true);
    try {
      const email = await resolveEmail(parsed.data);
      await requestPasswordReset(email);
      showPopup("success", "Password reset email sent.");
    } catch (err) {
      showPopup("error", err instanceof Error ? err.message : "Reset failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <DashboardShell>
      <SectionHeader title="Login" action="Welcome back" />
      <AnimatePresence>
        {popup ? (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="w-full max-w-xs rounded-3xl border border-border bg-card px-5 py-4 text-center"
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              transition={{ type: "spring", stiffness: 220, damping: 18 }}
            >
              <div
                className={`mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border ${
                  popup.type === "success"
                    ? "border-accent/40 bg-accent/15 text-accent"
                    : "border-border bg-card-strong text-foreground"
                }`}
              >
                <span className="text-lg">
                  {popup.type === "success" ? "✓" : "!"}
                </span>
              </div>
              <div className="text-sm font-semibold text-foreground">
                {popup.type === "success" ? "Success" : "Try again"}
              </div>
              <div className="mt-1 text-xs text-muted">
                {popup.message}
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
      <GlassCard className="grid gap-4">
        {checking ? (
          <div className="rounded-2xl border border-border bg-card px-4 py-3 text-xs text-muted">
            Checking session...
          </div>
        ) : null}
        <div className="grid gap-2">
          <label className="text-xs text-muted">
            Username or email
          </label>
          <input
            value={identifier}
            onChange={(event) => setIdentifier(event.target.value)}
            className="rounded-2xl border border-border bg-card px-4 py-3 text-sm text-foreground"
            placeholder="name@domain.com"
            autoComplete="username"
          />
        </div>
        <div className="grid gap-2">
          <label className="text-xs text-muted">Password</label>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="rounded-2xl border border-border bg-card px-4 py-3 text-sm text-foreground"
            placeholder="Your password"
            autoComplete="current-password"
          />
        </div>
        <button
          className="rounded-2xl bg-accent/15 px-4 py-3 text-sm font-semibold text-accent"
          onClick={handleEmailLogin}
          disabled={!canSubmit || checking}
        >
          {busy ? "Signing in..." : "Sign in"}
        </button>
        <button
          className="rounded-2xl border border-border bg-card px-4 py-3 text-sm text-foreground"
          onClick={handleGoogleLogin}
          disabled={busy || checking}
        >
          Continue with Google
        </button>
        <button
          className="text-xs text-muted"
          onClick={handleResetPassword}
          disabled={busy}
        >
          Forgot password?
        </button>
        <button
          className="text-xs text-muted"
          onClick={() => router.push("/auth/register")}
          disabled={busy}
        >
          Create an account
        </button>
      </GlassCard>
    </DashboardShell>
  );
}



