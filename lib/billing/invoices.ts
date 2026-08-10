import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { recordBillingActivity } from "@/lib/billing/activity";
import { generateAgencyInvoiceNumber } from "@/lib/billing/invoice-number";
import { grantInvoiceAccess } from "@/lib/billing/portal-access";
import { computeInvoiceSnapshotHash } from "@/lib/billing/snapshot-hash";
import { deriveInvoiceStatus } from "@/lib/billing/display";
import {
  INVOICE_PAGE_SIZE_DEFAULT,
  INVOICE_PAGE_SIZE_MAX,
  INVOICE_PAYABLE_STATUSES,
} from "@/lib/billing/constants";
import type { InvoiceFilters } from "@/lib/billing/schema";
import { calculateInvoiceTotals } from "@/lib/money/minor-units";
import { assertSupportedCurrency } from "@/lib/money/currency";
import { decimalToMinorUnits } from "@/lib/money/minor-units";
import { escapeHeaderFragment } from "@/lib/email/send";
import { sendSmartlanceEmail } from "@/lib/email/send-smartlance";
import { getProjectFinancialSummaryDetailed } from "@/lib/billing/financial-summary";

const listInclude = {
  company: { select: { id: true, name: true } },
  primaryContact: {
    select: { id: true, firstName: true, lastName: true, displayName: true, email: true },
  },
  project: { select: { id: true, projectNumber: true, name: true } },
  proposal: { select: { id: true, proposalNumber: true, title: true } },
} satisfies Prisma.AgencyInvoiceInclude;

function siteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "http://localhost:3000";
}

export async function getBillingSettings() {
  return prisma.agencyBillingSettings.upsert({
    where: { id: "agency-billing" },
    create: { id: "agency-billing" },
    update: {},
  });
}

export async function listInvoices(input?: {
  filters?: InvoiceFilters;
  page?: number;
  pageSize?: number;
}) {
  const page = Math.max(1, input?.page ?? 1);
  const pageSize = Math.min(input?.pageSize ?? INVOICE_PAGE_SIZE_DEFAULT, INVOICE_PAGE_SIZE_MAX);
  const where: Prisma.AgencyInvoiceWhereInput = {};
  if (input?.filters?.status) where.status = input.filters.status as never;
  if (input?.filters?.companyId) where.companyId = input.filters.companyId;
  if (input?.filters?.projectId) where.projectId = input.filters.projectId;
  if (input?.filters?.currency) where.currency = input.filters.currency;
  if (input?.filters?.q?.trim()) {
    const q = input.filters.q.trim();
    where.OR = [
      { invoiceNumber: { contains: q, mode: "insensitive" } },
      { billingNameSnapshot: { contains: q, mode: "insensitive" } },
      { company: { name: { contains: q, mode: "insensitive" } } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.agencyInvoice.findMany({
      where,
      orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: listInclude,
    }),
    prisma.agencyInvoice.count({ where }),
  ]);
  return { items, total, page, pageSize };
}

type InvoiceDb = Pick<typeof prisma, "agencyInvoice">;

export async function getInvoiceById(invoiceId: string, db: InvoiceDb = prisma) {
  return db.agencyInvoice.findUnique({
    where: { id: invoiceId },
    include: {
      ...listInclude,
      lineItems: { orderBy: { position: "asc" } },
      allocations: {
        include: {
          payment: {
            select: {
              id: true,
              paymentReference: true,
              status: true,
              amountMinor: true,
              currency: true,
              method: true,
              provider: true,
              confirmedAt: true,
              recordedById: true,
            },
          },
        },
        orderBy: { createdAt: "asc" },
      },
      activities: { orderBy: { createdAt: "desc" }, take: 30 },
      contract: { select: { id: true, contractNumber: true, status: true } },
    },
  });
}

export async function getBillingDashboardCounts() {
  const now = new Date();
  const [outstanding, overdue, paidThisMonth] = await Promise.all([
    prisma.agencyInvoice.aggregate({
      where: { status: { in: ["ISSUED", "PARTIALLY_PAID"] } },
      _sum: { amountDueMinor: true },
    }),
    prisma.agencyInvoice.count({
      where: {
        status: { in: ["ISSUED", "PARTIALLY_PAID"] },
        dueDate: { lt: now },
        amountDueMinor: { gt: 0 },
      },
    }),
    prisma.agencyInvoice.count({
      where: {
        status: "PAID",
        paidAt: { gte: new Date(now.getFullYear(), now.getMonth(), 1) },
      },
    }),
  ]);
  return {
    outstandingMinor: outstanding._sum.amountDueMinor ?? 0,
    overdueCount: overdue,
    paidThisMonth,
  };
}

async function resolveBillingSnapshot(input: {
  companyId?: string | null;
  primaryContactId?: string | null;
}) {
  const settings = await getBillingSettings();
  if (input.companyId) {
    const company = await prisma.crmCompany.findUniqueOrThrow({ where: { id: input.companyId } });
    const contact = input.primaryContactId
      ? await prisma.crmContact.findUnique({ where: { id: input.primaryContactId } })
      : null;
    return {
      billingNameSnapshot: company.name,
      billingEmailSnapshot: contact?.email ?? settings.billingEmail ?? "",
      billingAddressSnapshotJson: company.address ? { address: company.address } : null,
    };
  }
  if (input.primaryContactId) {
    const contact = await prisma.crmContact.findUniqueOrThrow({
      where: { id: input.primaryContactId },
      include: { company: true },
    });
    return {
      billingNameSnapshot: contact.displayName ?? contact.email ?? "Client",
      billingEmailSnapshot: contact.email ?? settings.billingEmail ?? "",
      billingAddressSnapshotJson: null,
    };
  }
  return {
    billingNameSnapshot: settings.businessLegalName ?? "Client",
    billingEmailSnapshot: settings.billingEmail ?? "",
    billingAddressSnapshotJson: settings.billingAddressJson ?? null,
  };
}

export async function createManualInvoice(input: {
  createdById: string;
  companyId?: string | null;
  primaryContactId?: string | null;
  currency: string;
  memo?: string | null;
  clientNotes?: string | null;
  paymentTermsDays?: number;
  lineItems?: Array<{ description: string; quantity: number; unitAmountMinor: number; position?: number }>;
}) {
  const currency = assertSupportedCurrency(input.currency);
  const billing = await resolveBillingSnapshot(input);
  const settings = await getBillingSettings();
  const lineItems = input.lineItems?.length
    ? input.lineItems
    : [{ description: "Services", quantity: 1, unitAmountMinor: 0, position: 0 }];
  const computed = lineItems.map((li, i) => ({
    ...li,
    amountMinor: li.quantity * li.unitAmountMinor,
    position: li.position ?? i,
  }));
  const totals = calculateInvoiceTotals({ lineItems: computed });

  return prisma.$transaction(async (tx) => {
    const invoiceNumber = await generateAgencyInvoiceNumber(tx);
    const invoice = await tx.agencyInvoice.create({
      data: {
        invoiceNumber,
        source: "MANUAL",
        companyId: input.companyId ?? null,
        primaryContactId: input.primaryContactId ?? null,
        currency,
        ...totals,
        amountDueMinor: totals.totalMinor,
        memo: input.memo ?? null,
        clientNotes: input.clientNotes ?? null,
        billingNameSnapshot: billing.billingNameSnapshot,
        billingEmailSnapshot: billing.billingEmailSnapshot,
        billingAddressSnapshotJson: billing.billingAddressSnapshotJson ?? undefined,
        issuerNameSnapshot: settings.businessLegalName ?? "Smartlance Designs",
        issuerEmailSnapshot: settings.billingEmail ?? null,
        createdById: input.createdById,
        lineItems: {
          create: computed.map((li) => ({
            description: li.description,
            quantity: li.quantity,
            unitAmountMinor: li.unitAmountMinor,
            amountMinor: li.amountMinor,
            position: li.position,
          })),
        },
      },
    });

    await recordBillingActivity(
      {
        invoiceId: invoice.id,
        type: "INVOICE_CREATED",
        summary: `Invoice ${invoiceNumber} created.`,
        actorUserId: input.createdById,
      },
      tx,
    );

    return getInvoiceById(invoice.id, tx);
  });
}

export async function createInvoiceFromAcceptance(input: {
  proposalAcceptanceId: string;
  createdById: string;
  contractId?: string | null;
  installmentId?: string;
  lineDescription?: string;
  amountMinor?: number;
}) {
  const acceptance = await prisma.agencyProposalAcceptance.findUniqueOrThrow({
    where: { id: input.proposalAcceptanceId },
    include: {
      proposal: { include: { company: true, primaryContact: true, project: true } },
    },
  });

  const currency = assertSupportedCurrency(acceptance.currency);
  const totalMinor = input.amountMinor ?? decimalToMinorUnits(acceptance.acceptedTotal, currency);
  const billing = await resolveBillingSnapshot({
    companyId: acceptance.proposal.companyId,
    primaryContactId: acceptance.proposal.primaryContactId,
  });
  const settings = await getBillingSettings();

  return prisma.$transaction(async (tx) => {
    const invoiceNumber = await generateAgencyInvoiceNumber(tx);
    const invoice = await tx.agencyInvoice.create({
      data: {
        invoiceNumber,
        source: "PROPOSAL_ACCEPTANCE",
        companyId: acceptance.proposal.companyId,
        primaryContactId: acceptance.proposal.primaryContactId,
        proposalId: acceptance.proposalId,
        proposalAcceptanceId: acceptance.id,
        contractId: input.contractId ?? null,
        projectId: acceptance.proposal.project?.id ?? null,
        billingInstallmentId: input.installmentId ?? null,
        currency,
        subtotalMinor: totalMinor,
        totalMinor,
        amountDueMinor: totalMinor,
        billingNameSnapshot: billing.billingNameSnapshot,
        billingEmailSnapshot: billing.billingEmailSnapshot,
        billingAddressSnapshotJson: billing.billingAddressSnapshotJson ?? undefined,
        issuerNameSnapshot: settings.businessLegalName ?? "Smartlance Designs",
        issuerEmailSnapshot: settings.billingEmail ?? null,
        createdById: input.createdById,
        lineItems: {
          create: [{
            description: input.lineDescription ?? acceptance.proposal.title,
            quantity: 1,
            unitAmountMinor: totalMinor,
            amountMinor: totalMinor,
            position: 0,
            sourceType: "PROPOSAL_ACCEPTANCE",
            sourceId: acceptance.id,
          }],
        },
      },
    });

    await recordBillingActivity(
      {
        invoiceId: invoice.id,
        type: "INVOICE_CREATED",
        summary: `Invoice ${invoiceNumber} created from accepted proposal.`,
        actorUserId: input.createdById,
      },
      tx,
    );

    return getInvoiceById(invoice.id, tx);
  });
}

export async function saveDraftInvoice(input: {
  invoiceId: string;
  memo?: string | null;
  clientNotes?: string | null;
  internalNotes?: string | null;
  dueDate?: Date | null;
  paymentTermsDays?: number;
  discountMinor?: number;
  taxMinor?: number;
  lineItems: Array<{ description: string; quantity: number; unitAmountMinor: number; position: number }>;
  actorUserId: string;
}) {
  const invoice = await prisma.agencyInvoice.findUniqueOrThrow({ where: { id: input.invoiceId } });
  if (invoice.status !== "DRAFT") {
    throw new Error("Only draft invoices can be edited.");
  }

  if (!input.lineItems.length) {
    throw new Error("Invoice must have at least one line item.");
  }

  const computed = input.lineItems.map((li) => {
    if (!li.description.trim()) throw new Error("Line item description is required.");
    if (li.quantity <= 0) throw new Error("Line item quantity must be greater than zero.");
    if (li.unitAmountMinor < 0) throw new Error("Line item unit amount cannot be negative.");
    return {
      ...li,
      description: li.description.trim(),
      amountMinor: li.quantity * li.unitAmountMinor,
    };
  });

  const totals = calculateInvoiceTotals({
    lineItems: computed,
    discountMinor: input.discountMinor,
    taxMinor: input.taxMinor,
  });

  if (totals.totalMinor <= 0) {
    throw new Error("Invoice total must be greater than zero.");
  }

  let dueDate = input.dueDate ?? null;
  if (!dueDate && input.paymentTermsDays != null) {
    dueDate = new Date(Date.now() + input.paymentTermsDays * 86400000);
  }

  await prisma.$transaction(async (tx) => {
    await tx.agencyInvoiceLineItem.deleteMany({ where: { invoiceId: input.invoiceId } });
    await tx.agencyInvoiceLineItem.createMany({
      data: computed.map((li) => ({
        invoiceId: input.invoiceId,
        description: li.description,
        quantity: li.quantity,
        unitAmountMinor: li.unitAmountMinor,
        amountMinor: li.amountMinor,
        position: li.position,
      })),
    });
    await tx.agencyInvoice.update({
      where: { id: input.invoiceId },
      data: {
        ...totals,
        amountPaidMinor: 0,
        amountDueMinor: totals.totalMinor,
        memo: input.memo ?? null,
        clientNotes: input.clientNotes ?? null,
        internalNotes: input.internalNotes ?? null,
        dueDate,
      },
    });
  });

  return getInvoiceById(input.invoiceId);
}

export async function issueInvoice(input: {
  invoiceId: string;
  actorUserId: string;
  paymentTermsDays?: number;
}) {
  const invoice = await prisma.agencyInvoice.findUniqueOrThrow({
    where: { id: input.invoiceId },
    include: { lineItems: { orderBy: { position: "asc" } }, primaryContact: true },
  });

  if (invoice.status !== "DRAFT") throw new Error("Only draft invoices can be issued.");
  if (!invoice.lineItems.length) throw new Error("Invoice must have line items.");
  if (invoice.totalMinor <= 0) throw new Error("Invoice total must be greater than zero.");
  if (!invoice.billingEmailSnapshot?.trim()) {
    throw new Error("Billing email is required before issuing.");
  }

  const settings = await getBillingSettings();
  const termsDays = input.paymentTermsDays ?? settings.defaultPaymentTermsDays;
  const issueDate = new Date();
  const dueDate = invoice.dueDate ?? new Date(issueDate.getTime() + termsDays * 86400000);
  if (dueDate.getTime() < issueDate.getTime()) {
    throw new Error("Due date must be on or after issue date.");
  }

  const snapshotHash = computeInvoiceSnapshotHash({
    invoiceNumber: invoice.invoiceNumber,
    currency: invoice.currency,
    subtotalMinor: invoice.subtotalMinor,
    discountMinor: invoice.discountMinor,
    taxMinor: invoice.taxMinor,
    totalMinor: invoice.totalMinor,
    issueDate: issueDate.toISOString(),
    dueDate: dueDate.toISOString(),
    billingNameSnapshot: invoice.billingNameSnapshot ?? "",
    billingEmailSnapshot: invoice.billingEmailSnapshot ?? "",
    lineItems: invoice.lineItems,
  });

  await prisma.agencyInvoice.update({
    where: { id: input.invoiceId },
    data: {
      status: "ISSUED",
      issueDate,
      dueDate,
      sentAt: new Date(),
      amountDueMinor: invoice.totalMinor,
      snapshotHash,
      issuerNameSnapshot: settings.businessLegalName ?? invoice.issuerNameSnapshot,
      issuerEmailSnapshot: settings.billingEmail ?? invoice.issuerEmailSnapshot,
    },
  });

  if (invoice.primaryContactId) {
    await grantInvoiceAccess({
      invoiceId: input.invoiceId,
      contactId: invoice.primaryContactId,
      role: "BILLING_ADMIN",
      grantedById: input.actorUserId,
    });
  }

  await recordBillingActivity({
    invoiceId: input.invoiceId,
    type: "INVOICE_ISSUED",
    summary: "Invoice issued.",
    actorUserId: input.actorUserId,
    clientVisible: true,
  });

  const notification = await sendSmartlanceEmail({
    category: "INVOICE",
    to: invoice.billingEmailSnapshot!,
    subject: escapeHeaderFragment(`Invoice ${invoice.invoiceNumber} from Smartlance Designs`),
    text: `Invoice ${invoice.invoiceNumber} is ready.\n\nView and pay: ${siteUrl()}/portal/invoices/${invoice.id}`,
    html: `<p>Invoice <strong>${invoice.invoiceNumber}</strong> is ready.</p><p><a href="${siteUrl()}/portal/invoices/${invoice.id}">View &amp; pay invoice</a></p>`,
  });

  return { invoice: await getInvoiceById(input.invoiceId), notificationFailed: !notification.success };
}

export async function voidInvoice(input: {
  invoiceId: string;
  actorUserId: string;
  reason: string;
}) {
  const invoice = await prisma.agencyInvoice.findUniqueOrThrow({ where: { id: input.invoiceId } });
  if (invoice.status === "VOID") return invoice;
  if (invoice.amountPaidMinor > 0) {
    throw new Error("Cannot void an invoice with recorded payments.");
  }
  if (invoice.status === "PAID") {
    throw new Error("Paid invoices cannot be voided.");
  }

  await prisma.agencyInvoice.update({
    where: { id: input.invoiceId },
    data: {
      status: "VOID",
      voidedAt: new Date(),
      voidReason: input.reason.trim(),
      amountDueMinor: 0,
    },
  });

  await recordBillingActivity({
    invoiceId: input.invoiceId,
    type: "INVOICE_VOIDED",
    summary: "Invoice voided.",
    actorUserId: input.actorUserId,
  });

  return getInvoiceById(input.invoiceId);
}

export async function getProjectFinancialSummary(projectId: string) {
  const summary = await getProjectFinancialSummaryDetailed(projectId);
  return {
    currency: summary.currency,
    invoicedMinor: summary.invoicedMinor,
    paidMinor: summary.paidMinor,
    outstandingMinor: summary.invoiceBalanceMinor,
  };
}

export { getProjectFinancialSummaryDetailed };

export { INVOICE_PAYABLE_STATUSES, deriveInvoiceStatus };
