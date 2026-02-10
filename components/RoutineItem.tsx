import Link from "next/link";

type RoutineItemProps = {
  time: string;
  title: string;
  meta: string;
  highlight?: boolean;
  href?: string;
  checked?: boolean;
  onToggle?: () => void;
};

export default function RoutineItem({
  time,
  title,
  meta,
  highlight = false,
  href,
  checked,
  onToggle,
}: RoutineItemProps) {
  const content = (
    <div
      className={`flex items-center justify-between rounded-2xl border px-4 py-3 ${
        highlight
          ? "border-[color:var(--accent)]/40 bg-[color:var(--card-strong)]"
          : "border-[color:var(--border)] bg-[color:var(--card)]"
      }`}
    >
      <div className="flex flex-col">
        <span className="text-xs text-[color:var(--muted)]">{time}</span>
        <span className="text-sm font-semibold text-[color:var(--text)]">
          {title}
        </span>
      </div>
      <span className="text-xs text-[color:var(--muted)]">{meta}</span>
    </div>
  );

  if (href && onToggle) {
    return (
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          checked={checked}
          onChange={onToggle}
          className="h-5 w-5 accent-[color:var(--accent)]"
          aria-label={`Mark ${title} complete`}
        />
        <Link href={href} className="flex-1">
          {content}
        </Link>
      </div>
    );
  }

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}
