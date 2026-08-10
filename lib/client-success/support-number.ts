import type { PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/db";

const SUPPORT_NUMBER_PATTERN = /^SUP-(\d{4})-(\d+)$/;

function currentYear() {
  return new Date().getFullYear();
}

export function formatSupportNumber(year: number, sequence: number) {
  const width = Math.max(4, String(sequence).length);
  return `SUP-${year}-${String(sequence).padStart(width, "0")}`;
}

export function parseSupportNumber(supportNumber: string) {
  const match = supportNumber.match(SUPPORT_NUMBER_PATTERN);
  if (!match) return null;
  return { year: Number(match[1]), sequence: Number(match[2]) };
}

type CounterDb = Pick<PrismaClient, "$queryRaw">;

export async function generateSupportRequestNumber(db: CounterDb = prisma): Promise<string> {
  const year = currentYear();
  const rows = await db.$queryRaw<{ lastNumber: number }[]>`
    INSERT INTO "AgencySupportRequestCounter" ("year", "lastNumber", "updatedAt")
    VALUES (${year}, 1, CURRENT_TIMESTAMP)
    ON CONFLICT ("year") DO UPDATE
    SET "lastNumber" = "AgencySupportRequestCounter"."lastNumber" + 1,
        "updatedAt" = CURRENT_TIMESTAMP
    RETURNING "lastNumber"
  `;
  const sequence = rows[0]?.lastNumber;
  if (!sequence || sequence < 1) {
    throw new Error("Failed to allocate support request number.");
  }
  return formatSupportNumber(year, sequence);
}
