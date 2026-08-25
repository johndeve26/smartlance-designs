import { CRM_BULK_MAX_IDS } from "@/lib/crm/constants";

export type BulkItemFailure = { id: string; reason: string };

export type BulkMutationResult = {
  updated: number;
  deleted: number;
  failed: BulkItemFailure[];
};

export function emptyBulkResult(): BulkMutationResult {
  return { updated: 0, deleted: 0, failed: [] };
}

export function clampBulkIds(ids: string[]): string[] {
  const unique = [...new Set(ids.filter(Boolean))];
  return unique.slice(0, CRM_BULK_MAX_IDS);
}

export function formatBulkResultMessage(
  result: BulkMutationResult,
  noun: string,
): string {
  const parts: string[] = [];
  if (result.updated > 0) parts.push(`Updated ${result.updated} ${noun}`);
  if (result.deleted > 0) parts.push(`Deleted ${result.deleted} ${noun}`);
  if (result.failed.length) {
    const sample = result.failed
      .slice(0, 3)
      .map((f) => f.reason)
      .join("; ");
    parts.push(
      `Failed ${result.failed.length}${sample ? `: ${sample}` : ""}`,
    );
  }
  if (!parts.length) return "No changes.";
  return parts.join(". ") + ".";
}

export function isBulkSuccess(result: BulkMutationResult): boolean {
  return result.failed.length === 0 && (result.updated > 0 || result.deleted > 0);
}

/** Prisma P2003 / restrict FK deletes — surface a readable reason. */
export function friendlyDeleteError(err: unknown): string {
  const code = (err as { code?: string })?.code;
  const message = err instanceof Error ? err.message : String(err);
  if (code === "P2003" || /foreign key|restrict|still referenced/i.test(message)) {
    return "Linked to a project, proposal, or other record that blocks delete";
  }
  if (code === "P2025") return "Record not found";
  return message.slice(0, 160) || "Delete failed";
}
