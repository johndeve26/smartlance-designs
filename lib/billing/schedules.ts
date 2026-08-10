import { prisma } from "@/lib/db";
import { recordBillingActivity } from "@/lib/billing/activity";
import { createInvoiceFromAcceptance } from "@/lib/billing/invoices";
import { decimalToMinorUnits, splitByPercentages } from "@/lib/money/minor-units";
import { assertSupportedCurrency } from "@/lib/money/currency";

export async function createBillingSchedule(input: {
  proposalAcceptanceId?: string;
  contractId?: string;
  projectId?: string;
  currency: string;
  installments: Array<{
    label: string;
    type: "DEPOSIT" | "MILESTONE" | "FINAL" | "OTHER";
    amountMinor?: number;
    percentageBasisPoints?: number;
    milestoneId?: string | null;
    dueDaysOffset?: number | null;
  }>;
  createdById: string;
}) {
  const currency = assertSupportedCurrency(input.currency);
  let acceptedTotalMinor: number | null = null;

  if (input.proposalAcceptanceId) {
    const acceptance = await prisma.agencyProposalAcceptance.findUniqueOrThrow({
      where: { id: input.proposalAcceptanceId },
    });
    acceptedTotalMinor = decimalToMinorUnits(acceptance.acceptedTotal, acceptance.currency);
    if (currency !== acceptance.currency.toUpperCase()) {
      throw new Error("Schedule currency must match accepted proposal currency.");
    }
  }

  let amounts: number[];
  const hasPercent = input.installments.some((i) => i.percentageBasisPoints != null);
  if (hasPercent) {
    if (acceptedTotalMinor == null) {
      throw new Error("Percentage schedules require an accepted proposal total.");
    }
    amounts = splitByPercentages(
      acceptedTotalMinor,
      input.installments.map((i) => i.percentageBasisPoints ?? 0),
    );
  } else {
    amounts = input.installments.map((i) => i.amountMinor ?? 0);
  }

  const totalScheduledMinor = amounts.reduce((s, a) => s + a, 0);
  if (acceptedTotalMinor != null && totalScheduledMinor > acceptedTotalMinor) {
    throw new Error("Scheduled total exceeds accepted proposal total.");
  }

  return prisma.$transaction(async (tx) => {
    const schedule = await tx.agencyBillingSchedule.create({
      data: {
        proposalAcceptanceId: input.proposalAcceptanceId ?? null,
        contractId: input.contractId ?? null,
        projectId: input.projectId ?? null,
        currency,
        totalScheduledMinor,
        status: "DRAFT",
        createdById: input.createdById,
        installments: {
          create: input.installments.map((inst, idx) => ({
            sequence: idx + 1,
            label: inst.label,
            type: inst.type,
            amountMinor: amounts[idx]!,
            percentageBasisPoints: inst.percentageBasisPoints ?? null,
            milestoneId: inst.milestoneId ?? null,
            dueDaysOffset: inst.dueDaysOffset ?? null,
          })),
        },
      },
      include: { installments: { orderBy: { sequence: "asc" } } },
    });
    return schedule;
  });
}

export async function activateBillingSchedule(scheduleId: string, actorUserId: string) {
  const schedule = await prisma.agencyBillingSchedule.update({
    where: { id: scheduleId },
    data: { status: "ACTIVE" },
    include: { installments: { orderBy: { sequence: "asc" } } },
  });
  return schedule;
}

export async function createInvoiceFromInstallment(input: {
  installmentId: string;
  createdById: string;
}) {
  const installment = await prisma.agencyBillingInstallment.findUniqueOrThrow({
    where: { id: input.installmentId },
    include: { schedule: true },
  });
  if (installment.invoiceId) throw new Error("Installment already invoiced.");
  if (installment.status !== "PENDING") throw new Error("Installment is not pending.");

  let invoice;
  if (installment.schedule.proposalAcceptanceId) {
    invoice = await createInvoiceFromAcceptance({
      proposalAcceptanceId: installment.schedule.proposalAcceptanceId,
      createdById: input.createdById,
      installmentId: installment.id,
      lineDescription: installment.label,
      amountMinor: installment.amountMinor,
    });
  } else {
    throw new Error("Manual schedule invoicing not yet supported without acceptance.");
  }

  await prisma.agencyBillingInstallment.update({
    where: { id: installment.id },
    data: { invoiceId: invoice!.id, status: "INVOICED" },
  });

  await prisma.agencyInvoice.update({
    where: { id: invoice!.id },
    data: {
      billingScheduleId: installment.schedule.id,
      billingInstallmentId: installment.id,
      source: "SCHEDULE",
    },
  });

  return invoice;
}

export async function getScheduleByAcceptanceId(proposalAcceptanceId: string) {
  return prisma.agencyBillingSchedule.findFirst({
    where: { proposalAcceptanceId },
    include: { installments: { orderBy: { sequence: "asc" } } },
  });
}
