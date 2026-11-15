import { describe, expect, it } from "vitest";
import { classifyTasksByDay } from "@/lib/routine/tasks";

describe("classifyTasksByDay", () => {
  it("places daily tasks on every weekday", () => {
    const result = classifyTasksByDay([
      {
        id: "1",
        time: "07:00",
        title: "Wake",
        type: "general",
        notes: "n",
        alarmLabel: "a",
        meta: "Daily",
      },
    ]);

    expect(result.monday).toHaveLength(1);
    expect(result.sunday).toHaveLength(1);
  });

  it("places monday-only tasks on monday", () => {
    const result = classifyTasksByDay([
      {
        id: "2",
        time: "08:00",
        title: "Legs",
        type: "workout",
        notes: "n",
        alarmLabel: "a",
        meta: "Monday",
      },
    ]);

    expect(result.monday).toHaveLength(1);
    expect(result.tuesday).toHaveLength(0);
  });
});
