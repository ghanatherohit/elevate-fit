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
    <div className="flex items-center justify-between gap-3">
      <h2 className="type-title">{title}</h2>
      {action ? (
        onAction ? (
          <button
            className="soft-chip type-meta"
            onClick={onAction}
            type="button"
          >
            {action}
          </button>
        ) : (
          <span className="type-meta">{action}</span>
        )
      ) : null}
    </div>
  );
}
