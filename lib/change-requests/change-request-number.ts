import type { PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/db";

const CHANGE_REQUEST_NUMBER_PATTERN = /^CR-(\d{4})-(\d+)$/;

function currentYear() {
  return new Date().getFullYear();
}

export function formatChangeRequestNumber(year: number, sequence: number) {
  const width = Math.max(4, String(sequence).length);
  return `CR-${year}-${String(sequence).padStart(width, "0")}`;
}

export function parseChangeRequestNumber(
  changeRequestNumber: string,
): { year: number; sequence: number } | null {
  const match = changeRequestNumber.match(CHANGE_REQUEST_NUMBER_PATTERN);
  if (!match) return null;
  return { year: Number(match[1]), sequence: Number(match[2]) };
}

type CounterDb = Pick<PrismaClient, "$queryRaw">;

export async function generateAgencyChangeRequestNumber(
  db: CounterDb = prisma,
): Promise<string> {
  const year = currentYear();

  const rows = await db.$queryRaw<{ lastNumber: number }[]>`
    INSERT INTO "AgencyChangeRequestCounter" ("year", "lastNumber", "updatedAt")
    VALUES (${year}, 1, CURRENT_TIMESTAMP)
    ON CONFLICT ("year") DO UPDATE
    SET "lastNumber" = "AgencyChangeRequestCounter"."lastNumber" + 1,
        "updatedAt" = CURRENT_TIMESTAMP
    RETURNING "lastNumber"
  `;

  const sequence = rows[0]?.lastNumber;
  if (!sequence || sequence < 1) {
    throw new Error("Failed to allocate change request number.");
  }

  return formatChangeRequestNumber(year, sequence);
}
