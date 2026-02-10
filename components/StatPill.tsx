type StatPillProps = {
  label: string;
  value: string;
};

export default function StatPill({ label, value }: StatPillProps) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-[color:var(--border)] bg-[color:var(--card-strong)]/80 px-4 py-3">
      <div className="text-xs text-[color:var(--muted)]">{label}</div>
      <div className="text-sm font-semibold text-[color:var(--text)]">{value}</div>
    </div>
  );
}
