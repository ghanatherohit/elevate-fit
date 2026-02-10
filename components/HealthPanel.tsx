import SectionHeader from "./SectionHeader";
import RecoveryPanel from "./RecoveryPanel";

export default function HealthPanel() {
  return (
    <div className="grid gap-3">
      <SectionHeader title="Skin & hair" action="Insights" />
      <RecoveryPanel />
    </div>
  );
}
