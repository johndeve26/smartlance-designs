import type { PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/db";

const PROPOSAL_NUMBER_PATTERN = /^PR-(\d{4})-(\d+)$/;

function currentYear() {
  return new Date().getFullYear();
}

/** Format PR-YYYY-#### with minimum 4 digits; expands naturally beyond 9999. */
export function formatProposalNumber(year: number, sequence: number) {
  const width = Math.max(4, String(sequence).length);
  return `PR-${year}-${String(sequence).padStart(width, "0")}`;
}

export function parseProposalNumber(proposalNumber: string): { year: number; sequence: number } | null {
  const match = proposalNumber.match(PROPOSAL_NUMBER_PATTERN);
  if (!match) return null;
  return { year: Number(match[1]), sequence: Number(match[2]) };
}

type CounterDb = Pick<PrismaClient, "$queryRaw">;

export async function generateAgencyProposalNumber(
  db: CounterDb = prisma,
): Promise<string> {
  const year = currentYear();

  const rows = await db.$queryRaw<{ lastNumber: number }[]>`
    INSERT INTO "AgencyProposalCounter" ("year", "lastNumber", "updatedAt")
    VALUES (${year}, 1, CURRENT_TIMESTAMP)
    ON CONFLICT ("year") DO UPDATE
    SET "lastNumber" = "AgencyProposalCounter"."lastNumber" + 1,
        "updatedAt" = CURRENT_TIMESTAMP
    RETURNING "lastNumber"
  `;

  const sequence = rows[0]?.lastNumber;
  if (!sequence || sequence < 1) {
    throw new Error("Failed to allocate agency proposal number.");
  }

  return formatProposalNumber(year, sequence);
}
