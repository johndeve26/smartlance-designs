import { describe, expect, it } from "vitest";
import {
  calculateTaskProgress,
  calculateTaskProgressPercent,
} from "@/lib/agency/progress";

describe("agency task progress", () => {
  it("returns 0% when there are no tasks", () => {
    expect(calculateTaskProgressPercent([])).toBe(0);
    expect(calculateTaskProgress([])).toEqual({ done: 0, total: 0, percent: 0 });
  });

  it("calculates completion as done / total tasks", () => {
    const tasks = [
      { status: "DONE" as const },
      { status: "DONE" as const },
      { status: "TODO" as const },
      { status: "IN_PROGRESS" as const },
      { status: "BLOCKED" as const },
    ];
    expect(calculateTaskProgressPercent(tasks)).toBe(40);
    expect(calculateTaskProgress(tasks)).toEqual({ done: 2, total: 5, percent: 40 });
  });

  it("rounds to nearest whole percent", () => {
    const tasks = [
      { status: "DONE" as const },
      { status: "TODO" as const },
      { status: "TODO" as const },
    ];
    expect(calculateTaskProgressPercent(tasks)).toBe(33);
  });
});
