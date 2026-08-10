import { prisma } from "@/lib/db";
import { decimalToMinorUnits } from "@/lib/money/minor-units";

/** Canonical billing summary — distinguishes unbilled vs invoice balance. */
export type BillingFinancialSummary = {
  currency: string;
  /** Authoritative accepted/commercial value when known. */
  acceptedValueMinor: number | null;
  /** Sum of totalMinor on non-void, non-draft invoices. */
  invoicedMinor: number;
  /** acceptedValue - invoiced when accepted value exists. */
  unbilledMinor: number | null;
  /** Sum of amountPaidMinor on non-void invoices. */
  paidMinor: number;
  /** Sum of amountDueMinor on payable issued invoices. */
  invoiceBalanceMinor: number;
  /** Billing schedule total when present. */
  scheduledMinor: number | null;
  scheduleStatus: string | null;
  invoiceCount: number;
};

const INVOICED_STATUSES = ["ISSUED", "PARTIALLY_PAID", "PAID", "OVERDUE"] as const;

async function aggregateInvoices(where: {
  proposalAcceptanceId?: string;
  contractId?: string;
  projectId?: string;
  proposalId?: string;
}) {
  const invoices = await prisma.agencyInvoice.findMany({
    where: {
      ...where,
      status: { notIn: ["VOID", "WRITTEN_OFF"] },
    },
    select: {
      status: true,
      totalMinor: true,
      amountPaidMinor: true,
      amountDueMinor: true,
      currency: true,
    },
  });

  const currency = invoices[0]?.currency ?? "USD";
  let invoicedMinor = 0;
  let paidMinor = 0;
  let invoiceBalanceMinor = 0;

  for (const inv of invoices) {
    if (inv.status === "DRAFT") continue;
    invoicedMinor += inv.totalMinor;
    paidMinor += inv.amountPaidMinor;
    if (INVOICED_STATUSES.includes(inv.status as (typeof INVOICED_STATUSES)[number])) {
      invoiceBalanceMinor += inv.amountDueMinor;
    }
  }

  return { currency, invoicedMinor, paidMinor, invoiceBalanceMinor, invoiceCount: invoices.length };
}

export async function getProposalFinancialSummary(proposalAcceptanceId: string) {
  const acceptance = await prisma.agencyProposalAcceptance.findUnique({
    where: { id: proposalAcceptanceId },
    select: { acceptedTotal: true, currency: true },
  });
  if (!acceptance) throw new Error("Proposal acceptance not found.");

  const acceptedValueMinor = decimalToMinorUnits(acceptance.acceptedTotal, acceptance.currency);
  const agg = await aggregateInvoices({ proposalAcceptanceId });

  const schedule = await prisma.agencyBillingSchedule.findFirst({
    where: { proposalAcceptanceId },
    select: { totalScheduledMinor: true, status: true },
  });

  return {
    currency: acceptance.currency,
    acceptedValueMinor,
    invoicedMinor: agg.invoicedMinor,
    unbilledMinor: Math.max(0, acceptedValueMinor - agg.invoicedMinor),
    paidMinor: agg.paidMinor,
    invoiceBalanceMinor: agg.invoiceBalanceMinor,
    scheduledMinor: schedule?.totalScheduledMinor ?? null,
    scheduleStatus: schedule?.status ?? null,
    invoiceCount: agg.invoiceCount,
  } satisfies BillingFinancialSummary;
}

export async function getContractFinancialSummary(contractId: string) {
  const contract = await prisma.agencyContract.findUnique({
    where: { id: contractId },
    select: {
      proposalAcceptanceId: true,
      proposalAcceptance: { select: { acceptedTotal: true, currency: true } },
    },
  });
  if (!contract) throw new Error("Contract not found.");

  const acceptedValueMinor = contract.proposalAcceptance
    ? decimalToMinorUnits(
        contract.proposalAcceptance.acceptedTotal,
        contract.proposalAcceptance.currency,
      )
    : null;
  const currency = contract.proposalAcceptance?.currency ?? "USD";

  const agg = await aggregateInvoices({ contractId });

  const schedule = await prisma.agencyBillingSchedule.findFirst({
    where: { contractId },
    select: { totalScheduledMinor: true, status: true },
  });

  return {
    currency: agg.currency || currency,
    acceptedValueMinor,
    invoicedMinor: agg.invoicedMinor,
    unbilledMinor:
      acceptedValueMinor != null ? Math.max(0, acceptedValueMinor - agg.invoicedMinor) : null,
    paidMinor: agg.paidMinor,
    invoiceBalanceMinor: agg.invoiceBalanceMinor,
    scheduledMinor: schedule?.totalScheduledMinor ?? null,
    scheduleStatus: schedule?.status ?? null,
    invoiceCount: agg.invoiceCount,
  } satisfies BillingFinancialSummary;
}

export async function getProjectFinancialSummaryDetailed(projectId: string) {
  const project = await prisma.agencyProject.findUnique({
    where: { id: projectId },
    select: { budgetSnapshot: true, currency: true, sourceProposalAcceptanceId: true },
  });

  let acceptedValueMinor: number | null = null;
  if (project?.sourceProposalAcceptanceId) {
    const acceptance = await prisma.agencyProposalAcceptance.findUnique({
      where: { id: project.sourceProposalAcceptanceId },
      select: { acceptedTotal: true, currency: true },
    });
    if (acceptance) {
      acceptedValueMinor = decimalToMinorUnits(acceptance.acceptedTotal, acceptance.currency);
    }
  } else if (project?.budgetSnapshot != null && project.currency) {
    acceptedValueMinor = decimalToMinorUnits(project.budgetSnapshot, project.currency);
  }

  const agg = await aggregateInvoices({ projectId });
  const schedule = await prisma.agencyBillingSchedule.findFirst({
    where: { projectId },
    select: { totalScheduledMinor: true, status: true },
  });

  return {
    currency: agg.currency || project?.currency || "USD",
    acceptedValueMinor,
    invoicedMinor: agg.invoicedMinor,
    unbilledMinor:
      acceptedValueMinor != null ? Math.max(0, acceptedValueMinor - agg.invoicedMinor) : null,
    paidMinor: agg.paidMinor,
    invoiceBalanceMinor: agg.invoiceBalanceMinor,
    scheduledMinor: schedule?.totalScheduledMinor ?? null,
    scheduleStatus: schedule?.status ?? null,
    invoiceCount: agg.invoiceCount,
  } satisfies BillingFinancialSummary;
}
