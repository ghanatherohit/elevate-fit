/**
 * Optional Sentry bootstrap. Install `@sentry/nextjs` and set SENTRY_DSN /
 * NEXT_PUBLIC_SENTRY_DSN to enable. Kept dynamic so the app builds without the package.
 */
export async function initSentry(runtime: "client" | "server") {
  const dsn =
    runtime === "client"
      ? process.env.NEXT_PUBLIC_SENTRY_DSN
      : process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;

  if (!dsn) {
    return;
  }

  try {
    // Optional dependency — not required for builds without Sentry installed.
    const mod = " @sentry/nextjs".trim();
    const Sentry = (await import(/* webpackIgnore: true */ mod)) as {
      init: (options: { dsn: string; tracesSampleRate?: number }) => void;
    };
    Sentry.init({
      dsn,
      tracesSampleRate: 0.1,
    });
  } catch {
    console.warn(
      "[sentry] @sentry/nextjs not installed; skipping observability init",
    );
  }
}
