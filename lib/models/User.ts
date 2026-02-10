import mongoose, { Schema } from "mongoose";

type UserDocument = {
  uid: string;
  username?: string | null;
  email?: string | null;
  name?: string | null;
  photoURL?: string | null;
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
  },
  { timestamps: true },
);

export const User =
  mongoose.models.User || mongoose.model<UserDocument>("User", UserSchema);
