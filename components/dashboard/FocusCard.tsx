type FocusCardProps = {
  title: string;
  detail: string;
};

export default function FocusCard({ title, detail }: FocusCardProps) {
  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-4">
      <div className="text-sm font-semibold text-foreground">{title}</div>
      <div className="text-xs text-muted">{detail}</div>
    </div>
  );
}


