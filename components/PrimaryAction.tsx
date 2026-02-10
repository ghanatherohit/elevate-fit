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
          <div className="text-xs text-[color:var(--muted)]">Up next</div>
          <div className="font-[var(--font-space)] text-base font-semibold text-[color:var(--text)]">
            {label}
          </div>
          <div className="text-xs text-[color:var(--muted)]">{sublabel}</div>
        </div>
        <button className="rounded-2xl bg-[color:var(--accent)] px-4 py-2 text-xs font-semibold text-black">
          Start
        </button>
      </div>
    </div>
  );
}
