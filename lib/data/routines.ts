export type RoutineLinkType = "recipe" | "workout" | "general";

export type RoutineItem = {
  id: string;
  time: string;
  title: string;
  meta: string;
  highlight?: boolean;
  type: RoutineLinkType;
  targetId?: string;
  notes: string;
  alarmLabel: string;
};

export const routineItems: RoutineItem[] = [
  {
    id: "wake-water",
    time: "5:30 AM",
    title: "Wake up + detox water",
    meta: "2 mins",
    type: "general",
    notes: "Start with warm water and a slow inhale to ease cortisol.",
    alarmLabel: "Wake alarm",
  },
  {
    id: "gym-warmup",
    time: "6:15 AM",
    title: "Gym warm-up",
    meta: "15 mins",
    highlight: true,
    type: "workout",
    targetId: "push-day",
    notes: "Mobility flow + light sets before main lifts.",
    alarmLabel: "Gym alarm",
  },
  {
    id: "post-workout-protein",
    time: "7:30 AM",
    title: "Post-workout protein",
    meta: "25g",
    type: "recipe",
    targetId: "protein-shake",
    notes: "Blend within 30 minutes to support recovery.",
    alarmLabel: "Recovery alarm",
  },
  {
    id: "breakfast",
    time: "8:15 AM",
    title: "Breakfast",
    meta: "Anti-inflammatory",
    type: "recipe",
    targetId: "veggie-oats",
    notes: "Aim for fiber + protein to keep skin calm.",
    alarmLabel: "Breakfast alarm",
  },
];
