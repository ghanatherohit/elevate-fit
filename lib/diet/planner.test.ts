import { describe, expect, it } from "vitest";
import { calculateDietTargets } from "@/lib/diet/planner";

describe("calculateDietTargets", () => {
  it("computes higher calories for muscle-gain than fat-loss", () => {
    const base = {
      age: 28,
      sex: "male" as const,
      heightCm: 178,
      weightKg: 75,
      activityLevel: "moderate" as const,
    };

    const loss = calculateDietTargets({ ...base, goal: "fat-loss" });
    const gain = calculateDietTargets({ ...base, goal: "muscle-gain" });

    expect(gain.targetCalories).toBeGreaterThan(loss.targetCalories);
    expect(loss.proteinG).toBeGreaterThan(0);
    expect(loss.waterMl).toBeGreaterThan(0);
  });
});
