import Link from "next/link";
import { OpenHint } from "@/components/shared/DataSurfaces";

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
  const canOpen = Boolean(href || onOpen);

  const content = (
    <div
      className={`data-row px-2 py-2.5 sm:px-3 sm:py-3 ${canOpen ? "openable group" : ""} ${
        highlight ? "bg-accent/10" : ""
      } ${checked ? "opacity-70" : ""}`}
    >
      <div className="flex min-w-0 flex-col">
        <span className="text-[11px] text-muted sm:text-xs">{timeLabel}</span>
        <span
          className={`text-sm font-semibold ${
            checked ? "text-muted line-through" : "text-foreground"
          }`}
        >
          {title}
        </span>
      </div>
      {canOpen ? <OpenHint kind="open" /> : null}
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



