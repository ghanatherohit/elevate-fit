import SectionHeader from "@/components/shared/SectionHeader";
import RecoveryPanel from "@/components/routine/RecoveryPanel";

export default function HealthPanel() {
  return (
    <div className="grid gap-3">
      <SectionHeader title="Skin & hair" action="Insights" />
      <RecoveryPanel />
    </div>
  );
}
