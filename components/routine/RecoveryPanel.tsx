import MiniStats from "@/components/dashboard/MiniStats";

export default function RecoveryPanel() {
  return (
    <div className="grid gap-3">
      <div className="text-xs text-muted">Recovery check</div>
      <MiniStats />
    </div>
  );
}


