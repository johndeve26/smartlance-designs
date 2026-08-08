import { prisma, hasDatabaseUrl } from "@/lib/db";

/**
 * Mark RUNNING jobs older than threshold as FAILED (TIMEOUT / STALE_JOB).
 * Prevents projects stuck forever after serverless/request death.
 */
export async function recoverStaleAiJobs(staleMinutes = 30): Promise<number> {
  if (!hasDatabaseUrl()) return 0;
  const cutoff = new Date(Date.now() - Math.max(5, staleMinutes) * 60_000);
  const result = await prisma.aIEditorialRun.updateMany({
    where: {
      status: "RUNNING",
      startedAt: { lt: cutoff },
    },
    data: {
      status: "FAILED",
      completedAt: new Date(),
      errorCode: "TIMEOUT",
      errorSummary: "Job marked stale after exceeding running time threshold.",
    },
  });
  return result.count;
}

export async function countPendingAiJobs() {
  if (!hasDatabaseUrl()) return { queued: 0, running: 0, staleRecovered: 0 };
  const [queued, running] = await Promise.all([
    prisma.aIEditorialRun.count({ where: { status: "QUEUED" } }),
    prisma.aIEditorialRun.count({ where: { status: "RUNNING" } }),
  ]);
  return { queued, running, staleRecovered: 0 };
}
