import QuickStatRow from "@/components/dashboard/QuickStatRow";

export default function HeaderStats() {
  return (
    <div className="grid gap-3">
      <div className="text-xs text-muted">
        Balanced day for skin and hair
      </div>
      <QuickStatRow />
    </div>
  );
}


