import type { PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/db";

const PROJECT_NUMBER_PATTERN = /^SL-(\d{4})-(\d+)$/;

function currentYear() {
  return new Date().getFullYear();
}

/** Format SL-YYYY-#### with minimum 4 digits; expands naturally beyond 9999. */
export function formatProjectNumber(year: number, sequence: number) {
  const width = Math.max(4, String(sequence).length);
  return `SL-${year}-${String(sequence).padStart(width, "0")}`;
}

export function parseProjectNumber(projectNumber: string): { year: number; sequence: number } | null {
  const match = projectNumber.match(PROJECT_NUMBER_PATTERN);
  if (!match) return null;
  return { year: Number(match[1]), sequence: Number(match[2]) };
}

type CounterDb = Pick<PrismaClient, "$queryRaw">;

/**
 * Atomically increment the yearly counter and return the next project number.
 * Uses PostgreSQL INSERT … ON CONFLICT for concurrency safety inside transactions.
 */
export async function generateAgencyProjectNumber(
  db: CounterDb = prisma,
): Promise<string> {
  const year = currentYear();

  const rows = await db.$queryRaw<{ lastNumber: number }[]>`
    INSERT INTO "AgencyProjectCounter" ("year", "lastNumber", "updatedAt")
    VALUES (${year}, 1, CURRENT_TIMESTAMP)
    ON CONFLICT ("year") DO UPDATE
    SET "lastNumber" = "AgencyProjectCounter"."lastNumber" + 1,
        "updatedAt" = CURRENT_TIMESTAMP
    RETURNING "lastNumber"
  `;

  const sequence = rows[0]?.lastNumber;
  if (!sequence || sequence < 1) {
    throw new Error("Failed to allocate agency project number.");
  }

  return formatProjectNumber(year, sequence);
}

/** Initialize counters from existing canonical project numbers (migration/backfill helper). */
export async function syncProjectCountersFromExisting(
  db: Pick<PrismaClient, "agencyProject" | "agencyProjectCounter"> = prisma,
) {
  const projects = await db.agencyProject.findMany({
    select: { projectNumber: true },
  });

  const maxByYear = new Map<number, number>();
  for (const { projectNumber } of projects) {
    const parsed = parseProjectNumber(projectNumber);
    if (!parsed) continue;
    const current = maxByYear.get(parsed.year) ?? 0;
    if (parsed.sequence > current) {
      maxByYear.set(parsed.year, parsed.sequence);
    }
  }

  for (const [year, lastNumber] of maxByYear) {
    await db.agencyProjectCounter.upsert({
      where: { year },
      create: { year, lastNumber },
      update: {
        lastNumber: { set: lastNumber },
      },
    });
  }

  return { years: maxByYear.size };
}
