type SummaryCardProps = {
  title: string;
  value: string;
  note: string;
};

export default function SummaryCard({
  title,
  value,
  note,
}: SummaryCardProps) {
  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] p-4">
      <div className="text-xs text-[color:var(--muted)]">{title}</div>
      <div className="text-lg font-semibold text-[color:var(--text)]">
        {value}
      </div>
      <div className="text-xs text-[color:var(--muted)]">{note}</div>
    </div>
  );
}
