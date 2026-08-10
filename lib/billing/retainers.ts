import { prisma } from "@/lib/db";
import { recordBillingActivity } from "@/lib/billing/activity";
import { issueInvoice, createManualInvoice } from "@/lib/billing/invoices";

function addMonths(date: Date, months: number) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

function addInterval(date: Date, interval: "MONTHLY" | "QUARTERLY" | "YEARLY") {
  if (interval === "MONTHLY") return addMonths(date, 1);
  if (interval === "QUARTERLY") return addMonths(date, 3);
  return addMonths(date, 12);
}

export async function createRetainer(input: {
  companyId: string;
  primaryContactId?: string | null;
  projectId?: string | null;
  contractId?: string | null;
  name: string;
  description?: string | null;
  currency: string;
  amountMinor: number;
  billingInterval: "MONTHLY" | "QUARTERLY" | "YEARLY";
  lineItemDescription: string;
  startDate: Date;
  endDate?: Date | null;
  paymentTermsDays?: number;
  issueMode?: "CREATE_DRAFT" | "AUTO_ISSUE";
  ownerId: string;
  createdById: string;
}) {
  return prisma.agencyRetainer.create({
    data: {
      companyId: input.companyId,
      primaryContactId: input.primaryContactId ?? null,
      projectId: input.projectId ?? null,
      contractId: input.contractId ?? null,
      name: input.name.trim(),
      description: input.description?.trim() || null,
      currency: input.currency.toUpperCase(),
      amountMinor: input.amountMinor,
      billingInterval: input.billingInterval,
      lineItemDescription: input.lineItemDescription.trim(),
      startDate: input.startDate,
      endDate: input.endDate ?? null,
      nextBillingDate: input.startDate,
      paymentTermsDays: input.paymentTermsDays ?? 14,
      issueMode: input.issueMode ?? "CREATE_DRAFT",
      ownerId: input.ownerId,
      createdById: input.createdById,
      status: "DRAFT",
    },
  });
}

export async function activateRetainer(retainerId: string) {
  return prisma.agencyRetainer.update({ where: { id: retainerId }, data: { status: "ACTIVE" } });
}

export async function pauseRetainer(retainerId: string) {
  return prisma.agencyRetainer.update({ where: { id: retainerId }, data: { status: "PAUSED" } });
}

export async function cancelRetainer(retainerId: string) {
  return prisma.agencyRetainer.update({ where: { id: retainerId }, data: { status: "CANCELLED" } });
}

export async function listRetainers() {
  return prisma.agencyRetainer.findMany({
    where: { status: { not: "CANCELLED" } },
    orderBy: { updatedAt: "desc" },
    include: { company: { select: { id: true, name: true } } },
  });
}

export async function runRetainerBillingScheduler() {
  const now = new Date();
  const retainers = await prisma.agencyRetainer.findMany({
    where: {
      status: "ACTIVE",
      nextBillingDate: { lte: now },
      OR: [{ endDate: null }, { endDate: { gte: now } }],
    },
  });

  let generated = 0;
  let skipped = 0;

  for (const retainer of retainers) {
    const periodStart = retainer.nextBillingDate ?? retainer.startDate;
    const periodEnd = addInterval(periodStart, retainer.billingInterval);

    const existing = await prisma.agencyRetainerBillingPeriod.findUnique({
      where: { retainerId_periodStart: { retainerId: retainer.id, periodStart } },
    });
    if (existing?.invoiceId) {
      skipped++;
      continue;
    }

    try {
      await prisma.agencyRetainerBillingPeriod.create({
        data: { retainerId: retainer.id, periodStart, periodEnd },
      });
    } catch (err) {
      if ((err as { code?: string }).code === "P2002") {
        skipped++;
        continue;
      }
      throw err;
    }

    const invoice = await createManualInvoice({
      createdById: retainer.createdById,
      companyId: retainer.companyId,
      primaryContactId: retainer.primaryContactId,
      currency: retainer.currency,
      memo: `${retainer.name} — ${periodStart.toISOString().slice(0, 10)} to ${periodEnd.toISOString().slice(0, 10)}`,
      paymentTermsDays: retainer.paymentTermsDays,
      lineItems: [{
        description: retainer.lineItemDescription,
        quantity: 1,
        unitAmountMinor: retainer.amountMinor,
        position: 0,
      }],
    });

    await prisma.agencyRetainerBillingPeriod.updateMany({
      where: { retainerId: retainer.id, periodStart, invoiceId: null },
      data: { invoiceId: invoice!.id },
    });

    await prisma.agencyInvoice.update({
      where: { id: invoice!.id },
      data: {
        retainerId: retainer.id,
        source: "RETAINER",
        billingPeriodStart: periodStart,
        billingPeriodEnd: periodEnd,
      },
    });

    if (retainer.issueMode === "AUTO_ISSUE") {
      await issueInvoice({ invoiceId: invoice!.id, actorUserId: retainer.createdById });
    }

    await prisma.agencyRetainer.update({
      where: { id: retainer.id },
      data: { nextBillingDate: periodEnd },
    });

    await recordBillingActivity({
      retainerId: retainer.id,
      invoiceId: invoice!.id,
      type: "RETAINER_INVOICE_GENERATED",
      summary: `Retainer invoice generated for period starting ${periodStart.toISOString().slice(0, 10)}.`,
    });

    generated++;
  }

  return { generated, skipped, checked: retainers.length };
}
