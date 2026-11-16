import { describe, expect, it } from "vitest";
import { looksTechnical, toUserMessage, USER_ERRORS } from "./user-facing";

describe("user-facing errors", () => {
  it("flags config/engineer messages", () => {
    expect(looksTechnical("FIREBASE_SERVICE_ACCOUNT is required")).toBe(true);
    expect(looksTechnical("Add FIREBASE_SERVICE_ACCOUNT to .env.local")).toBe(
      true,
    );
    expect(looksTechnical("Session failed")).toBe(true);
    expect(looksTechnical("Unauthorized")).toBe(true);
    expect(looksTechnical("Database unavailable")).toBe(true);
    expect(looksTechnical("User not found")).toBe(true);
    expect(looksTechnical("Failed to load diet profile")).toBe(true);
    expect(looksTechnical("Update VAPID public key")).toBe(true);
    expect(looksTechnical("Missing idToken")).toBe(true);
    expect(looksTechnical("Dates must be YYYY-MM-DD.")).toBe(true);
    expect(looksTechnical("startDate must be <= endDate.")).toBe(true);
    expect(looksTechnical("No progress fields to update.")).toBe(true);
  });

  it("keeps product copy", () => {
    expect(looksTechnical(USER_ERRORS.emailInUse)).toBe(false);
    expect(looksTechnical(USER_ERRORS.dietNotConfigured)).toBe(false);
    expect(toUserMessage(USER_ERRORS.usernameInUse)).toBe(
      USER_ERRORS.usernameInUse,
    );
  });

  it("replaces technical Error messages", () => {
    expect(
      toUserMessage(
        new Error("Firebase Admin is not configured"),
        USER_ERRORS.unavailable,
      ),
    ).toBe(USER_ERRORS.unavailable);
  });
});
