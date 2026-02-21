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
    <div className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-4">
      <div className="text-xs text-muted">{title}</div>
      <div className="text-lg font-semibold text-foreground">
        {value}
      </div>
      <div className="text-xs text-muted">{note}</div>
    </div>
  );
}


