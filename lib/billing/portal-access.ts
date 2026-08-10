import { prisma } from "@/lib/db";

async function ensurePortalUser(contactId: string) {
  const contact = await prisma.crmContact.findUniqueOrThrow({ where: { id: contactId } });
  if (!contact.email?.trim()) throw new Error("Contact must have an email.");
  return prisma.clientPortalUser.upsert({
    where: { contactId },
    create: { contactId, email: contact.email.trim().toLowerCase(), status: "INVITED" },
    update: { email: contact.email.trim().toLowerCase() },
  });
}

export async function grantInvoiceAccess(input: {
  invoiceId: string;
  contactId: string;
  role?: "BILLING_ADMIN" | "VIEWER";
  grantedById: string;
}) {
  const portalUser = await ensurePortalUser(input.contactId);
  return prisma.agencyInvoiceClientAccess.upsert({
    where: {
      invoiceId_contactId: { invoiceId: input.invoiceId, contactId: input.contactId },
    },
    create: {
      invoiceId: input.invoiceId,
      contactId: input.contactId,
      portalUserId: portalUser.id,
      role: (input.role ?? "BILLING_ADMIN") as never,
      grantedById: input.grantedById,
    },
    update: {
      portalUserId: portalUser.id,
      role: (input.role ?? "BILLING_ADMIN") as never,
      revokedAt: null,
      grantedById: input.grantedById,
      grantedAt: new Date(),
    },
  });
}

export async function hasInvoiceAccess(input: {
  invoiceId: string;
  portalUserId?: string;
  contactId?: string;
}) {
  const invoiceAccess = await prisma.agencyInvoiceClientAccess.findFirst({
    where: {
      invoiceId: input.invoiceId,
      revokedAt: null,
      ...(input.portalUserId
        ? { portalUserId: input.portalUserId }
        : { contactId: input.contactId! }),
    },
  });
  if (invoiceAccess) return true;

  if (!input.contactId && input.portalUserId) {
    const user = await prisma.clientPortalUser.findUnique({
      where: { id: input.portalUserId },
      select: { contactId: true },
    });
    if (!user) return false;
    input.contactId = user.contactId;
  }

  const invoice = await prisma.agencyInvoice.findUnique({
    where: { id: input.invoiceId },
    select: { companyId: true },
  });
  if (!invoice?.companyId || !input.contactId) return false;

  const companyAccess = await prisma.agencyClientBillingAccess.findFirst({
    where: {
      contactId: input.contactId,
      companyId: invoice.companyId,
      revokedAt: null,
    },
  });
  return Boolean(companyAccess);
}

export async function assertInvoiceAccess(input: {
  invoiceId: string;
  portalUserId: string;
  contactId: string;
}) {
  const allowed = await hasInvoiceAccess(input);
  if (!allowed) throw new Error("You do not have access to this invoice.");
}

export async function canPayInvoice(input: {
  invoiceId: string;
  portalUserId: string;
  contactId: string;
}) {
  const access = await prisma.agencyInvoiceClientAccess.findFirst({
    where: {
      invoiceId: input.invoiceId,
      portalUserId: input.portalUserId,
      revokedAt: null,
      role: "BILLING_ADMIN",
    },
  });
  if (access) return true;

  const invoice = await prisma.agencyInvoice.findUnique({
    where: { id: input.invoiceId },
    select: { companyId: true },
  });
  if (!invoice?.companyId) return false;

  const companyAccess = await prisma.agencyClientBillingAccess.findFirst({
    where: {
      contactId: input.contactId,
      companyId: invoice.companyId,
      revokedAt: null,
      role: "BILLING_ADMIN",
    },
  });
  return Boolean(companyAccess);
}

export async function recordInvoiceView(input: {
  invoiceId: string;
  portalUserId: string;
}) {
  const access = await prisma.agencyInvoiceClientAccess.findFirst({
    where: { invoiceId: input.invoiceId, portalUserId: input.portalUserId, revokedAt: null },
  });
  if (!access) return;

  const now = new Date();
  const isFirst = !access.firstViewedAt;
  await prisma.agencyInvoiceClientAccess.update({
    where: { id: access.id },
    data: {
      firstViewedAt: access.firstViewedAt ?? now,
      lastViewedAt: now,
    },
  });

  if (isFirst) {
    await prisma.agencyBillingActivity.create({
      data: {
        invoiceId: input.invoiceId,
        type: "INVOICE_VIEWED",
        summary: "Invoice viewed by client.",
        actorPortalUserId: input.portalUserId,
        clientVisible: true,
      },
    });
  }
}

export async function listAccessibleInvoices(portalUserId: string) {
  const [direct, user] = await Promise.all([
    prisma.agencyInvoiceClientAccess.findMany({
      where: { portalUserId, revokedAt: null },
      include: {
        invoice: {
          include: { company: { select: { id: true, name: true } } },
        },
      },
      orderBy: { grantedAt: "desc" },
    }),
    prisma.clientPortalUser.findUnique({
      where: { id: portalUserId },
      select: { contactId: true },
    }),
  ]);

  const companyRows = user
    ? await prisma.agencyClientBillingAccess.findMany({
        where: { contactId: user.contactId, revokedAt: null },
        select: { companyId: true },
      })
    : [];

  const companyIds = companyRows.map((r) => r.companyId).filter(Boolean) as string[];
  const companyInvoices = companyIds.length
    ? await prisma.agencyInvoice.findMany({
        where: {
          companyId: { in: companyIds },
          status: { not: "DRAFT" },
        },
        include: { company: { select: { id: true, name: true } } },
        orderBy: { updatedAt: "desc" },
      })
    : [];

  const seen = new Set<string>();
  const items = [];
  for (const row of direct) {
    if (seen.has(row.invoice.id)) continue;
    seen.add(row.invoice.id);
    items.push({ role: row.role, invoice: row.invoice });
  }
  for (const inv of companyInvoices) {
    if (seen.has(inv.id)) continue;
    seen.add(inv.id);
    items.push({ role: "VIEWER" as const, invoice: inv });
  }
  return items;
}
