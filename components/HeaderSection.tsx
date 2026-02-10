import HeaderBar from "./HeaderBar";
import HeaderStats from "./HeaderStats";

export default function HeaderSection() {
  return (
    <div className="grid gap-4">
      <HeaderBar greeting="Good morning" name="Rohit" />
      <HeaderStats />
    </div>
  );
}
