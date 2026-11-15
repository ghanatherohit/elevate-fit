import { Schema, model, models } from "mongoose";

const dailyProgressSchema = new Schema(
  {
    uid: { type: String, required: true, index: true },
    date: { type: String, required: true, index: true },
    tasksDone: { type: Number, default: 0 },
    tasksTotal: { type: Number, default: 0 },
    routineDone: { type: Boolean, default: false },
    workoutDone: { type: Boolean, default: false },
    water: { type: Number, default: 0 },
  },
  { timestamps: true },
);

dailyProgressSchema.index({ uid: 1, date: 1 }, { unique: true });

export const DailyProgress =
  models.DailyProgress || model("DailyProgress", dailyProgressSchema);
