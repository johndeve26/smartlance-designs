import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import {
  recordCrmActivity,
} from "@/lib/crm/activities";
import {
  CRM_EXPORT_MAX_ROWS,
  CRM_PAGE_SIZE_DEFAULT,
  CRM_PAGE_SIZE_MAX,
} from "@/lib/crm/constants";
import {
  contactDisplayName,
  normalizeCompanyDomain,
  normalizeCrmEmail,
  normalizePhone,
} from "@/lib/crm/normalize";
import type { CrmContactFilters } from "@/lib/crm/schema";
import { syncContactNextActivityAt } from "@/lib/crm/tasks";
import { contactFilterV3ToWhere } from "@/lib/crm/filters/contact-filter-query";
import { normalizeCountryInput, isValidIanaTimezone } from "@/lib/crm/country";

export function escapeCrmCsvCell(value: string) {
  let v = value.replace(/\r\n/g, "\n");
  if (/^[=+\-@]/.test(v)) v = `'${v}`;
  if (/[",\n]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
  return v;
}

function boundedPage(input?: { page?: number; pageSize?: number }) {
  const page = Math.max(1, input?.page ?? 1);
  const pageSize = Math.min(
    input?.pageSize ?? CRM_PAGE_SIZE_DEFAULT,
    CRM_PAGE_SIZE_MAX,
  );
  return { page, pageSize };
}

export async function findContactByNormalizedEmail(email: string) {
  const normalized = normalizeCrmEmail(email);
  if (!normalized) return null;
  return prisma.crmContact.findUnique({
    where: { emailNormalized: normalized },
    include: { company: true },
  });
}

export async function upsertContactFromEnquiry(input: {
  name: string;
  email: string;
  phone?: string | null;
  companyName?: string | null;
  website?: string | null;
  source: Prisma.CrmContactCreateInput["source"];
  sourceUrl?: string | null;
  actorId?: string | null;
}) {
  const normalized = normalizeCrmEmail(input.email);
  if (!normalized) {
    throw new Error("Valid email required for enquiry CRM integration.");
  }

  const existing = await prisma.crmContact.findUnique({
    where: { emailNormalized: normalized },
    include: { company: true },
  });

  const nameParts = input.name.trim();
  const [firstName, ...rest] = nameParts.split(/\s+/);
  const lastName = rest.length ? rest.join(" ") : null;

  let companyId = existing?.companyId ?? null;
  if (input.companyName?.trim() && !companyId) {
    const domain = input.website
      ? normalizeCompanyDomain(input.website)
      : null;
    const company = await prisma.crmCompany.create({
      data: {
        name: input.companyName.trim(),
        website: input.website?.trim() || null,
        domain,
      },
    });
    companyId = company.id;
  }

  if (existing) {
    const updates: Prisma.CrmContactUpdateInput = {};
    if (!existing.firstName && firstName) updates.firstName = firstName;
    if (!existing.lastName && lastName) updates.lastName = lastName;
    if (!existing.displayName && nameParts) updates.displayName = nameParts;
    if (!existing.phone && input.phone) {
      updates.phone = normalizePhone(input.phone);
    }
    if (!existing.companyId && companyId) {
      updates.company = { connect: { id: companyId } };
    }
    if (Object.keys(updates).length) {
      await prisma.crmContact.update({
        where: { id: existing.id },
        data: updates,
      });
    }
    return prisma.crmContact.findUniqueOrThrow({
      where: { id: existing.id },
      include: { company: true },
    });
  }

  let createdNew = true;
  const contact = await prisma.crmContact.create({
    data: {
      firstName: firstName || null,
      lastName,
      displayName: nameParts || null,
      email: input.email.trim(),
      emailNormalized: normalized,
      phone: normalizePhone(input.phone),
      companyId,
      source: input.source,
      sourceUrl: input.sourceUrl?.trim() || null,
      lifecycleStage: "PROSPECT",
      createdById: input.actorId ?? null,
    },
    include: { company: true },
  }).catch(async (err) => {
    const code = (err as { code?: string }).code;
    if (code === "P2002") {
      createdNew = false;
      return prisma.crmContact.findUniqueOrThrow({
        where: { emailNormalized: normalized },
        include: { company: true },
      });
    }
    throw err;
  });

  if (createdNew) {
    await recordCrmActivity({
      contactId: contact.id,
      companyId: contact.companyId,
      type: "CONTACT_CREATED",
      subject: "Contact created",
      metadata: { source: input.source },
      createdById: input.actorId,
    });
  }

  return contact;
}

export async function createContact(input: {
  firstName?: string | null;
  lastName?: string | null;
  displayName?: string | null;
  email?: string | null;
  phone?: string | null;
  jobTitle?: string | null;
  companyId?: string | null;
  lifecycleStage?: Prisma.CrmContactCreateInput["lifecycleStage"];
  source?: Prisma.CrmContactCreateInput["source"];
  sourceDetail?: string | null;
  sourceUrl?: string | null;
  ownerId?: string | null;
  createdById: string;
}) {
  const normalized = input.email ? normalizeCrmEmail(input.email) : null;

  if (normalized) {
    const existing = await prisma.crmContact.findUnique({
      where: { emailNormalized: normalized },
    });
    if (existing) {
      throw new Error("A contact with this email already exists.");
    }
  }

  const contact = await prisma.crmContact.create({
    data: {
      firstName: input.firstName?.trim() || null,
      lastName: input.lastName?.trim() || null,
      displayName: input.displayName?.trim() || null,
      email: input.email?.trim() || null,
      emailNormalized: normalized,
      phone: normalizePhone(input.phone),
      jobTitle: input.jobTitle?.trim() || null,
      companyId: input.companyId || null,
      lifecycleStage: input.lifecycleStage ?? "PROSPECT",
      source: input.source ?? "MANUAL",
      sourceDetail: input.sourceDetail?.trim() || null,
      sourceUrl: input.sourceUrl?.trim() || null,
      ownerId: input.ownerId || null,
      createdById: input.createdById,
    },
    include: { company: true, owner: { select: { id: true, name: true } } },
  });

  await recordCrmActivity({
    contactId: contact.id,
    companyId: contact.companyId,
    type: "CONTACT_CREATED",
    subject: "Contact created manually",
    createdById: input.createdById,
  });

  return contact;
}

export async function getContactById(id: string) {
  return prisma.crmContact.findUnique({
    where: { id },
    include: {
      company: true,
      owner: { select: { id: true, name: true, email: true } },
      leads: {
        orderBy: { createdAt: "desc" },
        include: { owner: { select: { id: true, name: true } } },
      },
      deals: {
        where: { isArchived: false },
        orderBy: { updatedAt: "desc" },
        include: { owner: { select: { id: true, name: true } } },
      },
      tasks: {
        where: { status: "OPEN" },
        orderBy: [{ dueAt: "asc" }, { createdAt: "asc" }],
        take: 10,
        include: { assignedTo: { select: { id: true, name: true } } },
      },
      socialProfiles: { orderBy: { platform: "asc" } },
      propertyValues: {
        include: { definition: true },
        orderBy: { definition: { displayOrder: "asc" } },
      },
    },
  });
}

export async function updateContact(input: {
  contactId: string;
  firstName?: string | null;
  lastName?: string | null;
  displayName?: string | null;
  email?: string | null;
  phone?: string | null;
  jobTitle?: string | null;
  companyId?: string | null;
  source?: Prisma.CrmContactCreateInput["source"];
  sourceDetail?: string | null;
  ownerId?: string | null;
  countryCode?: string | null;
  countryName?: string | null;
  stateRegion?: string | null;
  city?: string | null;
  postalCode?: string | null;
  timezone?: string | null;
  actorId: string;
}) {
  const existing = await prisma.crmContact.findUniqueOrThrow({
    where: { id: input.contactId },
  });

  const normalized = input.email ? normalizeCrmEmail(input.email) : existing.emailNormalized;
  if (input.email && !normalized) throw new Error("Invalid email.");

  if (normalized && normalized !== existing.emailNormalized) {
    const dup = await prisma.crmContact.findUnique({
      where: { emailNormalized: normalized },
    });
    if (dup && dup.id !== input.contactId) {
      throw new Error("A contact with this email already exists.");
    }
  }

  let countryCode = input.countryCode?.trim().toUpperCase() || null;
  let countryName = input.countryName?.trim() || null;
  if (input.countryCode === "" && input.countryName === "") {
    countryCode = null;
    countryName = null;
  } else if (countryName && !countryCode) {
    const c = normalizeCountryInput(countryName);
    if (c) {
      countryCode = c.countryCode;
      countryName = c.countryName;
    }
  } else if (countryCode) {
    const c = normalizeCountryInput(countryCode);
    if (c) {
      countryCode = c.countryCode;
      countryName = c.countryName;
    }
  }

  const timezone = input.timezone?.trim() || null;
  if (timezone && !isValidIanaTimezone(timezone)) {
    throw new Error("Invalid timezone.");
  }

  const contact = await prisma.crmContact.update({
    where: { id: input.contactId },
    data: {
      firstName: input.firstName?.trim() || null,
      lastName: input.lastName?.trim() || null,
      displayName: input.displayName?.trim() || null,
      email: input.email?.trim() || null,
      emailNormalized: normalized,
      phone: normalizePhone(input.phone),
      jobTitle: input.jobTitle?.trim() || null,
      companyId: input.companyId || null,
      source: input.source,
      sourceDetail: input.sourceDetail?.trim() || null,
      ownerId: input.ownerId || null,
      countryCode,
      countryName,
      stateRegion: input.stateRegion?.trim() || null,
      city: input.city?.trim() || null,
      postalCode: input.postalCode?.trim() || null,
      timezone,
    },
    include: { company: true, owner: { select: { id: true, name: true } } },
  });

  return contact;
}

export async function listContacts(filters: CrmContactFilters = {}) {
  const { page, pageSize } = boundedPage(filters);
  let where: Prisma.CrmContactWhereInput = { isArchived: false };

  if (filters.advancedFilter) {
    where = await contactFilterV3ToWhere(filters.advancedFilter);
  }

  if (filters.lifecycle) where.lifecycleStage = filters.lifecycle;
  if (filters.source) where.source = filters.source;
  if (filters.ownerId) where.ownerId = filters.ownerId;
  if (filters.emailStatus) where.emailStatus = filters.emailStatus;
  if (filters.companyId) where.companyId = filters.companyId;
  if (filters.countryCode) where.countryCode = filters.countryCode;

  if (filters.q?.trim()) {
    const q = filters.q.trim();
    const searchOr: Prisma.CrmContactWhereInput[] = [
      { firstName: { contains: q, mode: "insensitive" } },
      { lastName: { contains: q, mode: "insensitive" } },
      { displayName: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
      { phone: { contains: q, mode: "insensitive" } },
      { jobTitle: { contains: q, mode: "insensitive" } },
      { city: { contains: q, mode: "insensitive" } },
      { stateRegion: { contains: q, mode: "insensitive" } },
      { countryName: { contains: q, mode: "insensitive" } },
      { company: { name: { contains: q, mode: "insensitive" } } },
      {
        propertyValues: {
          some: {
            textValue: { contains: q, mode: "insensitive" },
            definition: { objectType: "CONTACT", isActive: true, fieldType: { in: ["TEXT", "MULTILINE_TEXT"] } },
          },
        },
      },
    ];
    where.AND = [...(Array.isArray(where.AND) ? where.AND : where.AND ? [where.AND] : []), { OR: searchOr }];
  }

  if (filters.leadStatus || filters.temperature) {
    const leadFilter: Prisma.CrmLeadWhereInput = {
      ...(filters.leadStatus ? { status: filters.leadStatus } : {}),
      ...(filters.temperature ? { temperature: filters.temperature } : {}),
      status: filters.leadStatus
        ? filters.leadStatus
        : { notIn: ["UNQUALIFIED", "CLOSED"] },
    };
    where.leads = { some: leadFilter };
  }

  if (filters.hasOpenTask) {
    where.tasks = { some: { status: "OPEN" } };
  }

  if (filters.overdueFollowUp) {
    where.nextActivityAt = { lt: new Date() };
  }

  const orderBy: Prisma.CrmContactOrderByWithRelationInput[] = [];
  const dir = filters.sortDir === "asc" ? "asc" : "desc";
  switch (filters.sortField) {
    case "name":
      orderBy.push({ displayName: dir }, { lastName: dir });
      break;
    case "company":
      orderBy.push({ company: { name: dir } });
      break;
    case "lastContactedAt":
      orderBy.push({ lastContactedAt: dir });
      break;
    case "nextActivityAt":
      orderBy.push({ nextActivityAt: dir });
      break;
    case "countryCode":
      orderBy.push({ countryCode: dir });
      break;
    case "lifecycleStage":
      orderBy.push({ lifecycleStage: dir });
      break;
    case "createdAt":
    default:
      orderBy.push({ createdAt: dir });
  }

  const [items, total] = await Promise.all([
    prisma.crmContact.findMany({
      where,
      orderBy: orderBy.length ? orderBy : [{ updatedAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        company: { select: { id: true, name: true } },
        owner: { select: { id: true, name: true } },
        leads: {
          where: { status: { notIn: ["UNQUALIFIED", "CLOSED"] } },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        socialProfiles: { select: { platform: true }, take: 5 },
      },
    }),
    prisma.crmContact.count({ where }),
  ]);

  return { items, total, page, pageSize };
}

export async function archiveContact(input: {
  id: string;
  actorId: string;
}) {
  const contact = await prisma.crmContact.update({
    where: { id: input.id },
    data: { isArchived: true },
  });
  const { onContactArchived } = await import("@/lib/crm/outreach/suppression");
  await onContactArchived(contact.id);
  return contact;
}

export async function updateContactLifecycle(input: {
  contactId: string;
  lifecycleStage: Prisma.CrmContactUpdateInput["lifecycleStage"];
  actorId: string;
}) {
  const before = await prisma.crmContact.findUniqueOrThrow({
    where: { id: input.contactId },
  });
  const contact = await prisma.crmContact.update({
    where: { id: input.contactId },
    data: { lifecycleStage: input.lifecycleStage as never },
  });
  await recordCrmActivity({
    contactId: contact.id,
    type: "LIFECYCLE_CHANGED",
    subject: "Lifecycle stage changed",
    metadata: {
      from: before.lifecycleStage,
      to: input.lifecycleStage,
    },
    createdById: input.actorId,
  });
  return contact;
}

export async function updateContactEmailStatus(input: {
  contactId: string;
  emailStatus: Prisma.CrmContactUpdateInput["emailStatus"];
  actorId: string;
}) {
  const before = await prisma.crmContact.findUniqueOrThrow({
    where: { id: input.contactId },
  });
  const contact = await prisma.crmContact.update({
    where: { id: input.contactId },
    data: { emailStatus: input.emailStatus as never },
  });
  await recordCrmActivity({
    contactId: contact.id,
    type: "EMAIL_STATUS_CHANGED",
    subject: "Email eligibility changed",
    metadata: { from: before.emailStatus, to: input.emailStatus },
    createdById: input.actorId,
  });

  const { onContactEmailStatusChanged } = await import("@/lib/crm/outreach/suppression");
  await onContactEmailStatusChanged({
    contactId: contact.id,
    emailStatus: contact.emailStatus,
    actorId: input.actorId,
  });

  return contact;
}

export async function exportContactsCsv(_actorId: string) {
  const { listContactPropertyDefinitions } = await import("@/lib/crm/properties/definitions");
  const { formatPropertyValueForDisplay } = await import("@/lib/crm/properties/validate");

  const customDefs = await listContactPropertyDefinitions();
  const rows = await prisma.crmContact.findMany({
    where: { isArchived: false },
    orderBy: { createdAt: "desc" },
    take: CRM_EXPORT_MAX_ROWS,
    include: {
      company: { select: { name: true } },
      socialProfiles: true,
      propertyValues: { include: { definition: true } },
    },
  });

  const header = [
    "Name",
    "Email",
    "Phone",
    "Company",
    "Job Title",
    "Country",
    "State/Region",
    "City",
    "Lifecycle",
    "Source",
    "Email Status",
    "LinkedIn",
    "X",
    ...customDefs.map((d) => d.label),
    "Created",
  ].join(",");

  const lines = rows.map((r) => {
    const social = Object.fromEntries(r.socialProfiles.map((s) => [s.platform, s.url]));
    const props = Object.fromEntries(
      r.propertyValues.map((v) => [v.definitionId, v]),
    );
    return [
      contactDisplayName(r),
      r.email ?? "",
      r.phone ?? "",
      r.company?.name ?? "",
      r.jobTitle ?? "",
      r.countryName ?? r.countryCode ?? "",
      r.stateRegion ?? "",
      r.city ?? "",
      r.lifecycleStage,
      r.source,
      r.emailStatus,
      social.LINKEDIN ?? "",
      social.X ?? "",
      ...customDefs.map((d) => {
        const v = props[d.id];
        return v
          ? formatPropertyValueForDisplay(d, {
              textValue: v.textValue,
              numberValue: v.numberValue != null ? Number(v.numberValue) : null,
              booleanValue: v.booleanValue,
              dateValue: v.dateValue,
              jsonValue: Array.isArray(v.jsonValue) ? (v.jsonValue as string[]) : null,
            })
          : "";
      }),
      r.createdAt.toISOString(),
    ]
      .map((c) => escapeCrmCsvCell(String(c)))
      .join(",");
  });

  return [header, ...lines].join("\n");
}

export { contactDisplayName, syncContactNextActivityAt };
