type TimeCardProps = {
  time: string;
  label: string;
};

export default function TimeCard({ time, label }: TimeCardProps) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] px-4 py-3">
      <div>
        <div className="text-xs text-[color:var(--muted)]">Next alarm</div>
        <div className="text-lg font-semibold text-[color:var(--text)]">
          {time}
        </div>
      </div>
      <div className="text-xs text-[color:var(--muted)]">{label}</div>
    </div>
  );
}
