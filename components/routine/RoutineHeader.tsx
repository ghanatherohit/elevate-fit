type RoutineHeaderProps = {
  title: string;
  subtitle: string;
};

export default function RoutineHeader({
  title,
  subtitle,
}: RoutineHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <div className="text-xs text-muted">{subtitle}</div>
        <div className="font-display text-base font-semibold text-foreground">
          {title}
        </div>
      </div>
      <button className="rounded-full border border-border px-3 py-1 text-xs text-muted">
        Edit
      </button>
    </div>
  );
}


