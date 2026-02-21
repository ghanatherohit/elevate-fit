import SectionHeader from "@/components/shared/SectionHeader";
import DashboardGrid from "./DashboardGrid";

export default function DashboardSection() {
  return (
    <div className="grid gap-3">
      <SectionHeader title="Vitals" action="View" />
      <DashboardGrid />
    </div>
  );
}
