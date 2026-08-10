import type { PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/db";

const CONTRACT_NUMBER_PATTERN = /^CT-(\d{4})-(\d+)$/;

function currentYear() {
  return new Date().getFullYear();
}

export function formatContractNumber(year: number, sequence: number) {
  const width = Math.max(4, String(sequence).length);
  return `CT-${year}-${String(sequence).padStart(width, "0")}`;
}

export function parseContractNumber(contractNumber: string) {
  const match = contractNumber.match(CONTRACT_NUMBER_PATTERN);
  if (!match) return null;
  return { year: Number(match[1]), sequence: Number(match[2]) };
}

type CounterDb = Pick<PrismaClient, "$queryRaw">;

export async function generateAgencyContractNumber(db: CounterDb = prisma) {
  const year = currentYear();
  const rows = await db.$queryRaw<{ lastNumber: number }[]>`
    INSERT INTO "AgencyContractCounter" ("year", "lastNumber", "updatedAt")
    VALUES (${year}, 1, CURRENT_TIMESTAMP)
    ON CONFLICT ("year") DO UPDATE
    SET "lastNumber" = "AgencyContractCounter"."lastNumber" + 1,
        "updatedAt" = CURRENT_TIMESTAMP
    RETURNING "lastNumber"
  `;
  const sequence = rows[0]?.lastNumber;
  if (!sequence || sequence < 1) {
    throw new Error("Failed to allocate agency contract number.");
  }
  return formatContractNumber(year, sequence);
}
