import Link from "next/link";

type RoutineItemProps = {
  time: string;
  endTime?: string;
  title: string;
  highlight?: boolean;
  href?: string;
  checked?: boolean;
  onToggle?: () => void;
  onOpen?: () => void;
  toggleDisabled?: boolean;
  lockLabel?: string;
};

export default function RoutineItem({
  time,
  endTime,
  title,
  highlight = false,
  href,
  checked,
  onToggle,
  onOpen,
  toggleDisabled = false,
  lockLabel,
}: RoutineItemProps) {
  const timeLabel = endTime && endTime !== time ? `${time} - ${endTime}` : time;

  const content = (
    <div
      className={`flex items-center justify-between rounded-2xl border px-4 py-3 ${
        highlight
          ? "border-accent/40 bg-card-strong"
          : "border-border bg-card"
      }`}
    >
      <div className="flex flex-col">
        <span className="text-xs text-muted">{timeLabel}</span>
        <span className="text-sm font-semibold text-foreground">
          {title}
        </span>
      </div>
    </div>
  );

  if (onOpen && onToggle) {
    return (
      <div className="flex items-center gap-3">
        <div className="group flex flex-col items-center gap-1">
          <input
            type="checkbox"
            checked={checked}
            onChange={toggleDisabled ? undefined : onToggle}
            disabled={toggleDisabled}
            className={`h-5 w-5 accent-accent ${
              toggleDisabled ? "cursor-not-allowed opacity-60" : ""
            }`}
            aria-label={`Mark ${title} complete`}
          />
          {toggleDisabled && lockLabel ? (
            <span className="text-[10px] font-semibold text-accent opacity-0 transition-opacity group-hover:opacity-100">
              {lockLabel}
            </span>
          ) : null}
        </div>
        <button className="flex-1 text-left" onClick={onOpen}>
          {content}
        </button>
      </div>
    );
  }

  if (href && onToggle) {
    return (
      <div className="flex items-center gap-3">
        <div className="group flex flex-col items-center gap-1">
          <input
            type="checkbox"
            checked={checked}
            onChange={toggleDisabled ? undefined : onToggle}
            disabled={toggleDisabled}
            className={`h-5 w-5 accent-accent ${
              toggleDisabled ? "cursor-not-allowed opacity-60" : ""
            }`}
            aria-label={`Mark ${title} complete`}
          />
          {toggleDisabled && lockLabel ? (
            <span className="text-[10px] font-semibold text-accent opacity-0 transition-opacity group-hover:opacity-100">
              {lockLabel}
            </span>
          ) : null}
        </div>
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



