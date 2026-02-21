import SectionHeader from "@/components/shared/SectionHeader";
import FocusGrid from "./FocusGrid";

export default function DailyFocus() {
  return (
    <div className="grid gap-3">
      <SectionHeader title="Daily focus" action="View" />
      <FocusGrid />
    </div>
  );
}
