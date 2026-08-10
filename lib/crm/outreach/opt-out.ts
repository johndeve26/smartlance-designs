import { createHash, randomBytes } from "node:crypto";
import { prisma } from "@/lib/db";
import {
  stopActiveEnrollmentsForContact,
} from "@/lib/crm/outreach/suppression";

export function createOutreachOptOutToken() {
  return randomBytes(32).toString("hex");
}

export function hashOutreachOptOutToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function ensureOutreachOptOutToken(contactId: string) {
  const existing = await prisma.crmOutreachOptOut.findUnique({
    where: { contactId },
  });
  if (existing) return null;

  const token = createOutreachOptOutToken();
  await prisma.crmOutreachOptOut.create({
    data: {
      contactId,
      tokenHash: hashOutreachOptOutToken(token),
    },
  });
  return token;
}

export async function processOutreachOptOut(token: string) {
  const hash = hashOutreachOptOutToken(token);
  const record = await prisma.crmOutreachOptOut.findUnique({
    where: { tokenHash: hash },
    include: { contact: true },
  });
  if (!record) {
    return { ok: false as const, code: "INVALID" as const };
  }

  await prisma.$transaction(async (tx) => {
    await tx.crmOutreachOptOut.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    });
    await tx.crmContact.update({
      where: { id: record.contactId },
      data: { emailStatus: "DO_NOT_EMAIL" },
    });
  });

  await stopActiveEnrollmentsForContact({
    contactId: record.contactId,
    reason: "OPT_OUT",
  });

  return { ok: true as const };
}

export async function getContactByOptOutToken(token: string) {
  const hash = hashOutreachOptOutToken(token);
  return prisma.crmOutreachOptOut.findUnique({
    where: { tokenHash: hash },
    include: {
      contact: { select: { id: true, email: true, displayName: true, firstName: true } },
    },
  });
}
