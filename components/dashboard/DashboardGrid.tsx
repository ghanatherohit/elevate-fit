import DashboardCard from "./DashboardCard";

const dashboardItems = [
  { title: "Protein", value: "86g", note: "Target 120g" },
  { title: "Water", value: "2.1L", note: "Target 3L" },
  { title: "Steps", value: "6.8k", note: "Gentle day" },
  { title: "Sleep", value: "7h 10m", note: "On track" },
];

export default function DashboardGrid() {
  return (
    <div className="grid grid-cols-2 gap-3">
      {dashboardItems.map((item) => (
        <DashboardCard
          key={item.title}
          title={item.title}
          value={item.value}
          note={item.note}
        />
      ))}
    </div>
  );
}
