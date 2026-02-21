import { routineItems } from "@/lib/data/routines";
import RoutineItem from "./RoutineItem";

export default function RoutineList() {
  return (
    <div className="grid gap-3">
      {routineItems.map((item) => (
        <RoutineItem
          key={item.title}
          time={item.time}
          title={item.title}
          highlight={item.highlight}
          href={`/routine/${item.id}`}
        />
      ))}
    </div>
  );
}
