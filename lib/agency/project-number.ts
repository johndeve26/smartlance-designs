import type { PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/db";

function currentYear() {
  return new Date().getFullYear();
}

function formatProjectNumber(year: number, sequence: number) {
  return `SL-${year}-${String(sequence).padStart(4, "0")}`;
}

/**
 * Concurrency-safe project number generation using AgencyProjectCounter.
 */
export async function generateAgencyProjectNumber(
  db: Pick<PrismaClient, "agencyProjectCounter"> = prisma,
): Promise<string> {
  const year = currentYear();

  const counter = await db.agencyProjectCounter.upsert({
    where: { year },
    create: { year, lastNumber: 1 },
    update: { lastNumber: { increment: 1 } },
  });

  return formatProjectNumber(year, counter.lastNumber);
}
