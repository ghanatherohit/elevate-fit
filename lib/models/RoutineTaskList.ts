import mongoose, { Schema } from "mongoose";

type RoutineTaskDocument = {
  id: string;
  time: string;
  endTime?: string;
  title: string;
  highlight?: boolean;
  type: "recipe" | "workout" | "general";
  targetId?: string;
  notes: string;
  alarmLabel: string;
};

type TasksByDay = {
  monday: RoutineTaskDocument[];
  tuesday: RoutineTaskDocument[];
  wednesday: RoutineTaskDocument[];
  thursday: RoutineTaskDocument[];
  friday: RoutineTaskDocument[];
  saturday: RoutineTaskDocument[];
  sunday: RoutineTaskDocument[];
};

type RoutineTaskListDocument = {
  uid: string;
  tasksByDay: TasksByDay;
  createdAt: Date;
  updatedAt: Date;
};

const RoutineTaskSchema = new Schema<RoutineTaskDocument>(
  {
    id: { type: String, required: true },
    time: { type: String, required: true },
    endTime: { type: String },
    title: { type: String, required: true },
    highlight: { type: Boolean, default: false },
    type: { type: String, enum: ["recipe", "workout", "general"], required: true },
    targetId: { type: String },
    notes: { type: String, required: true },
    alarmLabel: { type: String, required: true },
  },
  { _id: false },
);

const RoutineTaskListSchema = new Schema<RoutineTaskListDocument>(
  {
    uid: { type: String, required: true, unique: true },
    tasksByDay: {
      type: {
        monday: { type: [RoutineTaskSchema], default: [] },
        tuesday: { type: [RoutineTaskSchema], default: [] },
        wednesday: { type: [RoutineTaskSchema], default: [] },
        thursday: { type: [RoutineTaskSchema], default: [] },
        friday: { type: [RoutineTaskSchema], default: [] },
        saturday: { type: [RoutineTaskSchema], default: [] },
        sunday: { type: [RoutineTaskSchema], default: [] },
      },
      default: () => ({
        monday: [],
        tuesday: [],
        wednesday: [],
        thursday: [],
        friday: [],
        saturday: [],
        sunday: [],
      }),
    },
  },
  { timestamps: true },
);

export const RoutineTaskList =
  mongoose.models.RoutineTaskList ||
  mongoose.model<RoutineTaskListDocument>("RoutineTaskList", RoutineTaskListSchema);
