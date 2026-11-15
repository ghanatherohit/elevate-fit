type SkeletonProps = {
  className?: string;
};

/** Soft shimmer block used to reserve layout before content arrives. */
export function Skeleton({ className = "" }: SkeletonProps) {
  return (
    <div
      className={`skeleton-shimmer rounded-[var(--radius)] ${className}`}
      aria-hidden
    />
  );
}
