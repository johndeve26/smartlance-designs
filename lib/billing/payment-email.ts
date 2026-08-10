import { prisma } from "@/lib/db";
import { formatMinorAmount } from "@/lib/money/format";
import { escapeHeaderFragment } from "@/lib/email/send";
import { sendSmartlanceEmail } from "@/lib/email/send-smartlance";
import { emailSiteUrl } from "@/lib/email/site-url";

function siteUrl() {
  return emailSiteUrl();
}

/**
 * Send factual payment confirmation email after SUCCEEDED payment.
 * Uses atomic claim to prevent duplicate sends on webhook/return races or retries.
 */
export async function sendPaymentConfirmationEmail(paymentId: string): Promise<{
  sent: boolean;
  skipped?: string;
}> {
  const claim = await prisma.agencyPayment.updateMany({
    where: {
      id: paymentId,
      status: "SUCCEEDED",
      confirmationEmailSentAt: null,
      confirmationEmailClaimedAt: null,
    },
    data: { confirmationEmailClaimedAt: new Date() },
  });

  if (claim.count === 0) {
    const existing = await prisma.agencyPayment.findUnique({
      where: { id: paymentId },
      select: { confirmationEmailSentAt: true, status: true },
    });
    if (existing?.confirmationEmailSentAt) return { sent: false, skipped: "already_sent" };
    if (existing?.status !== "SUCCEEDED") return { sent: false, skipped: "not_succeeded" };
    return { sent: false, skipped: "claim_lost" };
  }

  try {
    const payment = await prisma.agencyPayment.findUniqueOrThrow({
      where: { id: paymentId },
      include: {
        allocations: {
          include: {
            invoice: {
              select: {
                id: true,
                invoiceNumber: true,
                billingEmailSnapshot: true,
                amountDueMinor: true,
                totalMinor: true,
                currency: true,
                status: true,
              },
            },
          },
        },
      },
    });

    const allocation = payment.allocations[0];
    const invoice = allocation?.invoice;
    const to = invoice?.billingEmailSnapshot?.trim();
    if (!to) {
      await prisma.agencyPayment.update({
        where: { id: paymentId },
        data: { confirmationEmailClaimedAt: null },
      });
      return { sent: false, skipped: "no_recipient" };
    }

    const amountFormatted = formatMinorAmount(payment.amountMinor, payment.currency);
    const dateStr = (payment.confirmedAt ?? new Date()).toISOString().slice(0, 10);
    const ref = payment.paymentReference ?? payment.providerReference ?? payment.id.slice(0, 8);
    const invoiceLabel = invoice?.invoiceNumber ?? "Invoice";
    const fullyPaid = invoice ? invoice.amountDueMinor <= 0 : false;
    const remainingFormatted =
      invoice && invoice.amountDueMinor > 0
        ? formatMinorAmount(invoice.amountDueMinor, invoice.currency)
        : null;

    const subject = fullyPaid
      ? escapeHeaderFragment(`Payment received — ${invoiceLabel} paid in full`)
      : escapeHeaderFragment(`Payment received — ${invoiceLabel}`);

    const balanceLine = remainingFormatted
      ? `\nRemaining balance: ${remainingFormatted}`
      : fullyPaid
        ? "\nInvoice status: Paid"
        : "";

    const text = [
      "Payment received",
      "",
      "We've received your payment.",
      "",
      `Invoice: ${invoiceLabel}`,
      `Amount: ${amountFormatted}`,
      `Date: ${dateStr}`,
      `Payment reference: ${ref}`,
      balanceLine,
      "",
      invoice ? `View invoice: ${siteUrl()}/portal/invoices/${invoice.id}` : "",
      "",
      "Thank you.",
    ]
      .filter(Boolean)
      .join("\n");

    const htmlBalance = remainingFormatted
      ? `<p>Remaining balance: <strong>${remainingFormatted}</strong></p>`
      : fullyPaid
        ? `<p>Invoice status: <strong>Paid</strong></p>`
        : "";

    const html = `
      <p><strong>Payment received</strong></p>
      <p>We've received your payment.</p>
      <ul>
        <li>Invoice: ${invoiceLabel}</li>
        <li>Amount: ${amountFormatted}</li>
        <li>Date: ${dateStr}</li>
        <li>Payment reference: ${ref}</li>
      </ul>
      ${htmlBalance}
      ${
        invoice
          ? `<p><a href="${siteUrl()}/portal/invoices/${invoice.id}">View invoice</a></p>`
          : ""
      }
      <p>Thank you.</p>
    `;

    const result = await sendSmartlanceEmail({
      category: "PAYMENT_CONFIRMATION",
      to,
      subject,
      text,
      html,
    });

    if (result.success) {
      await prisma.agencyPayment.update({
        where: { id: paymentId },
        data: { confirmationEmailSentAt: new Date() },
      });
      return { sent: true };
    }

    await prisma.agencyPayment.update({
      where: { id: paymentId },
      data: { confirmationEmailClaimedAt: null },
    });
    return { sent: false, skipped: "email_failed" };
  } catch {
    await prisma.agencyPayment.update({
      where: { id: paymentId },
      data: { confirmationEmailClaimedAt: null },
    });
    return { sent: false, skipped: "error" };
  }
}

/** Admin resend — only if not yet successfully sent. */
export async function resendPaymentConfirmationEmail(paymentId: string) {
  await prisma.agencyPayment.updateMany({
    where: { id: paymentId, confirmationEmailSentAt: null },
    data: { confirmationEmailClaimedAt: null },
  });
  return sendPaymentConfirmationEmail(paymentId);
}
