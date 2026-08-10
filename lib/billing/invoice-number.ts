import type { PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/db";

const INVOICE_NUMBER_PATTERN = /^INV-(\d{4})-(\d+)$/;

function currentYear() {
  return new Date().getFullYear();
}

export function formatInvoiceNumber(year: number, sequence: number) {
  const width = Math.max(4, String(sequence).length);
  return `INV-${year}-${String(sequence).padStart(width, "0")}`;
}

export function parseInvoiceNumber(invoiceNumber: string) {
  const match = invoiceNumber.match(INVOICE_NUMBER_PATTERN);
  if (!match) return null;
  return { year: Number(match[1]), sequence: Number(match[2]) };
}

type CounterDb = Pick<PrismaClient, "$queryRaw">;

export async function generateAgencyInvoiceNumber(db: CounterDb = prisma) {
  const year = currentYear();
  const rows = await db.$queryRaw<{ lastNumber: number }[]>`
    INSERT INTO "AgencyInvoiceCounter" ("year", "lastNumber", "updatedAt")
    VALUES (${year}, 1, CURRENT_TIMESTAMP)
    ON CONFLICT ("year") DO UPDATE
    SET "lastNumber" = "AgencyInvoiceCounter"."lastNumber" + 1,
        "updatedAt" = CURRENT_TIMESTAMP
    RETURNING "lastNumber"
  `;
  const sequence = rows[0]?.lastNumber;
  if (!sequence || sequence < 1) {
    throw new Error("Failed to allocate invoice number.");
  }
  return formatInvoiceNumber(year, sequence);
}
