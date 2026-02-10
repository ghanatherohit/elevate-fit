import ActionButton from "./ActionButton";

const actions = [
  { label: "Log protein shake", note: "25g" },
  { label: "Add water", note: "+250ml" },
];

export default function DashboardActions() {
  return (
    <div className="grid gap-2">
      {actions.map((action) => (
        <ActionButton
          key={action.label}
          label={action.label}
          note={action.note}
        />
      ))}
    </div>
  );
}
