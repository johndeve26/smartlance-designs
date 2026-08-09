import type { AgencyProjectTaskStatus } from "@prisma/client";

const DONE_STATUS: AgencyProjectTaskStatus = "DONE";

export type TaskProgressInput = {
  status: AgencyProjectTaskStatus;
};

/**
 * Task completion percentage: done / total non-cancelled tasks.
 * Agency tasks have no cancelled status; all tasks count toward total.
 */
export function calculateTaskProgressPercent(tasks: TaskProgressInput[]): number {
  if (tasks.length === 0) return 0;
  const done = tasks.filter((t) => t.status === DONE_STATUS).length;
  return Math.round((done / tasks.length) * 100);
}

export function calculateTaskProgress(tasks: TaskProgressInput[]) {
  const total = tasks.length;
  const done = tasks.filter((t) => t.status === DONE_STATUS).length;
  return {
    done,
    total,
    percent: calculateTaskProgressPercent(tasks),
  };
}
