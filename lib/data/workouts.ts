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
  {
    id: "legs-day",
    title: "Legs day",
    duration: "50 mins",
    focus: "Quads, hamstrings, glutes, calves",
    exercises: [
      "Back squat 4 x 8",
      "Romanian deadlift 3 x 10",
      "Walking lunges 3 x 12 each leg",
      "Leg curl 3 x 12",
      "Standing calf raises 4 x 15",
    ],
  },
  {
    id: "active-recovery-day",
    title: "Active recovery day",
    duration: "30 mins",
    focus: "Mobility, posture, circulation",
    exercises: [
      "Brisk walk 15-20 mins",
      "Hip mobility flow 5 mins",
      "Thoracic openers 5 mins",
      "Hamstring + calf stretch 5 mins",
    ],
  },
  {
    id: "upper-strength-day",
    title: "Upper strength day",
    duration: "50 mins",
    focus: "Heavy upper-body compounds",
    exercises: [
      "Incline bench press 4 x 6",
      "Weighted pull-up or pulldown 4 x 6-8",
      "Overhead press 3 x 8",
      "Chest-supported row 3 x 10",
      "Tricep pressdown + hammer curls 3 x 12",
    ],
  },
  {
    id: "lower-core-day",
    title: "Lower + core day",
    duration: "50 mins",
    focus: "Lower-body support and trunk stability",
    exercises: [
      "Front squat 3 x 8",
      "Hip thrust 4 x 10",
      "Bulgarian split squat 3 x 10 each leg",
      "Plank 3 x 60 sec",
      "Hanging knee raises 3 x 12",
    ],
  },
];
