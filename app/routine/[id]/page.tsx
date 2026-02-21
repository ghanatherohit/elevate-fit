import DashboardShell from "@/components/layout/DashboardShell";
import GlassCard from "@/components/shared/GlassCard";
import RoutineDetailLoader from "@/components/routine/RoutineDetailLoader";
import SectionHeader from "@/components/shared/SectionHeader";
import { routineItems } from "@/lib/data/routines";

type RoutineDetailProps = {
  params: { id: string };
};

export default function RoutineDetailPage({ params }: RoutineDetailProps) {
  const item = routineItems.find((entry) => entry.id === params.id);

  return (
    <DashboardShell>
      <SectionHeader title="Routine detail" action="Edit" />
      <GlassCard className="grid gap-4">
        <RoutineDetailLoader itemId={params.id} fallbackItem={item ?? null} />
      </GlassCard>
    </DashboardShell>
  );
}

