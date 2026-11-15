import { describe, expect, it } from "vitest";
import {
  deriveProgressFromChecklist,
  waterMlToGlasses,
} from "@/lib/progress/metrics";

describe("progress metrics", () => {
  it("derives routineDone when all tasks complete", () => {
    const result = deriveProgressFromChecklist({
      completedItemIds: ["a", "b"],
      tasksTotal: 2,
    });
    expect(result.routineDone).toBe(true);
    expect(result.tasksDone).toBe(2);
  });

  it("converts water ml to glasses", () => {
    expect(waterMlToGlasses(2000)).toBe(8);
    expect(waterMlToGlasses(null)).toBe(8);
  });
});
