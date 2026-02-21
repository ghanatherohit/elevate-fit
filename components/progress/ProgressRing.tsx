type ProgressRingProps = {
  value: number;
  label: string;
  subtitle?: string;
};

export default function ProgressRing({
  value,
  label,
  subtitle,
}: ProgressRingProps) {
  const degrees = Math.min(Math.max(value, 0), 100) * 3.6;

  return (
    <div
      className="relative flex h-28 w-28 items-center justify-center rounded-full p-[3px]"
      style={{
        background: `conic-gradient(var(--ring-accent) ${degrees}deg, var(--ring-track) 0deg)`,
      }}
    >
      <div className="flex h-full w-full flex-col items-center justify-center rounded-full bg-card text-center">
        <div className="text-2xl font-semibold tracking-tight">
          {value}
          <span className="text-sm text-muted">%</span>
        </div>
        <div className="text-xs text-muted">{label}</div>
        {subtitle ? (
          <div className="text-[10px] text-muted">{subtitle}</div>
        ) : null}
      </div>
    </div>
  );
}


