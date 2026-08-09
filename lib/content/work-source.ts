import { hasDatabaseUrl, prisma } from "@/lib/db";

const PHASE3_MARKER_ID = "phase3";

export class WorkDatabaseUnavailableError extends Error {
  constructor(cause?: unknown) {
    super("Work database unavailable");
    this.name = "WorkDatabaseUnavailableError";
    this.cause = cause;
  }
}

export type WorkContentRuntime = "typed-fallback" | "database";

/**
 * Resolves whether public Work content should use typed seed data or the database.
 *
 * Typed fallback is allowed only when:
 * - `DATABASE_URL` is absent, or
 * - verified pre-import state (no Phase 3 marker and zero published Work rows)
 *
 * Throws `WorkDatabaseUnavailableError` on probe failures — never falls back to
 * typed content when the database is expected but unreachable.
 */
export async function resolveWorkContentRuntime(): Promise<WorkContentRuntime> {
  if (!hasDatabaseUrl()) return "typed-fallback";

  try {
    const marker = await prisma.contentImportMarker.findUnique({
      where: { id: PHASE3_MARKER_ID },
      select: { id: true },
    });
    if (marker) return "database";

    const publishedCount = await prisma.workProject.count({
      where: { status: "PUBLISHED" },
    });
    return publishedCount > 0 ? "database" : "typed-fallback";
  } catch (error) {
    console.error("[work-source] authority probe failed", error);
    throw new WorkDatabaseUnavailableError(error);
  }
}

/** @deprecated Prefer `resolveWorkContentRuntime()` for explicit fail-closed handling. */
export async function isWorkDatabaseAuthoritative(): Promise<boolean> {
  const runtime = await resolveWorkContentRuntime();
  return runtime === "database";
}
