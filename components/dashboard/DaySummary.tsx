import ProgressRing from "@/components/progress/ProgressRing";

export default function DaySummary() {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <div className="text-xs text-muted">Today</div>
        <div
          className="text-xl font-semibold text-foreground"
          style={{ fontFamily: "var(--font-space)" }}
        >
          Your progress
        </div>
        <div className="text-xs text-muted">
          Calm skin, steady energy, focused workout.
        </div>
      </div>
      <ProgressRing value={68} label="Completed" subtitle="8/12" />
    </div>
  );
}


