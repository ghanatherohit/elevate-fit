import DashboardShell from "@/components/layout/DashboardShell";
import GlassCard from "@/components/shared/GlassCard";
import HealthPlanEditor from "@/components/health/HealthPlanEditor";
import SectionHeader from "@/components/shared/SectionHeader";

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

