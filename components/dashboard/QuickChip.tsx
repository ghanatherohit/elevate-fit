type QuickChipProps = {
  label: string;
  value: string;
};

export default function QuickChip({ label, value }: QuickChipProps) {
  return (
    <div className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-2 text-xs">
      <span className="text-muted">{label}</span>
      <span className="font-semibold text-foreground">{value}</span>
    </div>
  );
}


