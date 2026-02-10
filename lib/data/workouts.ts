export type Workout = {
  id: string;
  title: string;
  duration: string;
  focus: string;
  exercises: string[];
};

export const workouts: Workout[] = [
  {
    id: "push-day",
    title: "Push day",
    duration: "45 mins",
    focus: "Chest, shoulders, triceps",
    exercises: [
      "Bench press 3 x 10",
      "Shoulder press 3 x 12",
      "Tricep dips 3 x 15",
      "Cable fly 3 x 12",
    ],
  },
  {
    id: "pull-day",
    title: "Pull day",
    duration: "40 mins",
    focus: "Back, biceps",
    exercises: [
      "Lat pulldown 3 x 12",
      "Seated row 3 x 12",
      "Face pulls 3 x 15",
      "Bicep curls 3 x 12",
    ],
  },
];
