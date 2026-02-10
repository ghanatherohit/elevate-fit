import ProgressRing from "./ProgressRing";

export default function DaySummary() {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <div className="text-xs text-[color:var(--muted)]">Today</div>
        <div className="font-[var(--font-space)] text-xl font-semibold text-[color:var(--text)]">
          Your progress
        </div>
        <div className="text-xs text-[color:var(--muted)]">
          Calm skin, steady energy, focused workout.
        </div>
      </div>
      <ProgressRing value={68} label="Completed" subtitle="8/12" />
    </div>
  );
}
