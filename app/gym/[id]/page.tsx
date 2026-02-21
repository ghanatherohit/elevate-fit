import DashboardShell from "@/components/layout/DashboardShell";
import GlassCard from "@/components/shared/GlassCard";
import WorkoutDetailClient from "@/components/workouts/WorkoutDetailClient";
import SectionHeader from "@/components/shared/SectionHeader";
import { workouts } from "@/lib/data/workouts";
import { notFound } from "next/navigation";

type WorkoutDetailProps = {
  params: { id: string };
};

export default function WorkoutDetailPage({ params }: WorkoutDetailProps) {
  const workout = workouts.find((entry) => entry.id === params.id);

  if (!workout) {
    notFound();
  }

  return (
    <DashboardShell>
      <SectionHeader title={workout.title} action={workout.duration} />
      <GlassCard className="grid gap-4">
        <WorkoutDetailClient workout={workout} />
      </GlassCard>
    </DashboardShell>
  );
}

