import { Skeleton } from "@/components/shared/Skeleton";

/** Mirrors welcome AuthShell composition. */
export default function WelcomeSkeleton() {
  return (
    <div className="app-bg relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute right-5 top-6 z-40 sm:right-6 sm:top-8">
        <Skeleton className="h-11 w-11 rounded-full border border-border" />
      </div>

      <div
        className="relative mx-auto flex min-h-screen w-full max-w-lg flex-col justify-between gap-10 px-5 pb-10 pt-8 sm:px-6 sm:pt-12"
        aria-busy="true"
        aria-label="Loading welcome"
      >
        <section className="grid gap-8">
          <div className="mb-2 h-2 pr-14" aria-hidden />
          <Skeleton className="h-10 w-52 sm:h-12 sm:w-64" />
          <div className="relative mx-auto aspect-[4/5] w-full max-w-sm overflow-hidden rounded-[var(--radius-lg)] border border-border">
            <Skeleton className="absolute inset-0" />
            <div className="absolute inset-x-0 bottom-0 px-5 pb-5 pt-16">
              <Skeleton className="h-6 w-28" />
              <Skeleton className="mt-2 h-6 w-32" />
              <Skeleton className="mt-2 h-6 w-24" />
            </div>
          </div>
          <div className="grid gap-3">
            <Skeleton className="h-7 w-64 max-w-full" />
            <Skeleton className="h-3 w-full max-w-sm" />
            <Skeleton className="h-3 w-[85%] max-w-xs" />
          </div>
          <div className="grid gap-3">
            <Skeleton className="h-12 w-full rounded-[var(--radius)]" />
            <Skeleton className="h-12 w-full rounded-[var(--radius)] border border-border" />
          </div>
        </section>

        <section className="grid gap-4 border-t border-border pt-8">
          <Skeleton className="h-3.5 w-28" />
          <div className="grid gap-3">
            {[0, 1, 2].map((key) => (
              <div key={key} className="flex gap-3">
                <Skeleton className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" />
                <Skeleton className="h-3 w-full max-w-xs" />
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
