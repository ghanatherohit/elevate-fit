import TimeCard from "./TimeCard";

export default function AlarmSection() {
  return (
    <div className="grid gap-3">
      <TimeCard time="5:30 AM" label="Wake up" />
    </div>
  );
}
