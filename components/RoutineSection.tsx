import GlassCard from "./GlassCard";
import RoutineHeader from "./RoutineHeader";
import RoutineListClient from "./RoutineListClient";

export default function RoutineSection() {
  return (
    <GlassCard className="flex flex-col gap-4">
      <RoutineHeader title="Morning routine" subtitle="Mon - Sat" />
      <RoutineListClient />
    </GlassCard>
  );
}
