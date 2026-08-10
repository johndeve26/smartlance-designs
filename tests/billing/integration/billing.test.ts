import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import type { PrismaClient } from "@prisma/client";
import {
  disconnectIntegrationPrisma,
  getIntegrationPrisma,
} from "../../crm/integration/db";
import { hasIntegrationDatabase } from "../../crm/integration/guard";
import { createIntegrationAdmin, createIntegrationContact } from "../../crm/integration/fixtures";
import {
  createManualInvoice,
  issueInvoice,
  saveDraftInvoice,
} from "@/lib/billing/invoices";
import { generateAgencyInvoiceNumber } from "@/lib/billing/invoice-number";
import {
  confirmPaymentSuccess,
  recordManualPayment,
  initiateInvoicePayment,
} from "@/lib/billing/payments";
import { createRetainer, runRetainerBillingScheduler } from "@/lib/billing/retainers";
import { grantInvoiceAccess, hasInvoiceAccess } from "@/lib/billing/portal-access";
import { generatePaymentReference } from "@/lib/billing/payment-reference";
import { processPaymentWebhook } from "@/lib/billing/webhook";

const PREFIX = "[billing-it]";
const describeIntegration = hasIntegrationDatabase() ? describe : describe.skip;

async function cleanup(db: PrismaClient) {
  await db.agencyPaymentWebhookEvent.deleteMany({});
  await db.agencyBillingActivity.deleteMany({
    where: { invoice: { memo: { startsWith: PREFIX } } },
  });
  await db.agencyPaymentAllocation.deleteMany({
    where: { invoice: { memo: { startsWith: PREFIX } } },
  });
  await db.agencyPayment.deleteMany({
    where: {
      OR: [
        { manualNote: { startsWith: PREFIX } },
        { paymentReference: { startsWith: "PAY" } },
      ],
    },
  });
  await db.agencyInvoiceClientAccess.deleteMany({
    where: { invoice: { memo: { startsWith: PREFIX } } },
  });
  await db.agencyInvoiceLineItem.deleteMany({
    where: { invoice: { memo: { startsWith: PREFIX } } },
  });
  await db.agencyInvoice.deleteMany({ where: { memo: { startsWith: PREFIX } } });
  await db.agencyRetainerBillingPeriod.deleteMany({
    where: { retainer: { name: { startsWith: PREFIX } } },
  });
  await db.agencyRetainer.deleteMany({ where: { name: { startsWith: PREFIX } } });
  await db.clientPortalUser.deleteMany({
    where: { contact: { email: { contains: PREFIX } } },
  });
  await db.crmContact.deleteMany({ where: { email: { contains: PREFIX } } });
  await db.crmCompany.deleteMany({ where: { name: { startsWith: PREFIX } } });
}

async function getOrCreatePortalUser(
  db: PrismaClient,
  contact: { id: string; email: string | null },
) {
  const existing = await db.clientPortalUser.findUnique({ where: { contactId: contact.id } });
  if (existing) return existing;
  return db.clientPortalUser.create({
    data: { contactId: contact.id, email: contact.email!, status: "ACTIVE" },
  });
}

async function createIssuedInvoice(db: PrismaClient, adminId: string, totalMinor: number, memo: string) {
  const contact = await createIntegrationContact(db, adminId, {
    email: `${PREFIX}-${memo}@test.local`,
  });
  const invoice = await createManualInvoice({
    createdById: adminId,
    primaryContactId: contact.id,
    currency: "USD",
    memo: `${PREFIX} ${memo}`,
    lineItems: [{ description: "Work", quantity: 1, unitAmountMinor: totalMinor, position: 0 }],
  });
  await issueInvoice({ invoiceId: invoice!.id, actorUserId: adminId });
  return { invoice: invoice!, contact };
}

describeIntegration("Agency Billing V2.2.1 — live DB", () => {
  let db: PrismaClient;
  let adminId: string;

  beforeAll(async () => {
    db = getIntegrationPrisma();
    const admin = await createIntegrationAdmin(db);
    adminId = admin.id;
  });

  afterAll(async () => {
    await cleanup(db);
    await disconnectIntegrationPrisma();
  });

  beforeEach(async () => {
    await cleanup(db);
  });

  it("generates unique invoice numbers concurrently", async () => {
    const numbers = await Promise.all(
      Array.from({ length: 20 }, () => db.$transaction((tx) => generateAgencyInvoiceNumber(tx))),
    );
    expect(new Set(numbers).size).toBe(20);
  });

  it("supports partial payments and rejects overpayment", async () => {
    const { invoice } = await createIssuedInvoice(db, adminId, 100000, "partial");

    await recordManualPayment({
      invoiceId: invoice.id,
      amountMinor: 40000,
      method: "BANK_TRANSFER",
      reference: `${PREFIX}-1`,
      recordedById: adminId,
    });

    const partial = await db.agencyInvoice.findUniqueOrThrow({ where: { id: invoice.id } });
    expect(partial.status).toBe("PARTIALLY_PAID");
    expect(partial.amountDueMinor).toBe(60000);

    await recordManualPayment({
      invoiceId: invoice.id,
      amountMinor: 60000,
      method: "BANK_TRANSFER",
      reference: `${PREFIX}-2`,
      recordedById: adminId,
    });

    const paid = await db.agencyInvoice.findUniqueOrThrow({ where: { id: invoice.id } });
    expect(paid.status).toBe("PAID");
    expect(paid.amountDueMinor).toBe(0);

    await expect(
      recordManualPayment({
        invoiceId: invoice.id,
        amountMinor: 100,
        method: "BANK_TRANSFER",
        recordedById: adminId,
      }),
    ).rejects.toThrow(/not open|exceeds|over-allocate/i);
  });

  it("rejects concurrent over-allocation on same invoice", async () => {
    const { invoice } = await createIssuedInvoice(db, adminId, 600000, "race");

    async function createPendingPayment(amountMinor: number, suffix: string) {
      const ref = await generatePaymentReference();
      return db.agencyPayment.create({
        data: {
          paymentReference: ref,
          provider: "MANUAL",
          status: "PENDING",
          currency: "USD",
          amountMinor,
          method: "BANK_TRANSFER",
          source: "ADMIN_MANUAL",
          recordedById: adminId,
          providerReference: `${PREFIX}-${suffix}`,
          allocations: { create: { invoiceId: invoice.id, amountMinor } },
        },
      });
    }

    const paymentA = await createPendingPayment(400000, "race-a");
    const paymentB = await createPendingPayment(400000, "race-b");

    const results = await Promise.allSettled([
      confirmPaymentSuccess({
        paymentId: paymentA.id,
        amountMinor: 400000,
        currency: "USD",
        source: "WEBHOOK",
      }),
      confirmPaymentSuccess({
        paymentId: paymentB.id,
        amountMinor: 400000,
        currency: "USD",
        source: "VERIFY",
      }),
    ]);

    const succeeded = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;
    expect(succeeded).toBe(1);
    expect(failed).toBe(1);

    const final = await db.agencyInvoice.findUniqueOrThrow({ where: { id: invoice.id } });
    expect(final.amountPaidMinor).toBe(400000);
    expect(final.amountDueMinor).toBe(200000);
  });

  it("confirmPaymentSuccess is idempotent under concurrent calls", async () => {
    const { invoice, contact } = await createIssuedInvoice(db, adminId, 50000, "dup-confirm");
    const portalUser = await getOrCreatePortalUser(db, contact);
    const payment = await initiateInvoicePayment({
      invoiceId: invoice.id,
      portalUserId: portalUser.id,
      contactId: contact.id,
    });

    const [r1, r2] = await Promise.all([
      confirmPaymentSuccess({
        paymentId: payment.id,
        amountMinor: payment.amountMinor,
        currency: "USD",
        source: "WEBHOOK",
      }),
      confirmPaymentSuccess({
        paymentId: payment.id,
        amountMinor: payment.amountMinor,
        currency: "USD",
        source: "VERIFY",
      }),
    ]);

    expect(r1.idempotent !== r2.idempotent || r1.idempotent).toBe(true);

    const allocations = await db.agencyPaymentAllocation.count({ where: { paymentId: payment.id } });
    expect(allocations).toBe(1);

    const inv = await db.agencyInvoice.findUniqueOrThrow({ where: { id: invoice.id } });
    expect(inv.amountPaidMinor).toBe(payment.amountMinor);
  });

  it("sends at most one payment confirmation email on duplicate confirm paths", async () => {
    const emailModule = await import("@/lib/billing/payment-email");
    const emailSpy = vi.spyOn(emailModule, "sendPaymentConfirmationEmail");

    const { invoice, contact } = await createIssuedInvoice(db, adminId, 25000, "email-idem");
    const portalUser = await getOrCreatePortalUser(db, contact);
    const payment = await initiateInvoicePayment({
      invoiceId: invoice.id,
      portalUserId: portalUser.id,
      contactId: contact.id,
    });

    await Promise.all([
      confirmPaymentSuccess({
        paymentId: payment.id,
        amountMinor: payment.amountMinor,
        currency: "USD",
        source: "WEBHOOK",
      }),
      confirmPaymentSuccess({
        paymentId: payment.id,
        amountMinor: payment.amountMinor,
        currency: "USD",
        source: "VERIFY",
      }),
    ]);

    await new Promise((r) => setTimeout(r, 100));

    const updated = await db.agencyPayment.findUniqueOrThrow({ where: { id: payment.id } });
    expect(updated.status).toBe("SUCCEEDED");
    expect(emailSpy.mock.calls.length).toBeLessThanOrEqual(1);

    emailSpy.mockRestore();
  });

  it("marks amount mismatch as NEEDS_REVIEW without allocating", async () => {
    const { invoice, contact } = await createIssuedInvoice(db, adminId, 100000, "mismatch");
    const portalUser = await getOrCreatePortalUser(db, contact);
    const payment = await initiateInvoicePayment({
      invoiceId: invoice.id,
      portalUserId: portalUser.id,
      contactId: contact.id,
    });

    await expect(
      confirmPaymentSuccess({
        paymentId: payment.id,
        amountMinor: payment.amountMinor - 1,
        currency: "USD",
        source: "WEBHOOK",
      }),
    ).rejects.toThrow(/mismatch/i);

    const p = await db.agencyPayment.findUniqueOrThrow({ where: { id: payment.id } });
    expect(p.status).toBe("NEEDS_REVIEW");

    const inv = await db.agencyInvoice.findUniqueOrThrow({ where: { id: invoice.id } });
    expect(inv.amountPaidMinor).toBe(0);
  });

  it("saves and reloads draft invoice line items", async () => {
    const contact = await createIntegrationContact(db, adminId, {
      email: `${PREFIX}-draft@test.local`,
    });
    const invoice = await createManualInvoice({
      createdById: adminId,
      primaryContactId: contact.id,
      currency: "USD",
      memo: `${PREFIX} draft-edit`,
      lineItems: [{ description: "Initial", quantity: 1, unitAmountMinor: 10000, position: 0 }],
    });

    await saveDraftInvoice({
      invoiceId: invoice!.id,
      lineItems: [
        { description: "Line A", quantity: 2, unitAmountMinor: 15000, position: 0 },
        { description: "Line B", quantity: 1, unitAmountMinor: 5000, position: 1 },
        { description: "Line C", quantity: 3, unitAmountMinor: 1000, position: 2 },
      ],
      clientNotes: "Client memo test",
      internalNotes: "Internal only",
      actorUserId: adminId,
    });

    const saved = await db.agencyInvoice.findUniqueOrThrow({
      where: { id: invoice!.id },
      include: { lineItems: { orderBy: { position: "asc" } } },
    });

    expect(saved.lineItems).toHaveLength(3);
    expect(saved.lineItems[0]?.description).toBe("Line A");
    expect(saved.lineItems[0]?.quantity).toBe(2);
    expect(saved.totalMinor).toBe(2 * 15000 + 5000 + 3 * 1000);
    expect(saved.clientNotes).toBe("Client memo test");
    expect(saved.internalNotes).toBe("Internal only");
  });

  it("rejects draft line edits on issued invoice", async () => {
    const { invoice } = await createIssuedInvoice(db, adminId, 10000, "issued-edit");

    await expect(
      saveDraftInvoice({
        invoiceId: invoice.id,
        lineItems: [{ description: "Hack", quantity: 1, unitAmountMinor: 1, position: 0 }],
        actorUserId: adminId,
      }),
    ).rejects.toThrow(/draft/i);
  });

  it("isolates portal invoice access", async () => {
    const contactA = await createIntegrationContact(db, adminId, {
      email: `${PREFIX}-a@test.local`,
    });
    const contactB = await createIntegrationContact(db, adminId, {
      email: `${PREFIX}-b@test.local`,
    });
    const portalA = await db.clientPortalUser.create({
      data: { contactId: contactA.id, email: contactA.email!, status: "ACTIVE" },
    });
    const invoice = await createManualInvoice({
      createdById: adminId,
      primaryContactId: contactA.id,
      currency: "USD",
      memo: `${PREFIX} access`,
      lineItems: [{ description: "Work", quantity: 1, unitAmountMinor: 5000, position: 0 }],
    });
    await grantInvoiceAccess({
      invoiceId: invoice!.id,
      contactId: contactA.id,
      grantedById: adminId,
    });

    expect(await hasInvoiceAccess({ invoiceId: invoice!.id, portalUserId: portalA.id })).toBe(true);
    expect(await hasInvoiceAccess({ invoiceId: invoice!.id, contactId: contactB.id })).toBe(false);
  });

  it("retainer scheduler creates one invoice per period", async () => {
    const company = await db.crmCompany.create({
      data: { name: `${PREFIX} Retainer Co`, ownerId: adminId },
    });
    const retainer = await createRetainer({
      companyId: company.id,
      name: `${PREFIX} Monthly`,
      currency: "USD",
      amountMinor: 50000,
      billingInterval: "MONTHLY",
      lineItemDescription: "Maintenance",
      startDate: new Date(Date.now() - 86400000),
      ownerId: adminId,
      createdById: adminId,
      issueMode: "CREATE_DRAFT",
    });
    await db.agencyRetainer.update({
      where: { id: retainer.id },
      data: { status: "ACTIVE", nextBillingDate: new Date(Date.now() - 3600000) },
    });

    const [first, second] = await Promise.all([
      runRetainerBillingScheduler(),
      runRetainerBillingScheduler(),
    ]);
    expect(first.generated + second.generated).toBe(1);

    const periods = await db.agencyRetainerBillingPeriod.count({
      where: { retainerId: retainer.id },
    });
    expect(periods).toBe(1);
  });
});

describeIntegration("Agency Billing webhook replay — live DB", () => {
  let db: PrismaClient;
  let adminId: string;

  beforeAll(async () => {
    db = getIntegrationPrisma();
    const admin = await createIntegrationAdmin(db);
    adminId = admin.id;
  });

  afterAll(async () => {
    await cleanup(db);
    await disconnectIntegrationPrisma();
  });

  beforeEach(async () => {
    await cleanup(db);
  });

  it("webhook replay does not duplicate financial effect", async () => {
    if (!process.env.PAYSTACK_SECRET_KEY?.trim()) {
      return;
    }

    const { invoice, contact } = await createIssuedInvoice(db, adminId, 30000, "webhook");
    const portalUser = await getOrCreatePortalUser(db, contact);
    const payment = await initiateInvoicePayment({
      invoiceId: invoice.id,
      portalUserId: portalUser.id,
      contactId: contact.id,
    });

    const eventId = `charge.success:${payment.id}`;
    const rawBody = JSON.stringify({
      event: "charge.success",
      data: {
        id: 12345,
        reference: payment.providerReference ?? payment.id,
        status: "success",
        amount: payment.amountMinor,
        currency: "USD",
      },
    });

    const createHmac = await import("node:crypto").then((m) => m.createHmac);
    const sig = createHmac("sha512", process.env.PAYSTACK_SECRET_KEY!)
      .update(rawBody)
      .digest("hex");

    await processPaymentWebhook({ provider: "PAYSTACK", rawBody, signature: sig });
    await processPaymentWebhook({ provider: "PAYSTACK", rawBody, signature: sig });

    const allocations = await db.agencyPaymentAllocation.count({ where: { invoiceId: invoice.id } });
    expect(allocations).toBe(1);

    const inv = await db.agencyInvoice.findUniqueOrThrow({ where: { id: invoice.id } });
    expect(inv.amountPaidMinor).toBe(payment.amountMinor);

    const events = await db.agencyPaymentWebhookEvent.count({
      where: { providerEventId: eventId },
    });
    expect(events).toBe(1);
  });
});
