type SectionHeaderProps = {
  title: string;
  action?: string;
  onAction?: () => void;
};

export default function SectionHeader({
  title,
  action,
  onAction,
}: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="font-[var(--font-space)] text-base font-semibold tracking-wide text-[color:var(--text)]">
        {title}
      </h2>
      {action ? (
        <button
          className="text-xs font-medium text-[color:var(--muted)]"
          onClick={onAction}
          type="button"
        >
          {action}
        </button>
      ) : null}
    </div>
  );
}
