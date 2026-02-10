import SummaryCard from "./SummaryCard";

const summaryItems = [
  { title: "Protein", value: "86g / 120g", note: "Post-workout shake next" },
  { title: "Water", value: "2.1L / 3L", note: "Smooth skin hydration" },
];

export default function SummaryGrid() {
  return (
    <div className="grid grid-cols-2 gap-3">
      {summaryItems.map((item) => (
        <SummaryCard
          key={item.title}
          title={item.title}
          value={item.value}
          note={item.note}
        />
      ))}
    </div>
  );
}
