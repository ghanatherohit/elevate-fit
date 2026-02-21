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
    <div className="flex flex-col gap-1 rounded-2xl border border-border bg-card px-4 py-3">
      <div className="text-xs text-muted">{title}</div>
      <div className="text-base font-semibold text-foreground">
        {value}
      </div>
      <div className="text-xs text-muted">{note}</div>
    </div>
  );
}


