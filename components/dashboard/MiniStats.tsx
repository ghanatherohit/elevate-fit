import StatPill from "./StatPill";

const statItems = [
  { label: "Acne calm", value: "Good" },
  { label: "Hair fall", value: "Stable" },
];

export default function MiniStats() {
  return (
    <div className="grid gap-3">
      {statItems.map((item) => (
        <StatPill key={item.label} label={item.label} value={item.value} />
      ))}
    </div>
  );
}
