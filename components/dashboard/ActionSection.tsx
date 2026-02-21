import SectionHeader from "@/components/shared/SectionHeader";
import DashboardActions from "./DashboardActions";

export default function ActionSection() {
  return (
    <div className="grid gap-3">
      <SectionHeader title="Quick actions" action="Customize" />
      <DashboardActions />
    </div>
  );
}
