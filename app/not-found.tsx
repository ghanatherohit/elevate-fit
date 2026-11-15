import Link from "next/link";

export default function NotFound() {
  return (
    <div className="app-bg flex min-h-screen items-center justify-center px-5">
      <div className="glass-card grid w-full max-w-md gap-3 px-6 py-8 text-center">
        <div className="text-sm font-semibold text-foreground">Page not found</div>
        <div className="text-xs text-muted">
          That route does not exist or was moved.
        </div>
        <Link
          href="/"
          className="rounded-[var(--radius)] bg-accent/15 px-4 py-3 text-sm font-semibold text-accent"
        >
          Back home
        </Link>
      </div>
    </div>
  );
}
