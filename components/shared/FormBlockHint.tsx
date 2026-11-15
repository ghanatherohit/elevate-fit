import type { ReactNode } from "react";

type BlockCheck = {
  ok: boolean;
  reason: string;
};

/** Collect human-readable reasons an action is blocked. */
export function getBlockReasons(checks: BlockCheck[]): string[] {
  return checks.filter((check) => !check.ok).map((check) => check.reason);
}

type DisabledWithHintProps = {
  disabled: boolean;
  reasons: string[];
  className?: string;
  children: ReactNode;
};

/**
 * Disabled buttons don't hover in most browsers — wrap them so the tip still shows.
 */
export default function DisabledWithHint({
  disabled,
  reasons,
  className = "block w-full",
  children,
}: DisabledWithHintProps) {
  const hint = reasons.length ? reasons.join(" · ") : undefined;

  if (!disabled || !hint) {
    return <>{children}</>;
  }

  return (
    <span className={`cursor-not-allowed ${className}`} title={hint}>
      <span className="pointer-events-none contents">{children}</span>
    </span>
  );
}
