import { describe, expect, it } from "vitest";
import {
  getDayNameFromDateKey,
  shiftDateKey,
  toIstDateKey,
} from "@/lib/datetime/ist";

describe("ist helpers", () => {
  it("shifts date keys across month boundaries", () => {
    expect(shiftDateKey("2026-01-31", 1)).toBe("2026-02-01");
    expect(shiftDateKey("2026-03-01", -1)).toBe("2026-02-28");
  });

  it("returns a weekday for a date key", () => {
    const day = getDayNameFromDateKey("2026-11-15");
    expect([
      "sunday",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
    ]).toContain(day);
  });

  it("formats current IST date key", () => {
    expect(toIstDateKey()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
