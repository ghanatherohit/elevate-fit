"use client";

export default function Error({
  error,
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
          {error.message || "An unexpected error occurred."}
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
