"use client";

import { USER_ERRORS } from "@/lib/errors/user-facing";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="app-bg flex min-h-screen items-center justify-center px-5">
      <div className="glass-card grid w-full max-w-md gap-3 px-6 py-8 text-center">
        <div className="text-sm font-semibold text-foreground">
          Something went wrong
        </div>
        <div className="text-xs text-muted" role="alert">
          {USER_ERRORS.pageCrash}
        </div>
        <button
          type="button"
          onClick={reset}
          className="rounded-[var(--radius)] bg-accent/15 px-4 py-3 text-sm font-semibold text-accent"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
