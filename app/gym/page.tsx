import DashboardShell from "@/components/layout/DashboardShell";
import GymClient from "@/components/workouts/GymClient";

export default function GymPage() {
  return (
    <DashboardShell>
      <GymClient />
    </DashboardShell>
  );
}

