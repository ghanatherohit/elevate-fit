import { Schema, model, models } from "mongoose";

const routineChecklistSchema = new Schema(
  {
    uid: { type: String, required: true, index: true },
    date: { type: String, required: true, index: true },
    completedItemIds: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true },
);

routineChecklistSchema.index({ uid: 1, date: 1 }, { unique: true });

export const RoutineChecklist =
  models.RoutineChecklist || model("RoutineChecklist", routineChecklistSchema);
