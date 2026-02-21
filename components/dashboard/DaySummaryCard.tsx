import GlassCard from "@/components/shared/GlassCard";
import DaySummary from "./DaySummary";

export default function DaySummaryCard() {
  return (
    <GlassCard className="flex flex-col gap-4">
      <DaySummary />
    </GlassCard>
  );
}
