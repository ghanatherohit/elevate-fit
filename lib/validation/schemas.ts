import { z } from "zod";
import { usernameSchema } from "@/lib/validation/username";

const optionalNonEmptyUsername = z.preprocess(
  (value) => {
    if (typeof value !== "string") {
      return value;
    }
    const trimmed = value.trim();
    return trimmed.length ? trimmed : undefined;
  },
  usernameSchema.optional(),
);

const optionalTrimmedName = z.preprocess(
  (value) => {
    if (typeof value !== "string") {
      return value;
    }
    const trimmed = value.trim();
    return trimmed.length ? trimmed : undefined;
  },
  z.string().max(80, "Name must be 80 characters or fewer.").optional(),
);

const optionalPhotoUrl = z.preprocess(
  (value) => {
    if (typeof value !== "string") {
      return value;
    }
    const trimmed = value.trim();
    return trimmed.length ? trimmed : undefined;
  },
  z.url("Avatar URL must be a valid URL.").optional(),
);

export const authResolveSchema = z.object({
  identifier: z.string().trim().min(1, "Missing identifier"),
});

export const sessionRequestSchema = z.object({
  idToken: z.string().trim().min(1, "Missing idToken"),
  username: optionalNonEmptyUsername,
});

export const profileUpdateSchema = z.object({
  username: optionalNonEmptyUsername,
  name: optionalTrimmedName,
  photoURL: optionalPhotoUrl,
});

export const dietProfileSchema = z.object({
  age: z.coerce.number().int().min(14).max(90),
  sex: z.enum(["male", "female"]),
  heightCm: z.coerce.number().min(130).max(220),
  weightKg: z.coerce.number().min(35).max(200),
  activityLevel: z.enum(["sedentary", "light", "moderate", "active", "very-active"]),
  goal: z.enum(["fat-loss", "recomp", "muscle-gain", "maintenance"]),
});

export const loginInputSchema = z.object({
  identifier: z.string().trim().min(1, "Identifier is required"),
  password: z.string().min(1, "Password is required"),
});

export const registerInputSchema = z.object({
  username: usernameSchema,
  email: z.email("Enter a valid email address."),
  password: z.string().min(6, "Password must be at least 6 characters."),
});

export const profileFormSchema = z.object({
  username: optionalNonEmptyUsername,
  name: optionalTrimmedName,
  photoURL: optionalPhotoUrl,
});

export const routineChecklistUpdateSchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format."),
  itemId: z.string().trim().min(1, "Item id is required."),
  checked: z.boolean(),
});

const routineTaskItemSchema = z.object({
  id: z.string().trim().min(1, "Item id is required."),
  time: z.string().trim().min(1, "Time is required."),
  endTime: z.string().trim().optional(),
  title: z.string().trim().min(1, "Title is required."),
  highlight: z.boolean().optional(),
  type: z.enum(["recipe", "workout", "general"]),
  targetId: z.string().trim().optional(),
  notes: z.string().trim().min(1, "Notes is required."),
  alarmLabel: z.string().trim().min(1, "Alarm label is required."),
});

const tasksByDaySchema = z.object({
  monday: z.array(routineTaskItemSchema),
  tuesday: z.array(routineTaskItemSchema),
  wednesday: z.array(routineTaskItemSchema),
  thursday: z.array(routineTaskItemSchema),
  friday: z.array(routineTaskItemSchema),
  saturday: z.array(routineTaskItemSchema),
  sunday: z.array(routineTaskItemSchema),
});

export const routineTasksUpdateSchema = z.object({
  tasksByDay: tasksByDaySchema,
});

export const weeklyProgramPreferenceUpdateSchema = z.object({
  trackWeeklyProgram: z.boolean(),
  programType: z.literal("7-days-consistency").default("7-days-consistency"),
  startDate: z
    .string()
    .regex(/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/, "Date must be in YYYY-MM-DD format.")
    .optional(),
});

export const getFirstZodError = (error: z.ZodError) => {
  return error.issues[0]?.message || "Invalid input";
};
