import MiniStats from "./MiniStats";

export default function RecoveryPanel() {
  return (
    <div className="grid gap-3">
      <div className="text-xs text-[color:var(--muted)]">Recovery check</div>
      <MiniStats />
    </div>
  );
}
