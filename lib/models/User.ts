import mongoose, { Schema } from "mongoose";

type UserDocument = {
  uid: string;
  username?: string | null;
  email?: string | null;
  name?: string | null;
  photoURL?: string | null;
  dietProfile?: {
    age: number;
    sex: "male" | "female";
    heightCm: number;
    weightKg: number;
    activityLevel: "sedentary" | "light" | "moderate" | "active" | "very-active";
    goal: "fat-loss" | "recomp" | "muscle-gain" | "maintenance";
  } | null;
  dietTargets?: {
    bmr: number;
    tdee: number;
    targetCalories: number;
    proteinG: number;
    carbsG: number;
    fatG: number;
    fiberG: number;
    waterMl: number;
  } | null;
  dietProfileCompletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

const UserSchema = new Schema<UserDocument>(
  {
    uid: { type: String, required: true, unique: true },
    username: { type: String, unique: true, sparse: true },
    email: { type: String },
    name: { type: String },
    photoURL: { type: String },
    dietProfile: {
      type: {
        age: { type: Number },
        sex: { type: String, enum: ["male", "female"] },
        heightCm: { type: Number },
        weightKg: { type: Number },
        activityLevel: {
          type: String,
          enum: ["sedentary", "light", "moderate", "active", "very-active"],
        },
        goal: {
          type: String,
          enum: ["fat-loss", "recomp", "muscle-gain", "maintenance"],
        },
      },
      default: null,
    },
    dietTargets: {
      type: {
        bmr: { type: Number },
        tdee: { type: Number },
        targetCalories: { type: Number },
        proteinG: { type: Number },
        carbsG: { type: Number },
        fatG: { type: Number },
        fiberG: { type: Number },
        waterMl: { type: Number },
      },
      default: null,
    },
    dietProfileCompletedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

export const User =
  mongoose.models.User || mongoose.model<UserDocument>("User", UserSchema);
