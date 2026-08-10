import { prisma } from "@/lib/db";
import {
  assertInvoiceAccess,
  canPayInvoice,
  listAccessibleInvoices,
  recordInvoiceView,
} from "@/lib/billing/portal-access";
import { toClientInvoiceDto } from "@/lib/billing/portal-dto";
import { INVOICE_PAYABLE_STATUSES } from "@/lib/billing/constants";
import { isInvoiceOverdue } from "@/lib/billing/display";
import { formatMinorAmount } from "@/lib/money/format";

export async function getPortalBillingHome(portalUserId: string) {
  const rows = await listAccessibleInvoices(portalUserId);
  const outstanding = rows.filter(
    (r) =>
      INVOICE_PAYABLE_STATUSES.has(r.invoice.status as never) &&
      r.invoice.amountDueMinor > 0,
  );
  const overdue = outstanding.filter((r) =>
    isInvoiceOverdue({
      status: r.invoice.status as never,
      dueDate: r.invoice.dueDate,
      amountDueMinor: r.invoice.amountDueMinor,
    }),
  );
  const recentPaid = rows.filter((r) => r.invoice.status === "PAID").slice(0, 10);
  const outstandingMinor = outstanding.reduce((s, r) => s + r.invoice.amountDueMinor, 0);
  const currency = rows[0]?.invoice.currency ?? "USD";
  return { rows, outstanding, overdue, recentPaid, outstandingMinor, currency };
}

export async function getPortalInvoiceDetail(input: {
  invoiceId: string;
  portalUserId: string;
  contactId: string;
}) {
  await assertInvoiceAccess(input);

  const invoice = await prisma.agencyInvoice.findUniqueOrThrow({
    where: { id: input.invoiceId },
    include: {
      lineItems: { orderBy: { position: "asc" } },
      allocations: {
        include: {
          payment: {
            select: {
              id: true,
              paymentReference: true,
              amountMinor: true,
              currency: true,
              confirmedAt: true,
              method: true,
              provider: true,
              status: true,
            },
          },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  await recordInvoiceView({ invoiceId: input.invoiceId, portalUserId: input.portalUserId });

  const canPay =
    (await canPayInvoice(input)) &&
    INVOICE_PAYABLE_STATUSES.has(invoice.status) &&
    invoice.amountDueMinor > 0;

  return toClientInvoiceDto({
    invoice,
    lineItems: invoice.lineItems.map((li) => ({
      id: li.id,
      description: li.description,
      quantity: li.quantity,
      unitAmountMinor: li.unitAmountMinor,
      amountMinor: li.amountMinor,
      unitFormatted: formatMinorAmount(li.unitAmountMinor, invoice.currency),
      amountFormatted: formatMinorAmount(li.amountMinor, invoice.currency),
    })),
    payments: invoice.allocations
      .filter((a) => a.payment.status === "SUCCEEDED")
      .map((a) => ({
        id: a.payment.id,
        paymentReference: a.payment.paymentReference,
        amountMinor: a.amountMinor,
        amountFormatted: formatMinorAmount(a.amountMinor, invoice.currency),
        confirmedAt: a.payment.confirmedAt,
        method: a.payment.method,
        provider: a.payment.provider,
        manual: a.payment.provider === "MANUAL",
      })),
    canPay,
  });
}
