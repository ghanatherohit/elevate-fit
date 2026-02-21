type TimeCardProps = {
  time: string;
  label: string;
};

export default function TimeCard({ time, label }: TimeCardProps) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-border bg-card px-4 py-3">
      <div>
        <div className="text-xs text-muted">Next alarm</div>
        <div className="text-lg font-semibold text-foreground">
          {time}
        </div>
      </div>
      <div className="text-xs text-muted">{label}</div>
    </div>
  );
}


