type FocusCardProps = {
  title: string;
  detail: string;
};

export default function FocusCard({ title, detail }: FocusCardProps) {
  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] p-4">
      <div className="text-sm font-semibold text-[color:var(--text)]">{title}</div>
      <div className="text-xs text-[color:var(--muted)]">{detail}</div>
    </div>
  );
}
