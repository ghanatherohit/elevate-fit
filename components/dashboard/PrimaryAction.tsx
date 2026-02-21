type PrimaryActionProps = {
  label: string;
  sublabel: string;
};

export default function PrimaryAction({
  label,
  sublabel,
}: PrimaryActionProps) {
  return (
    <div className="glass-card soft-glow rounded-3xl p-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs text-muted">Up next</div>
          <div className="font-display text-base font-semibold text-foreground">
            {label}
          </div>
          <div className="text-xs text-muted">{sublabel}</div>
        </div>
        <button className="rounded-2xl bg-accent px-4 py-2 text-xs font-semibold text-black">
          Start
        </button>
      </div>
    </div>
  );
}


