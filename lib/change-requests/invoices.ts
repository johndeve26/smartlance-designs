import { prisma } from "@/lib/db";
import { recordBillingActivity } from "@/lib/billing/activity";
import { getBillingSettings } from "@/lib/billing/invoices";
import { generateAgencyInvoiceNumber } from "@/lib/billing/invoice-number";
import { recordChangeRequestActivity } from "@/lib/change-requests/activity";

async function resolveBillingSnapshot(input: {
  companyId?: string | null;
  primaryContactId?: string | null;
}) {
  let billingNameSnapshot: string | null = null;
  let billingEmailSnapshot: string | null = null;
  let billingAddressSnapshotJson: unknown = null;

  if (input.primaryContactId) {
    const contact = await prisma.crmContact.findUnique({
      where: { id: input.primaryContactId },
    });
    if (contact) {
      billingNameSnapshot =
        contact.displayName?.trim() ||
        [contact.firstName, contact.lastName].filter(Boolean).join(" ") ||
        null;
      billingEmailSnapshot = contact.email;
    }
  }

  if (input.companyId) {
    const company = await prisma.crmCompany.findUnique({
      where: { id: input.companyId },
    });
    if (company && !billingNameSnapshot) {
      billingNameSnapshot = company.name;
    }
  }

  return { billingNameSnapshot, billingEmailSnapshot, billingAddressSnapshotJson };
}

export async function createChangeRequestInvoice(input: {
  changeRequestId: string;
  createdById: string;
  lineDescription?: string;
}) {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`
      SELECT id FROM "AgencyChangeRequest" WHERE id = ${input.changeRequestId} FOR UPDATE
    `;

    const existing = await tx.agencyInvoice.findUnique({
      where: { changeRequestId: input.changeRequestId },
    });
    if (existing) return existing;

    const cr = await tx.agencyChangeRequest.findUniqueOrThrow({
      where: { id: input.changeRequestId },
      include: {
        approval: true,
        project: {
          select: {
            id: true,
            clientCompanyId: true,
            primaryContactId: true,
          },
        },
      },
    });

    if (cr.status !== "APPROVED" && cr.status !== "APPLIED" && cr.status !== "IMPLEMENTED") {
      throw new Error("Change request must be approved before invoicing.");
    }
    if (!cr.approval) {
      throw new Error("Approved change request with price impact required for invoicing.");
    }
    if (cr.approval.approvedPriceImpactMinor <= 0) {
      throw new Error("Zero-price changes do not require an invoice.");
    }

    const amountMinor = cr.approval.approvedPriceImpactMinor;
    const currency = cr.approval.currency;
    const billing = await resolveBillingSnapshot({
      companyId: cr.project.clientCompanyId,
      primaryContactId: cr.project.primaryContactId,
    });
    const settings = await getBillingSettings();
    const invoiceNumber = await generateAgencyInvoiceNumber(tx);

    const description =
      input.lineDescription?.trim() ||
      `Approved Change Request ${cr.changeRequestNumber}`;

    const invoice = await tx.agencyInvoice.create({
      data: {
        invoiceNumber,
        source: "CHANGE_REQUEST",
        changeRequestId: cr.id,
        companyId: cr.project.clientCompanyId,
        primaryContactId: cr.project.primaryContactId,
        projectId: cr.project.id,
        proposalAcceptanceId: cr.proposalAcceptanceId,
        contractId: cr.contractId,
        currency,
        subtotalMinor: amountMinor,
        totalMinor: amountMinor,
        amountDueMinor: amountMinor,
        billingNameSnapshot: billing.billingNameSnapshot,
        billingEmailSnapshot: billing.billingEmailSnapshot,
        billingAddressSnapshotJson: billing.billingAddressSnapshotJson ?? undefined,
        issuerNameSnapshot: settings.businessLegalName ?? "Smartlance Designs",
        issuerEmailSnapshot: settings.billingEmail ?? null,
        memo: description,
        createdById: input.createdById,
        lineItems: {
          create: [{
            description,
            quantity: 1,
            unitAmountMinor: amountMinor,
            amountMinor,
            position: 0,
            sourceType: "CHANGE_REQUEST",
            sourceId: cr.id,
          }],
        },
      },
    }).catch(async (err: unknown) => {
      const code = (err as { code?: string }).code;
      if (code === "P2002") {
        return tx.agencyInvoice.findUniqueOrThrow({
          where: { changeRequestId: input.changeRequestId },
        });
      }
      throw err;
    });

    await recordBillingActivity(
      {
        invoiceId: invoice.id,
        type: "INVOICE_CREATED",
        summary: `Change request invoice ${invoiceNumber} created.`,
        actorUserId: input.createdById,
      },
      tx,
    );

    await recordChangeRequestActivity(
      {
        changeRequestId: cr.id,
        type: "INVOICE_CREATED",
        summary: `Invoice ${invoiceNumber} created for approved change.`,
        actorUserId: input.createdById,
        metadata: { invoiceId: invoice.id },
      },
      tx,
    );

    return invoice;
  });
}
