"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useState } from "react";
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
  registerWithEmail,
} from "@/lib/auth/client";
import { firebaseAuth } from "@/lib/auth/firebase-client";
import { deleteUser, signOut } from "firebase/auth";
import {
  toUserMessage,
  userMessageFromResponse,
  USER_ERRORS,
} from "@/lib/errors/user-facing";
import {
  getPasswordRequirementHint,
  getPasswordStrength,
  isPasswordAcceptable,
} from "@/lib/validation/password";
import {
  getUsernameHint,
  isUsernameValid,
  normalizeUsername,
} from "@/lib/validation/username";
import { getFirstZodError, registerInputSchema } from "@/lib/validation/schemas";

const fieldClass =
  "w-full rounded-[var(--radius)] border border-border bg-card/70 px-4 py-3.5 text-sm text-foreground outline-none transition placeholder:text-muted/70 focus:border-accent/50 focus:bg-card";

type UsernameCheck = {
  status: "idle" | "checking" | "available" | "unavailable";
  message: string;
};

type ToastState = {
  type: "success" | "error";
  message: string;
};

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [usernameCheck, setUsernameCheck] = useState<UsernameCheck>({
    status: "idle",
    message: getUsernameHint(),
  });

  const passwordStrength = getPasswordStrength(password);
  const passwordsMatch =
    confirmPassword.length > 0 && password === confirmPassword;

  const safeJson = async <T,>(response: Response): Promise<T | null> => {
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("json")) {
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

  useEffect(() => {
    if (!toast) {
      return;
    }
    const timer = window.setTimeout(() => setToast(null), 2800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    const normalized = normalizeUsername(username);

    if (!normalized) {
      setUsernameCheck({ status: "idle", message: getUsernameHint() });
      return;
    }

    if (!isUsernameValid(normalized)) {
      setUsernameCheck({
        status: "unavailable",
        message: getUsernameHint(),
      });
      return;
    }

    setUsernameCheck({ status: "checking", message: "Checking availability…" });

    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      void (async () => {
        try {
          const response = await fetch(
            `/api/auth/username?username=${encodeURIComponent(normalized)}`,
            { signal: controller.signal, cache: "no-store" },
          );
          const data = await safeJson<{
            available?: boolean;
            message?: string;
            error?: string;
          }>(response);

          if (!response.ok) {
            setUsernameCheck({
              status: response.status === 429 ? "idle" : "unavailable",
              message: toUserMessage(
                data?.error || data?.message,
                response.status === 429
                  ? USER_ERRORS.rateLimit
                  : USER_ERRORS.usernameCheckFailed,
              ),
            });
            return;
          }

          if (data?.available) {
            setUsernameCheck({
              status: "available",
              message: data.message || "Username is available.",
            });
            return;
          }

          setUsernameCheck({
            status: "unavailable",
            message: toUserMessage(
              data?.message,
              USER_ERRORS.usernameInUse,
            ),
          });
        } catch (error) {
          if (error instanceof DOMException && error.name === "AbortError") {
            return;
          }
          setUsernameCheck({
            status: "unavailable",
            message: USER_ERRORS.usernameCheckFailed,
          });
        }
      })();
    }, 400);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [username]);

  const ensureUsernameAvailable = async (normalized: string) => {
    if (!isUsernameValid(normalized)) {
      throw new Error(getUsernameHint());
    }

    // Always re-check the exact submitted username (debounced UI state can be stale).
    const availability = await fetch(
      `/api/auth/username?username=${encodeURIComponent(normalized)}`,
      { cache: "no-store" },
    );
    const availabilityData = await safeJson<{
      available?: boolean;
      message?: string;
    }>(availability);

    if (!availability.ok) {
      const message = toUserMessage(
        availabilityData?.message,
        availability.status === 429
          ? USER_ERRORS.rateLimit
          : USER_ERRORS.usernameCheckFailed,
      );
      setUsernameCheck({
        status: availability.status === 429 ? "idle" : "unavailable",
        message,
      });
      throw new Error(message);
    }

    if (!availabilityData?.available) {
      const message = toUserMessage(
        availabilityData?.message,
        USER_ERRORS.usernameInUse,
      );
      setUsernameCheck({
        status: "unavailable",
        message,
      });
      throw new Error(message);
    }

    setUsernameCheck({
      status: "available",
      message: "Username is available.",
    });
    return normalized;
  };

  const finishRegistration = async (idToken: string, normalized: string) => {
    let session: Response;
    try {
      session = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken, username: normalized }),
      });
    } catch {
      throw new Error(USER_ERRORS.network);
    }

    if (!session.ok) {
      const message = await userMessageFromResponse(
        session,
        USER_ERRORS.registerFailed,
      );
      const error = new Error(message) as Error & { status?: number };
      error.status = session.status;
      throw error;
    }

    try {
      const dietResponse = await fetch("/api/profile/diet", {
        cache: "no-store",
      });
      const dietData = await safeJson<{ onboardingRequired?: boolean }>(
        dietResponse,
      );
      if (dietResponse.ok && dietData?.onboardingRequired) {
        router.push("/recipes?setup=diet");
        return;
      }
    } catch {
      // Still land the user in the app if post-register routing fails.
    }

    router.push("/");
  };

  const handleRegister = async () => {
    setLoading(true);
    try {
      if (!isPasswordAcceptable(password)) {
        throw new Error(
          `Password is too weak. ${getPasswordRequirementHint()}`,
        );
      }

      const parsed = registerInputSchema.safeParse({
        email,
        password,
        confirmPassword,
        username,
      });
      if (!parsed.success) {
        throw new Error(
          toUserMessage(
            getFirstZodError(parsed.error),
            USER_ERRORS.invalidPayload,
          ),
        );
      }

      const {
        username: normalized,
        email: validEmail,
        password: validPassword,
      } = parsed.data;

      await ensureUsernameAvailable(normalized);

      let user;
      let createdThisAttempt = false;
      try {
        user = await registerWithEmail(
          validEmail,
          validPassword,
          normalized,
        );
        createdThisAttempt = true;
      } catch (createErr) {
        // Recover from a prior attempt that created Firebase but failed session.
        const code =
          typeof createErr === "object" &&
          createErr !== null &&
          "code" in createErr
            ? String((createErr as { code?: string }).code)
            : "";
        if (code !== "auth/email-already-in-use") {
          throw createErr;
        }
        try {
          user = await loginWithEmail(validEmail, validPassword);
        } catch {
          throw new Error(
            "That email is already registered. Sign in, or use Google if you signed up that way.",
          );
        }
      }

      try {
        await finishRegistration(await user.getIdToken(), normalized);
      } catch (sessionErr) {
        // Only roll back on username/email conflicts (409). Never on 429/5xx —
        // Mongo may already exist; email-already-in-use recovery handles retry.
        const status =
          typeof sessionErr === "object" &&
          sessionErr !== null &&
          "status" in sessionErr
            ? Number((sessionErr as { status?: number }).status)
            : undefined;
        if (createdThisAttempt && status === 409) {
          try {
            await deleteUser(user);
          } catch {
            // Ignore — recovery path above handles retry if delete fails.
          }
        }
        throw sessionErr;
      }
    } catch (err) {
      setToast({
        type: "error",
        message: toUserMessage(
          formatFirebaseAuthError(err),
          USER_ERRORS.registerFailed,
        ),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegister = async () => {
    setLoading(true);
    try {
      const normalized = normalizeUsername(username);
      if (!isUsernameValid(normalized)) {
        throw new Error(getUsernameHint());
      }
      await ensureUsernameAvailable(normalized);

      const user = await loginWithGoogle();
      try {
        // Re-check after OAuth — another signup may have taken the name.
        await ensureUsernameAvailable(normalized);
      } catch (availabilityErr) {
        try {
          await signOut(firebaseAuth);
        } catch {
          // Best-effort
        }
        throw availabilityErr;
      }

      try {
        await finishRegistration(await user.getIdToken(), normalized);
      } catch (sessionErr) {
        const status =
          typeof sessionErr === "object" &&
          sessionErr !== null &&
          "status" in sessionErr
            ? Number((sessionErr as { status?: number }).status)
            : undefined;
        if (status === 409) {
          try {
            await signOut(firebaseAuth);
          } catch {
            // Best-effort
          }
        }
        throw sessionErr;
      }
    } catch (err) {
      setToast({
        type: "error",
        message: toUserMessage(
          formatFirebaseAuthError(err),
          USER_ERRORS.registerFailed,
        ),
      });
    } finally {
      setLoading(false);
    }
  };

  const usernameHintClass =
    usernameCheck.status === "available"
      ? "text-foreground"
      : usernameCheck.status === "unavailable"
        ? "text-accent"
        : "text-muted";

  const usernameReady = usernameCheck.status === "available";
  const emailReady = email.trim().length > 0;
  const passwordReady = isPasswordAcceptable(password);
  const confirmReady = passwordsMatch;

  const emailBlockReasons = getBlockReasons([
    {
      ok: usernameReady,
      reason:
        usernameCheck.status === "checking"
          ? "Wait until username availability is confirmed"
          : usernameCheck.status === "unavailable"
            ? usernameCheck.message || "Choose an available username"
            : "Enter an available username",
    },
    {
      ok: emailReady,
      reason: "Enter your email address",
    },
    {
      ok: passwordReady,
      reason: `Create a stronger password — ${getPasswordRequirementHint()}`,
    },
    {
      ok: confirmReady,
      reason: confirmPassword
        ? "Passwords must match"
        : "Confirm your password",
    },
    {
      ok: !loading,
      reason: "Please wait…",
    },
  ]);

  const googleBlockReasons = getBlockReasons([
    {
      ok: usernameReady,
      reason:
        usernameCheck.status === "checking"
          ? "Wait until username availability is confirmed"
          : usernameCheck.status === "unavailable"
            ? usernameCheck.message || "Choose an available username"
            : "Enter an available username first",
    },
    {
      ok: !loading,
      reason: "Please wait…",
    },
  ]);

  const canEmailSubmit = emailBlockReasons.length === 0;
  const canGoogleSubmit = googleBlockReasons.length === 0;

  return (
    <AuthShell showBrandLink>
      <AnimatePresence>
        {toast ? (
          <motion.div
            key="register-toast"
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="fixed right-4 top-4 z-70"
          >
            <div
              className={`max-w-xs rounded-2xl border px-3 py-2 text-xs shadow-lg ${
                toast.type === "success"
                  ? "border-accent/40 bg-card text-foreground"
                  : "border-accent/45 bg-card text-accent"
              }`}
              role="status"
              aria-live="polite"
            >
              {toast.message}
            </div>
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
            Create account
          </h1>
          <p className="text-sm text-muted">
            Pick a username once — it stays with your account.
          </p>
        </header>

        {checking ? (
          <SessionChecking />
        ) : (
          <div className="glass-card grid gap-5 p-5 sm:p-6">
            <div className="grid gap-2">
              <label htmlFor="register-username" className="text-xs text-muted">
                Username
              </label>
              <input
                id="register-username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                className={fieldClass}
                placeholder="yourname"
                autoComplete="username"
                aria-describedby="register-username-status"
                aria-invalid={usernameCheck.status === "unavailable"}
              />
              <p
                id="register-username-status"
                className={`text-[10px] leading-relaxed ${usernameHintClass}`}
                role="status"
                aria-live="polite"
              >
                {usernameCheck.message}
              </p>
            </div>

            <div className="grid gap-2">
              <label htmlFor="register-email" className="text-xs text-muted">
                Email
              </label>
              <input
                id="register-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className={fieldClass}
                placeholder="name@domain.com"
                autoComplete="email"
              />
            </div>

            <div className="grid gap-2">
              <label htmlFor="register-password" className="text-xs text-muted">
                Password
              </label>
              <div className="relative">
                <input
                  id="register-password"
                  type={showPasswords ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className={`${fieldClass} pr-12`}
                  placeholder="Create a password"
                  autoComplete="new-password"
                  aria-describedby="register-password-strength"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex items-center px-3.5 text-muted transition hover:text-foreground"
                  onClick={() => setShowPasswords((value) => !value)}
                  aria-label={
                    showPasswords ? "Hide passwords" : "Show passwords"
                  }
                  aria-pressed={showPasswords}
                >
                  {showPasswords ? (
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
              <div className="grid gap-1.5">
                <div
                  className="grid grid-cols-3 gap-1"
                  aria-hidden
                >
                  {([1, 2, 3] as const).map((step) => {
                    const filled = passwordStrength.score >= step;
                    const tone =
                      passwordStrength.level === "strong"
                        ? "bg-accent"
                        : passwordStrength.level === "medium"
                          ? "bg-accent/55"
                          : "bg-accent/35";
                    return (
                      <div
                        key={step}
                        className={`h-1.5 rounded-full transition-colors ${
                          filled ? tone : "bg-card-strong/60"
                        }`}
                      />
                    );
                  })}
                </div>
                <div className="flex items-center justify-between gap-3">
                  <p
                    id="register-password-strength"
                    className={`text-[10px] leading-relaxed ${
                      passwordReady ? "text-foreground" : "text-accent"
                    }`}
                    role="status"
                    aria-live="polite"
                  >
                    {password ? passwordStrength.label : "Password strength"}
                  </p>
                  <p className="text-[10px] text-muted">
                    Weak · Medium · Strong
                  </p>
                </div>
                <p className="text-[10px] leading-relaxed text-muted">
                  {passwordReady
                    ? passwordStrength.level === "strong"
                      ? "Looks good."
                      : "Good enough."
                    : getPasswordRequirementHint()}
                </p>
              </div>
            </div>

            <div className="grid gap-2">
              <label
                htmlFor="register-confirm-password"
                className="text-xs text-muted"
              >
                Confirm password
              </label>
              <div className="relative">
                <input
                  id="register-confirm-password"
                  type={showPasswords ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  className={`${fieldClass} pr-12`}
                  placeholder="Type password again"
                  autoComplete="new-password"
                  aria-invalid={confirmPassword.length > 0 && !passwordsMatch}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && canEmailSubmit) {
                      void handleRegister();
                    }
                  }}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex items-center px-3.5 text-muted transition hover:text-foreground"
                  onClick={() => setShowPasswords((value) => !value)}
                  aria-label={
                    showPasswords ? "Hide passwords" : "Show passwords"
                  }
                  aria-pressed={showPasswords}
                >
                  {showPasswords ? (
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
              {confirmPassword ? (
                <p
                  className={`text-[10px] leading-relaxed ${
                    passwordsMatch ? "text-foreground" : "text-accent"
                  }`}
                  role="status"
                  aria-live="polite"
                >
                  {passwordsMatch
                    ? "Passwords match"
                    : "Passwords do not match"}
                </p>
              ) : null}
            </div>

            <DisabledWithHint
              disabled={!canEmailSubmit}
              reasons={emailBlockReasons}
            >
              <button
                type="button"
                className="w-full rounded-[var(--radius)] bg-accent px-4 py-3.5 text-sm font-semibold text-[var(--bg)] transition hover:opacity-90 disabled:opacity-50"
                onClick={() => {
                  void handleRegister();
                }}
                disabled={!canEmailSubmit}
              >
                {loading ? "Creating account…" : "Create account"}
              </button>
            </DisabledWithHint>

            <div className="flex items-center gap-3 text-[10px] uppercase tracking-[0.2em] text-muted">
              <span className="h-px flex-1 bg-border" />
              or
              <span className="h-px flex-1 bg-border" />
            </div>

            <DisabledWithHint
              disabled={!canGoogleSubmit}
              reasons={googleBlockReasons}
            >
              <button
                type="button"
                className="w-full rounded-[var(--radius)] border border-border bg-card/50 px-4 py-3.5 text-sm font-medium text-foreground transition hover:border-accent/40 disabled:opacity-50"
                onClick={() => {
                  void handleGoogleRegister();
                }}
                disabled={!canGoogleSubmit}
              >
                {loading ? "Working…" : "Sign up with Google"}
              </button>
            </DisabledWithHint>
          </div>
        )}

        <p className="text-center text-sm text-muted">
          Already have an account?{" "}
          <Link
            href="/auth/login"
            className="font-medium text-accent transition hover:opacity-80"
          >
            Sign in
          </Link>
        </p>
      </motion.div>
    </AuthShell>
  );
}
