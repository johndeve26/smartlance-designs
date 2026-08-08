import { createHash, randomBytes } from "node:crypto";
import type {
  EnquiryStatus,
  EnquiryType,
  NotificationStatus,
  Prisma,
} from "@prisma/client";
import { hasDatabaseUrl, prisma } from "@/lib/db";
import { writeAuditLog } from "@/lib/repositories/auditRepository";
import {
  deliverFormSubmission,
  formDeliveryConfigured,
} from "@/lib/forms";
import type { ContactFormValues, WebsiteReviewValues } from "@/lib/validations";
import { getPublicSettings } from "@/lib/repositories/siteSettingsRepository";

export type EnquiryListFilters = {
  type?: EnquiryType;
  status?: EnquiryStatus | EnquiryStatus[];
  notificationStatus?: NotificationStatus;
  q?: string;
  from?: Date;
  to?: Date;
  includeSpam?: boolean;
  includeAnonymized?: boolean;
  page?: number;
  pageSize?: number;
};

function yearPrefix() {
  return new Date().getUTCFullYear().toString();
}

export async function generateEnquiryReference(type: EnquiryType) {
  const prefix = type === "CONTACT" ? "ENQ" : "REV";
  for (let i = 0; i < 8; i++) {
    const suffix = randomBytes(3).toString("hex").toUpperCase();
    const reference = `${prefix}-${yearPrefix()}-${suffix}`;
    const existing = await prisma.enquiry.findUnique({
      where: { reference },
      select: { id: true },
    });
    if (!existing) return reference;
  }
  return `${prefix}-${yearPrefix()}-${randomBytes(6).toString("hex").toUpperCase()}`;
}

export function escapeCsvCell(value: string) {
  let v = value.replace(/\r\n/g, "\n");
  if (/^[=+\-@]/.test(v)) {
    v = `'${v}`;
  }
  if (/[",\n]/.test(v)) {
    return `"${v.replace(/"/g, '""')}"`;
  }
  return v;
}

export async function countNewEnquiries() {
  if (!hasDatabaseUrl()) return { contact: 0, review: 0, total: 0 };
  const [contact, review] = await Promise.all([
    prisma.enquiry.count({
      where: { type: "CONTACT", status: "NEW", isAnonymized: false },
    }),
    prisma.enquiry.count({
      where: { type: "WEBSITE_REVIEW", status: "NEW", isAnonymized: false },
    }),
  ]);
  return { contact, review, total: contact + review };
}

export async function countNotificationFailures(sinceHours = 24) {
  if (!hasDatabaseUrl()) return 0;
  const since = new Date(Date.now() - sinceHours * 60 * 60 * 1000);
  return prisma.enquiry.count({
    where: {
      notificationStatus: "FAILED",
      notificationAttemptedAt: { gte: since },
    },
  });
}

export async function listEnquiries(filters: EnquiryListFilters = {}) {
  if (!hasDatabaseUrl()) {
    return { items: [], total: 0, page: 1, pageSize: 25 };
  }
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(filters.pageSize ?? 25, 100);
  const where: Prisma.EnquiryWhereInput = {};

  if (filters.type) where.type = filters.type;
  if (filters.notificationStatus) {
    where.notificationStatus = filters.notificationStatus;
  }
  if (filters.status) {
    where.status = Array.isArray(filters.status)
      ? { in: filters.status }
      : filters.status;
  } else if (!filters.includeSpam) {
    where.status = { not: "SPAM" };
  }
  if (!filters.includeAnonymized) {
    where.isAnonymized = false;
  }
  if (filters.from || filters.to) {
    where.submittedAt = {};
    if (filters.from) where.submittedAt.gte = filters.from;
    if (filters.to) where.submittedAt.lte = filters.to;
  }
  if (filters.q?.trim()) {
    const q = filters.q.trim();
    where.OR = [
      { reference: { contains: q, mode: "insensitive" } },
      { name: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
      { websiteUrl: { contains: q, mode: "insensitive" } },
      { company: { contains: q, mode: "insensitive" } },
      { service: { contains: q, mode: "insensitive" } },
      { mainConcern: { contains: q, mode: "insensitive" } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.enquiry.findMany({
      where,
      orderBy: { submittedAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        reference: true,
        type: true,
        status: true,
        name: true,
        email: true,
        company: true,
        websiteUrl: true,
        service: true,
        mainConcern: true,
        submittedAt: true,
        notificationStatus: true,
        isAnonymized: true,
      },
    }),
    prisma.enquiry.count({ where }),
  ]);

  return { items, total, page, pageSize };
}

export async function getEnquiryById(id: string) {
  if (!hasDatabaseUrl()) return null;
  return prisma.enquiry.findUnique({
    where: { id },
    include: {
      notes: {
        orderBy: { createdAt: "asc" },
        include: {
          author: { select: { id: true, name: true, email: true } },
        },
      },
      updatedBy: { select: { id: true, name: true, email: true } },
    },
  });
}

export type SubmitResult =
  | {
      ok: true;
      code: "RECEIVED";
      reference: string;
      notificationStatus: NotificationStatus;
    }
  | {
      ok: false;
      code: "FORM_DISABLED" | "SUBMISSION_FAILED" | "VALIDATION_ERROR";
      message: string;
    };

async function attemptNotification(input: {
  enquiryId: string;
  type: EnquiryType;
  reference: string;
  payload: Record<string, unknown>;
}) {
  const deliveryType =
    input.type === "CONTACT" ? "contact" : "website-review";
  const result = await deliverFormSubmission({
    type: deliveryType,
    payload: {
      ...input.payload,
      reference: input.reference,
      adminPath:
        input.type === "CONTACT"
          ? `/admin/enquiries/contact/${input.enquiryId}`
          : `/admin/enquiries/reviews/${input.enquiryId}`,
    },
  });

  const notificationStatus: NotificationStatus = result.delivered
    ? "SENT"
    : "FAILED";
  const errorDetail = result.results
    .filter((r) => !r.ok)
    .map((r) => `${r.channel}:${r.detail || "failed"}`)
    .join("; ")
    .slice(0, 400);

  await prisma.enquiry.update({
    where: { id: input.enquiryId },
    data: {
      notificationStatus,
      notificationAttemptedAt: new Date(),
      notificationErrorCode: result.delivered ? null : "DELIVERY_FAILED",
      lastNotificationError: result.delivered ? null : errorDetail || "Delivery failed",
      notificationProviderId: result.mode,
    },
  });

  return notificationStatus;
}

export async function submitContactEnquiry(input: {
  data: Omit<ContactFormValues, "_gotcha">;
  sourcePath?: string;
}): Promise<SubmitResult> {
  if (!hasDatabaseUrl()) {
    return {
      ok: false,
      code: "SUBMISSION_FAILED",
      message: "Enquiry storage is unavailable.",
    };
  }

  const settings = await getPublicSettings();
  if (!settings.contactFormEnabled) {
    return {
      ok: false,
      code: "FORM_DISABLED",
      message: "The contact form is temporarily unavailable.",
    };
  }

  const reference = await generateEnquiryReference("CONTACT");
  let enquiry;
  try {
    enquiry = await prisma.enquiry.create({
      data: {
        reference,
        type: "CONTACT",
        status: "NEW",
        name: input.data.name,
        email: input.data.email,
        company: input.data.company || null,
        websiteUrl: input.data.website || null,
        service: input.data.service,
        projectDetails: input.data.projectDetails,
        budget: input.data.budget || null,
        timeline: input.data.timeline || null,
        referralSource: input.data.referralSource || null,
        sourcePath: input.sourcePath || "/contact",
        notificationStatus: "NOT_ATTEMPTED",
      },
    });
  } catch {
    return {
      ok: false,
      code: "SUBMISSION_FAILED",
      message: "We could not save your enquiry.",
    };
  }

  await writeAuditLog({
    action: "enquiry_created",
    entityType: "Enquiry",
    entityId: enquiry.id,
    metadata: { type: "CONTACT", reference },
  });

  const notificationStatus = await attemptNotification({
    enquiryId: enquiry.id,
    type: "CONTACT",
    reference,
    payload: {
      name: input.data.name,
      email: input.data.email,
      company: input.data.company,
      website: input.data.website,
      service: input.data.service,
      projectDetails: input.data.projectDetails,
      budget: input.data.budget,
      timeline: input.data.timeline,
      referralSource: input.data.referralSource,
    },
  });

  return {
    ok: true,
    code: "RECEIVED",
    reference,
    notificationStatus,
  };
}

export async function submitWebsiteReviewEnquiry(input: {
  data: Omit<WebsiteReviewValues, "_gotcha">;
  sourcePath?: string;
}): Promise<SubmitResult> {
  if (!hasDatabaseUrl()) {
    return {
      ok: false,
      code: "SUBMISSION_FAILED",
      message: "Enquiry storage is unavailable.",
    };
  }

  const settings = await getPublicSettings();
  if (!settings.freeReviewFormEnabled) {
    return {
      ok: false,
      code: "FORM_DISABLED",
      message: "The free website review form is temporarily unavailable.",
    };
  }

  const reference = await generateEnquiryReference("WEBSITE_REVIEW");
  let enquiry;
  try {
    enquiry = await prisma.enquiry.create({
      data: {
        reference,
        type: "WEBSITE_REVIEW",
        status: "NEW",
        name: input.data.name,
        email: input.data.email,
        websiteUrl: input.data.website,
        mainConcern: input.data.mainConcern,
        sourcePath: input.sourcePath || "/free-website-review",
        notificationStatus: "NOT_ATTEMPTED",
      },
    });
  } catch {
    return {
      ok: false,
      code: "SUBMISSION_FAILED",
      message: "We could not save your request.",
    };
  }

  await writeAuditLog({
    action: "enquiry_created",
    entityType: "Enquiry",
    entityId: enquiry.id,
    metadata: { type: "WEBSITE_REVIEW", reference },
  });

  const notificationStatus = await attemptNotification({
    enquiryId: enquiry.id,
    type: "WEBSITE_REVIEW",
    reference,
    payload: {
      name: input.data.name,
      email: input.data.email,
      website: input.data.website,
      mainConcern: input.data.mainConcern,
    },
  });

  return {
    ok: true,
    code: "RECEIVED",
    reference,
    notificationStatus,
  };
}

export async function updateEnquiryStatus(input: {
  id: string;
  status: EnquiryStatus;
  actorId: string;
}) {
  const existing = await prisma.enquiry.findUnique({ where: { id: input.id } });
  if (!existing) throw new Error("Enquiry not found.");
  if (existing.isAnonymized && input.status !== "CLOSED" && input.status !== "SPAM") {
    throw new Error("Anonymized enquiries have limited status changes.");
  }

  const updated = await prisma.enquiry.update({
    where: { id: input.id },
    data: {
      status: input.status,
      statusChangedAt: new Date(),
      updatedById: input.actorId,
    },
  });

  const auditAction =
    input.status === "SPAM"
      ? "enquiry_mark_spam"
      : existing.status === "SPAM"
        ? "enquiry_restore"
        : "enquiry_status_change";

  await writeAuditLog({
    actorId: input.actorId,
    action: auditAction,
    entityType: "Enquiry",
    entityId: updated.id,
    metadata: {
      from: existing.status,
      to: input.status,
      reference: existing.reference,
      type: existing.type,
    },
  });

  return updated;
}

export async function addEnquiryNote(input: {
  enquiryId: string;
  body: string;
  actorId: string;
}) {
  const body = input.body.trim();
  if (!body) throw new Error("Note cannot be empty.");
  if (body.length > 5000) throw new Error("Note is too long.");

  const enquiry = await prisma.enquiry.findUnique({
    where: { id: input.enquiryId },
    select: { id: true, reference: true, type: true, isAnonymized: true },
  });
  if (!enquiry) throw new Error("Enquiry not found.");
  if (enquiry.isAnonymized) {
    throw new Error("Cannot add notes to an anonymized enquiry.");
  }

  const note = await prisma.enquiryNote.create({
    data: {
      enquiryId: input.enquiryId,
      authorId: input.actorId,
      body,
    },
  });

  await writeAuditLog({
    actorId: input.actorId,
    action: "enquiry_note_add",
    entityType: "Enquiry",
    entityId: input.enquiryId,
    metadata: { noteId: note.id, reference: enquiry.reference },
  });

  return note;
}

export async function retryEnquiryNotification(input: {
  id: string;
  actorId: string;
}) {
  const enquiry = await prisma.enquiry.findUnique({ where: { id: input.id } });
  if (!enquiry) throw new Error("Enquiry not found.");
  if (enquiry.isAnonymized) {
    throw new Error("Cannot retry notification for anonymized enquiry.");
  }
  if (!(await formDeliveryConfigured())) {
    throw new Error("Notification provider is not configured.");
  }

  // Soft rate limit retries per enquiry (in-process via hashing key in forms)
  const payload: Record<string, unknown> =
    enquiry.type === "CONTACT"
      ? {
          name: enquiry.name,
          email: enquiry.email,
          company: enquiry.company,
          website: enquiry.websiteUrl,
          service: enquiry.service,
          projectDetails: enquiry.projectDetails,
          budget: enquiry.budget,
          timeline: enquiry.timeline,
          referralSource: enquiry.referralSource,
        }
      : {
          name: enquiry.name,
          email: enquiry.email,
          website: enquiry.websiteUrl,
          mainConcern: enquiry.mainConcern,
        };

  const status = await attemptNotification({
    enquiryId: enquiry.id,
    type: enquiry.type,
    reference: enquiry.reference,
    payload,
  });

  await writeAuditLog({
    actorId: input.actorId,
    action: "enquiry_notification_retry",
    entityType: "Enquiry",
    entityId: enquiry.id,
    metadata: {
      reference: enquiry.reference,
      notificationStatus: status,
    },
  });

  return status;
}

export async function anonymizeEnquiry(input: {
  id: string;
  actorId: string;
}) {
  const enquiry = await prisma.enquiry.findUnique({
    where: { id: input.id },
    include: { notes: true },
  });
  if (!enquiry) throw new Error("Enquiry not found.");
  if (enquiry.isAnonymized) return enquiry;

  // Clear notes that may contain PII
  if (enquiry.notes.length) {
    await prisma.enquiryNote.deleteMany({ where: { enquiryId: enquiry.id } });
  }

  const updated = await prisma.enquiry.update({
    where: { id: enquiry.id },
    data: {
      name: null,
      email: null,
      company: null,
      websiteUrl: null,
      service: null,
      projectDetails: null,
      budget: null,
      timeline: null,
      referralSource: null,
      mainConcern: null,
      lastNotificationError: null,
      notificationProviderId: null,
      isAnonymized: true,
      anonymizedAt: new Date(),
      status: enquiry.status === "SPAM" ? "SPAM" : "CLOSED",
      statusChangedAt: new Date(),
      updatedById: input.actorId,
    },
  });

  await writeAuditLog({
    actorId: input.actorId,
    action: "enquiry_anonymize",
    entityType: "Enquiry",
    entityId: enquiry.id,
    metadata: {
      reference: enquiry.reference,
      type: enquiry.type,
    },
  });

  return updated;
}

export async function permanentlyDeleteEnquiry(input: {
  id: string;
  actorId: string;
}) {
  const enquiry = await prisma.enquiry.findUnique({
    where: { id: input.id },
    select: { id: true, reference: true, type: true },
  });
  if (!enquiry) throw new Error("Enquiry not found.");

  await prisma.enquiry.delete({ where: { id: enquiry.id } });

  await writeAuditLog({
    actorId: input.actorId,
    action: "enquiry_delete",
    entityType: "Enquiry",
    entityId: enquiry.id,
    metadata: {
      reference: enquiry.reference,
      type: enquiry.type,
    },
  });
}

export async function exportEnquiriesCsv(input: {
  filters: EnquiryListFilters;
  actorId: string;
  includeNotes?: boolean;
}) {
  if (!hasDatabaseUrl()) {
    throw new Error("Database unavailable.");
  }

  const EXPORT_MAX = 2000;
  const where: Prisma.EnquiryWhereInput = { isAnonymized: false };
  if (input.filters.type) where.type = input.filters.type;
  if (input.filters.status) {
    where.status = Array.isArray(input.filters.status)
      ? { in: input.filters.status }
      : input.filters.status;
  } else if (!input.filters.includeSpam) {
    where.status = { not: "SPAM" };
  } else if (input.filters.includeSpam) {
    // include all statuses including spam
  }

  const items = await prisma.enquiry.findMany({
    where,
    orderBy: { submittedAt: "desc" },
    take: EXPORT_MAX,
  });

  const header = [
    "reference",
    "type",
    "status",
    "name",
    "email",
    "company",
    "websiteUrl",
    "service",
    "mainConcern",
    "budget",
    "timeline",
    "referralSource",
    "submittedAt",
    "notificationStatus",
  ];

  const rows: string[][] = [header];
  for (const full of items) {
    rows.push([
      full.reference,
      full.type,
      full.status,
      full.name || "",
      full.email || "",
      full.company || "",
      full.websiteUrl || "",
      full.service || "",
      full.mainConcern || "",
      full.budget || "",
      full.timeline || "",
      full.referralSource || "",
      full.submittedAt.toISOString(),
      full.notificationStatus,
    ]);
  }

  const csv = rows
    .map((row) => row.map((cell) => escapeCsvCell(String(cell))).join(","))
    .join("\n");

  await writeAuditLog({
    actorId: input.actorId,
    action: "enquiry_export",
    entityType: "Enquiry",
    entityId: null,
    metadata: {
      count: items.length,
      cappedAt: EXPORT_MAX,
      type: input.filters.type || "ALL",
      includeNotes: Boolean(input.includeNotes),
    },
  });

  return csv;
}

/** Short-lived operational hash — not stored on Enquiry records. */
export function hashIpForRateLimit(ip: string) {
  return createHash("sha256").update(ip).digest("hex").slice(0, 16);
}
