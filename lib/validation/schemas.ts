import { z } from "zod";
import { isPasswordAcceptable } from "@/lib/validation/password";
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
    if (value === null) {
      return "";
    }
    if (typeof value !== "string") {
      return value;
    }
    return value.trim();
  },
  z.string().max(80, "Name must be 80 characters or fewer.").optional(),
);

const optionalPhotoUrl = z.preprocess(
  (value) => {
    if (value === null) {
      return null;
    }
    if (typeof value !== "string") {
      return value;
    }
    const trimmed = value.trim();
    return trimmed.length ? trimmed : null;
  },
  z.union([z.url("Avatar URL must be a valid URL."), z.null()]).optional(),
);

export const authResolveSchema = z.object({
  identifier: z
    .string()
    .trim()
    .min(1, "Enter your email or username."),
});

export const sessionRequestSchema = z.object({
  idToken: z
    .string()
    .trim()
    .min(1, "Sign-in expired. Please try again."),
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

export const registerInputSchema = z
  .object({
    username: usernameSchema,
    email: z
      .string()
      .trim()
      .toLowerCase()
      .pipe(z.email("Enter a valid email address.")),
    password: z.string().min(1, "Password is required."),
    confirmPassword: z.string().min(1, "Confirm your password."),
  })
  .refine((value) => isPasswordAcceptable(value.password), {
    message:
      "Password is too weak. Use 8+ characters with mixed letter cases.",
    path: ["password"],
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export const pushSubscriptionSchema = z.object({
  endpoint: z
    .string()
    .url("Invalid push endpoint")
    .refine(
      (value) => value.startsWith("https://"),
      "Push endpoint must be HTTPS",
    ),
  keys: z.object({
    p256dh: z.string().trim().min(1),
    auth: z.string().trim().min(1),
  }),
});

export const notificationPreferenceSchema = z.object({
  email: z.boolean(),
  push: z.boolean(),
  sms: z.boolean().optional().default(false),
});

export const reminderCreateSchema = z.object({
  title: z.string().trim().min(1).max(200),
  scheduledFor: z
    .string()
    .refine((value) => !Number.isNaN(Date.parse(value)), "Invalid schedule date"),
  channels: z
    .object({
      email: z.boolean().optional(),
      push: z.boolean().optional(),
      sms: z.boolean().optional(),
    })
    .optional(),
});

export const reminderUpdateSchema = z.object({
  id: z.string().trim().min(1),
  title: z.string().trim().min(1).max(200).optional(),
  scheduledFor: z
    .string()
    .refine((value) => !Number.isNaN(Date.parse(value)), "Invalid schedule date")
    .optional(),
});

export const recurringReminderCreateSchema = z.object({
  title: z.string().trim().min(1).max(200),
  frequency: z.enum(["daily", "weekly"]),
  time: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Time must be HH:MM"),
  daysOfWeek: z.array(z.number().int().min(0).max(6)).optional(),
  channels: z
    .object({
      email: z.boolean().optional(),
      push: z.boolean().optional(),
      sms: z.boolean().optional(),
    })
    .optional(),
});

export const recurringReminderUpdateSchema = z.object({
  id: z.string().trim().min(1),
  title: z.string().trim().min(1).max(200).optional(),
  frequency: z.enum(["daily", "weekly"]).optional(),
  time: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Time must be HH:MM")
    .optional(),
  daysOfWeek: z.array(z.number().int().min(0).max(6)).optional(),
  paused: z.boolean().optional(),
  channels: z
    .object({
      email: z.boolean().optional(),
      push: z.boolean().optional(),
      sms: z.boolean().optional(),
    })
    .optional(),
});

export const dateRangeQuerySchema = z.object({
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
});

/** Client + server profile payload — keep a single schema. */
export const profileFormSchema = profileUpdateSchema;

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
  return error.issues[0]?.message || "Please check your input and try again.";
};
