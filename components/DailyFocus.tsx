import SectionHeader from "./SectionHeader";
import FocusGrid from "./FocusGrid";

export default function DailyFocus() {
  return (
    <div className="grid gap-3">
      <SectionHeader title="Daily focus" action="View" />
      <FocusGrid />
    </div>
  );
}
