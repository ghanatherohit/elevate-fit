import FocusCard from "./FocusCard";

const focusItems = [
  {
    title: "Skin calm",
    detail: "Low glycemic meals, hydrate every 2 hours.",
  },
  {
    title: "Hair strength",
    detail: "Iron + omega boost after breakfast.",
  },
  {
    title: "Gym readiness",
    detail: "Pre-workout snack 40 min before.",
  },
];

export default function FocusGrid() {
  return (
    <div className="grid gap-3">
      {focusItems.map((item) => (
        <FocusCard key={item.title} title={item.title} detail={item.detail} />
      ))}
    </div>
  );
}
