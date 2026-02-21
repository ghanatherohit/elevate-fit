import mongoose, { Schema } from "mongoose";

type WeeklyProgramPreferenceDocument = {
  uid: string;
  trackWeeklyProgram: boolean;
  programType: "7-days-consistency";
  startDate?: Date;
  createdAt: Date;
  updatedAt: Date;
};

const WeeklyProgramPreferenceSchema =
  new Schema<WeeklyProgramPreferenceDocument>(
    {
      uid: { type: String, required: true, unique: true },
      trackWeeklyProgram: { type: Boolean, required: true },
      programType: {
        type: String,
        enum: ["7-days-consistency"],
        default: "7-days-consistency",
      },
      startDate: { type: Date },
    },
    { timestamps: true },
  );

export const WeeklyProgramPreference =
  mongoose.models.WeeklyProgramPreference ||
  mongoose.model<WeeklyProgramPreferenceDocument>(
    "WeeklyProgramPreference",
    WeeklyProgramPreferenceSchema,
  );
