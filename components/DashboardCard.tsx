type DashboardCardProps = {
  title: string;
  value: string;
  note: string;
};

export default function DashboardCard({
  title,
  value,
  note,
}: DashboardCardProps) {
  return (
    <div className="flex flex-col gap-1 rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] px-4 py-3">
      <div className="text-xs text-[color:var(--muted)]">{title}</div>
      <div className="text-base font-semibold text-[color:var(--text)]">
        {value}
      </div>
      <div className="text-xs text-[color:var(--muted)]">{note}</div>
    </div>
  );
}
