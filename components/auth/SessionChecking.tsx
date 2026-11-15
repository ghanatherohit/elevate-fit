import { Skeleton } from "@/components/shared/Skeleton";

/** Login/register form shell while session resolves — no loading copy. */
export default function SessionChecking() {
  return (
    <div
      className="glass-card grid gap-5 p-5 sm:p-6"
      aria-busy="true"
      aria-label="Checking session"
    >
      <div className="grid gap-2">
        <Skeleton className="h-2.5 w-28" />
        <Skeleton className="h-11 w-full" />
      </div>
      <div className="grid gap-2">
        <Skeleton className="h-2.5 w-20" />
        <Skeleton className="h-11 w-full" />
      </div>
      <Skeleton className="h-11 w-full" />
      <div className="flex items-center gap-3">
        <Skeleton className="h-px flex-1" />
        <Skeleton className="h-2 w-6" />
        <Skeleton className="h-px flex-1" />
      </div>
      <Skeleton className="h-11 w-full" />
    </div>
  );
}
