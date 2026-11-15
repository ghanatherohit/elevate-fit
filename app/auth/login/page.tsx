"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import AuthShell from "@/components/auth/AuthShell";
import SessionChecking from "@/components/auth/SessionChecking";
import DisabledWithHint, {
  getBlockReasons,
} from "@/components/shared/FormBlockHint";
import {
  formatFirebaseAuthError,
  loginWithEmail,
  loginWithGoogle,
} from "@/lib/auth/client";
import { getFirstZodError, loginInputSchema } from "@/lib/validation/schemas";

type SessionResponse = {
  error?: string;
  user?: unknown;
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

const fieldClass =
  "w-full rounded-[var(--radius)] border border-border bg-card/70 px-4 py-3.5 text-sm text-foreground outline-none transition placeholder:text-muted/70 focus:border-accent/50 focus:bg-card";

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [popup, setPopup] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [busy, setBusy] = useState(false);
  const [checking, setChecking] = useState(true);
  const popupTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loginBlockReasons = useMemo(
    () =>
      getBlockReasons([
        {
          ok: Boolean(identifier.trim()),
          reason: "Enter your email or username",
        },
        {
          ok: Boolean(password.trim()),
          reason: "Enter your password",
        },
        {
          ok: !busy,
          reason: "Please wait…",
        },
      ]),
    [identifier, password, busy],
  );

  const canSubmit = loginBlockReasons.length === 0;

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
      const { identifier: id, password: pwd } = parsed.data;

      if (id.includes("@")) {
        const user = await loginWithEmail(id.trim().toLowerCase(), pwd);
        await startSession(await user.getIdToken());
      } else {
        const response = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(parsed.data),
        });
        const body = await parseJson<SessionResponse>(response);
        if (!response.ok) {
          throw new Error(body?.error || "Invalid credentials");
        }
      }

      showPopup("success", "Login successful. Redirecting...");
      setTimeout(() => {
        void navigateAfterLogin();
      }, 900);
    } catch (err) {
      showPopup("error", formatFirebaseAuthError(err));
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
      showPopup("error", formatFirebaseAuthError(err));
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
      await fetch("/api/auth/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: parsed.data }),
      });
      showPopup("success", "If an account exists, a reset email was sent.");
    } catch (err) {
      showPopup("error", err instanceof Error ? err.message : "Reset failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell showBrandLink>
      <AnimatePresence>
        {popup ? (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--scrim)] px-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="glass-card w-full max-w-xs px-5 py-5 text-center"
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              transition={{ type: "spring", stiffness: 220, damping: 18 }}
            >
              <div
                className={`mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-[var(--radius)] border ${
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
              <div className="mt-1 text-xs text-muted">{popup.message}</div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <motion.div
        className="flex flex-1 flex-col justify-center gap-8"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <header className="grid gap-2">
          <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground">
            Welcome back
          </h1>
          <p className="text-sm text-muted">
            Sign in to continue your routines, gym plan, and recipes.
          </p>
        </header>

        {checking ? (
          <SessionChecking />
        ) : (
          <div className="glass-card grid gap-5 p-5 sm:p-6">
            <div className="grid gap-2">
              <label htmlFor="login-identifier" className="text-xs text-muted">
                Username or email
              </label>
              <input
                id="login-identifier"
                value={identifier}
                onChange={(event) => setIdentifier(event.target.value)}
                className={fieldClass}
                placeholder="name@domain.com"
                autoComplete="username"
              />
            </div>

            <div className="grid gap-2">
              <div className="flex items-center justify-between gap-3">
                <label htmlFor="login-password" className="text-xs text-muted">
                  Password
                </label>
                <button
                  type="button"
                  className="text-[11px] text-accent transition hover:opacity-80"
                  onClick={handleResetPassword}
                  disabled={busy}
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className={`${fieldClass} pr-12`}
                  placeholder="Your password"
                  autoComplete="current-password"
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && canSubmit) {
                      void handleEmailLogin();
                    }
                  }}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex items-center px-3.5 text-muted transition hover:text-foreground"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                >
                  {showPassword ? (
                    <svg
                      viewBox="0 0 24 24"
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      aria-hidden
                    >
                      <path d="M3 3l18 18" />
                      <path d="M10.6 10.6a2 2 0 002.8 2.8" />
                      <path d="M9.9 5.1A9.8 9.8 0 0112 5c5 0 9.3 3.1 11 7-0.6 1.4-1.5 2.7-2.6 3.7" />
                      <path d="M6.1 6.1C4.2 7.4 2.7 9.2 2 12c1.7 3.9 6 7 10 7 1.4 0 2.7-.3 3.9-.8" />
                    </svg>
                  ) : (
                    <svg
                      viewBox="0 0 24 24"
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      aria-hidden
                    >
                      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {popup?.type === "error" ? (
              <div className="sr-only" role="alert">
                {popup.message}
              </div>
            ) : null}

            <DisabledWithHint
              disabled={!canSubmit}
              reasons={loginBlockReasons}
            >
              <button
                type="button"
                className="w-full rounded-[var(--radius)] bg-accent px-4 py-3.5 text-sm font-semibold text-[var(--bg)] transition hover:opacity-90 disabled:opacity-50"
                onClick={handleEmailLogin}
                disabled={!canSubmit}
              >
                {busy ? "Signing in…" : "Sign in"}
              </button>
            </DisabledWithHint>

            <div className="flex items-center gap-3 text-[10px] uppercase tracking-[0.2em] text-muted">
              <span className="h-px flex-1 bg-border" />
              or
              <span className="h-px flex-1 bg-border" />
            </div>

            <button
              type="button"
              className="rounded-[var(--radius)] border border-border bg-card/50 px-4 py-3.5 text-sm font-medium text-foreground transition hover:border-accent/40 disabled:opacity-50"
              onClick={handleGoogleLogin}
              disabled={busy}
            >
              Continue with Google
            </button>
          </div>
        )}

        <p className="text-center text-sm text-muted">
          New here?{" "}
          <Link
            href="/auth/register"
            className="font-medium text-accent transition hover:opacity-80"
          >
            Create an account
          </Link>
        </p>
      </motion.div>
    </AuthShell>
  );
}
