import QuickChip from "./QuickChip";

const quickStats = [
  { label: "Sleep", value: "7h 10m" },
  { label: "Streak", value: "12 days" },
  { label: "Mood", value: "Calm" },
];

export default function QuickStatRow() {
  return (
    <div className="flex flex-wrap gap-2">
      {quickStats.map((item) => (
        <QuickChip key={item.label} label={item.label} value={item.value} />
      ))}
    </div>
  );
}
