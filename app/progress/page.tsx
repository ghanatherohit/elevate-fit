import DashboardShell from "@/components/layout/DashboardShell";
import ProgressClientLazy from "@/components/progress/ProgressClientLazy";

export default function ProgressPage() {
  return (
    <DashboardShell>
      <ProgressClientLazy />
    </DashboardShell>
  );
}
