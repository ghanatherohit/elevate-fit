export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { assertProductionEnv } = await import("@/lib/env");
    try {
      assertProductionEnv();
    } catch (error) {
      console.error(error);
      if (
        process.env.NODE_ENV === "production" &&
        process.env.NEXT_PHASE !== "phase-production-build"
      ) {
        throw error;
      }
    }

    if (process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN) {
      await import("./sentry.server.config");
    }
  }
}
