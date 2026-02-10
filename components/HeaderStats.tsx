import QuickStatRow from "./QuickStatRow";

export default function HeaderStats() {
  return (
    <div className="grid gap-3">
      <div className="text-xs text-[color:var(--muted)]">
        Balanced day for skin and hair
      </div>
      <QuickStatRow />
    </div>
  );
}
