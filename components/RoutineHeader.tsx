type RoutineHeaderProps = {
  title: string;
  subtitle: string;
};

export default function RoutineHeader({
  title,
  subtitle,
}: RoutineHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <div className="text-xs text-[color:var(--muted)]">{subtitle}</div>
        <div className="font-[var(--font-space)] text-base font-semibold text-[color:var(--text)]">
          {title}
        </div>
      </div>
      <button className="rounded-full border border-[color:var(--border)] px-3 py-1 text-xs text-[color:var(--muted)]">
        Edit
      </button>
    </div>
  );
}
