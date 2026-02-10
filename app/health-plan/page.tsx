import DashboardShell from "@/components/DashboardShell";
import GlassCard from "@/components/GlassCard";
import HealthPlanEditor from "@/components/HealthPlanEditor";
import SectionHeader from "@/components/SectionHeader";

export default function HealthPlanPage() {
  return (
    <DashboardShell>
      <SectionHeader title="Health plan" action="Custom" />
      <GlassCard className="grid gap-4">
        <HealthPlanEditor />
      </GlassCard>
    </DashboardShell>
  );
}
