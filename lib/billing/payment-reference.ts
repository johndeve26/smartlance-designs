import type { PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/db";

function currentYear() {
  return new Date().getFullYear();
}

export function formatPaymentReference(year: number, sequence: number) {
  const width = Math.max(4, String(sequence).length);
  return `PAY-${year}-${String(sequence).padStart(width, "0")}`;
}

type CounterDb = Pick<PrismaClient, "$queryRaw">;

export async function generatePaymentReference(db: CounterDb = prisma) {
  const year = currentYear();
  const rows = await db.$queryRaw<{ lastNumber: number }[]>`
    INSERT INTO "AgencyPaymentCounter" ("year", "lastNumber", "updatedAt")
    VALUES (${year}, 1, CURRENT_TIMESTAMP)
    ON CONFLICT ("year") DO UPDATE
    SET "lastNumber" = "AgencyPaymentCounter"."lastNumber" + 1,
        "updatedAt" = CURRENT_TIMESTAMP
    RETURNING "lastNumber"
  `;
  const sequence = rows[0]?.lastNumber;
  if (!sequence || sequence < 1) {
    throw new Error("Failed to allocate payment reference.");
  }
  return formatPaymentReference(year, sequence);
}
