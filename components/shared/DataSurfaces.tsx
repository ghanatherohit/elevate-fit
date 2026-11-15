import type { ComponentPropsWithoutRef, ReactNode } from "react";

type Classed = { className?: string; children: ReactNode };

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

/** Vertical stack with hairline dividers — no per-row frames. */
export function DataList({ className = "", children }: Classed) {
  return <div className={cx("data-list", className)}>{children}</div>;
}

type DataRowProps = ComponentPropsWithoutRef<"div"> & {
  asChild?: boolean;
};

/** Quiet interactive row: wash on hover, no border box. */
export function DataRow({
  className = "",
  children,
  ...rest
}: DataRowProps) {
  return (
    <div className={cx("data-row", className)} {...rest}>
      {children}
    </div>
  );
}

/** Borderless stat cells — gap + muted labels only. */
export function StatStrip({
  className = "",
  children,
  cols = 4,
}: Classed & { cols?: 2 | 3 | 4 }) {
  return (
    <div
      className={cx(
        "stat-strip",
        cols === 2 && "grid-cols-2",
        cols === 3 && "grid-cols-3",
        cols === 4 && "grid-cols-2 sm:grid-cols-4",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function StatCell({
  label,
  value,
  hint,
  className = "",
}: {
  label: ReactNode;
  value: ReactNode;
  hint?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cx("stat-cell", className)}>
      <div className="type-meta">{label}</div>
      <div className="type-heading">{value}</div>
      {hint != null ? <div className="type-meta">{hint}</div> : null}
    </div>
  );
}

/** Page / day-level title (Day 1, Recipes, etc.). */
export function TypeTitle({ className = "", children }: Classed) {
  return <div className={cx("type-title", className)}>{children}</div>;
}

/** Block / subsection title (Warm-up, Chest, Ingredients). */
export function TypeHeading({ className = "", children }: Classed) {
  return <div className={cx("type-heading", className)}>{children}</div>;
}

/** Readable body copy and primary table cells. */
export function TypeBody({ className = "", children }: Classed) {
  return <div className={cx("type-body", className)}>{children}</div>;
}

/** Quiet helper text, timestamps, column labels. */
export function TypeMeta({ className = "", children }: Classed) {
  return <div className={cx("type-meta", className)}>{children}</div>;
}

/** Tiny uppercase eyebrow above a title. */
export function TypeKicker({ className = "", children }: Classed) {
  return <div className={cx("type-kicker", className)}>{children}</div>;
}

/** Chart/title block with padding only — no rounded bordered wrapper. */
export function ChartBlock({
  title,
  className = "",
  children,
}: Classed & { title?: ReactNode }) {
  return (
    <div className={cx("chart-block", className)}>
      {title != null ? <div className="type-meta">{title}</div> : null}
      <div className={title != null ? "mt-3" : undefined}>{children}</div>
    </div>
  );
}

/** Soft pill without outline — for chips inside a section shell. */
export function SoftChip({ className = "", children }: Classed) {
  return <span className={cx("soft-chip", className)}>{children}</span>;
}

/** Soft tile for quick-access grids — wash, no border frame. */
export function SoftTile({
  className = "",
  children,
  ...rest
}: ComponentPropsWithoutRef<"div">) {
  return (
    <div className={cx("soft-tile", className)} {...rest}>
      {children}
    </div>
  );
}

type OpenHintProps = {
  /** expand = accordion/details; open = navigate/modal */
  kind?: "expand" | "open";
  className?: string;
};

/** Arrow-only cue that a control opens or expands something. */
export function OpenHint({ kind = "open", className = "" }: OpenHintProps) {
  const glyph = kind === "expand" ? "▾" : "›";
  return (
    <span
      className={cx(
        "open-hint",
        kind === "expand" ? "open-hint--expand" : "open-hint--open",
        className,
      )}
      aria-hidden
    >
      {glyph}
    </span>
  );
}
