import { z } from "zod";

const USERNAME_REGEX = /^[a-z0-9_]{3,20}$/;

export const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(USERNAME_REGEX, {
    message: "Use 3-20 chars: lowercase letters, numbers, underscore.",
  });

export function normalizeUsername(value: string) {
  return value.trim().toLowerCase();
}

export function isUsernameValid(value: string) {
  return usernameSchema.safeParse(value).success;
}

export function getUsernameHint() {
  return "Use 3-20 chars: lowercase letters, numbers, underscore.";
}
