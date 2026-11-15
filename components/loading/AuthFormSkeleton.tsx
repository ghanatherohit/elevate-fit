import { Skeleton } from "@/components/shared/Skeleton";

/** Mirrors login/register AuthShell + form card. */
export default function AuthFormSkeleton() {
  return (
    <div className="app-bg relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute right-5 top-6 z-40 sm:right-6 sm:top-8">
        <Skeleton className="h-11 w-11 rounded-full border border-border" />
      </div>

      <div className="relative mx-auto flex min-h-screen w-full max-w-lg flex-col px-5 pb-10 pt-8 sm:px-6 sm:pt-12">
        <div className="mb-8 pr-14">
          <Skeleton className="h-5 w-28" />
        </div>

        <div className="flex flex-1 flex-col justify-center gap-8">
          <header className="grid gap-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-3 w-64 max-w-full" />
          </header>

          <div
            className="glass-card grid gap-5 p-5 sm:p-6"
            aria-busy="true"
            aria-label="Loading form"
          >
            <div className="grid gap-2">
              <Skeleton className="h-2.5 w-28" />
              <Skeleton className="h-[3.25rem] w-full rounded-[var(--radius)] border border-border" />
            </div>
            <div className="grid gap-2">
              <div className="flex items-center justify-between gap-3">
                <Skeleton className="h-2.5 w-16" />
                <Skeleton className="h-2.5 w-24" />
              </div>
              <Skeleton className="h-[3.25rem] w-full rounded-[var(--radius)] border border-border" />
            </div>
            <Skeleton className="h-[3.25rem] w-full rounded-[var(--radius)]" />
            <div className="flex items-center gap-3">
              <Skeleton className="h-px flex-1" />
              <Skeleton className="h-2 w-6" />
              <Skeleton className="h-px flex-1" />
            </div>
            <Skeleton className="h-[3.25rem] w-full rounded-[var(--radius)] border border-border" />
          </div>

          <Skeleton className="mx-auto h-3 w-48" />
        </div>
      </div>
    </div>
  );
}
