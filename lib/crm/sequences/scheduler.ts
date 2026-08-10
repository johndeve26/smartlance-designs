export {
  runSequenceSchedulerWithDeps,
  advanceEnrollmentAfterTask,
  type SchedulerRunResult,
} from "@/lib/crm/sequences/scheduler-runner";
export type { SchedulerDeps, SchedulerHooks } from "@/lib/crm/sequences/scheduler-deps";

import { runSequenceSchedulerWithDeps } from "@/lib/crm/sequences/scheduler-runner";

/** Production scheduler entry — uses default deps (real DB + mail transport). */
export async function runSequenceScheduler() {
  return runSequenceSchedulerWithDeps();
}
