type StatPillProps = {
  label: string;
  value: string;
};

export default function StatPill({ label, value }: StatPillProps) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-border bg-card-strong/80 px-4 py-3">
      <div className="text-xs text-muted">{label}</div>
      <div className="text-sm font-semibold text-foreground">{value}</div>
    </div>
  );
}


