"use server";

import { revalidatePath } from "next/cache";
import { assertSameOrigin, requireAdminUser } from "@/lib/admin/session";
import { assertCan, can } from "@/lib/admin/rbac";
import { isFormRateLimited } from "@/lib/forms";
import { writeAuditLog } from "@/lib/repositories/auditRepository";
import {
  addNoteSchema,
  createCompanySchema,
  createContactSchema,
  createDealSchema,
  createLeadSchema,
  createTaskSchema,
  emailTemplateSchema,
  sendCrmEmailSchema,
  updateDealStageSchema,
  updateEmailStatusSchema,
  updateLeadStatusSchema,
  updateLeadTemperatureSchema,
  updateContactSchema,
} from "@/lib/crm/schema";
import {
  archiveContact,
  createContact,
  exportContactsCsv,
  updateContact,
  updateContactEmailStatus,
} from "@/lib/crm/contacts";
import { createCompany, exportCompaniesCsv } from "@/lib/crm/companies";
import {
  createDeal,
  createDealFromLead,
  exportDealsCsv,
  updateDealStage,
} from "@/lib/crm/deals";
import {
  createLead,
  exportLeadsCsv,
  updateLeadStatus,
  updateLeadTemperature,
} from "@/lib/crm/leads";
import { addNote, cancelTask, completeTask, createTask } from "@/lib/crm/tasks";
import {
  createEmailTemplate,
  sendCrmEmail,
  updateEmailTemplate,
} from "@/lib/crm/email";
import { prisma } from "@/lib/db";

/** FormData.get returns null for missing keys; Zod string unions treat that as "Invalid input". */
function fdStr(formData: FormData, key: string): string {
  const v = formData.get(key);
  return v == null ? "" : String(v);
}

function revalidateCrm() {
  revalidatePath("/admin/crm");
  revalidatePath("/admin/crm/contacts");
  revalidatePath("/admin/crm/companies");
  revalidatePath("/admin/crm/leads");
  revalidatePath("/admin/crm/deals");
  revalidatePath("/admin/crm/tasks");
}

export async function createContactAction(formData: FormData) {
  await assertSameOrigin();
  const user = await requireAdminUser("manage_crm");

  const parsed = createContactSchema.safeParse({
    firstName: fdStr(formData, "firstName"),
    lastName: fdStr(formData, "lastName"),
    displayName: fdStr(formData, "displayName"),
    email: fdStr(formData, "email"),
    phone: fdStr(formData, "phone"),
    jobTitle: fdStr(formData, "jobTitle"),
    companyId: fdStr(formData, "companyId"),
    lifecycleStage: fdStr(formData, "lifecycleStage") || "PROSPECT",
    source: fdStr(formData, "source") || "MANUAL",
    sourceDetail: fdStr(formData, "sourceDetail"),
    sourceUrl: fdStr(formData, "sourceUrl"),
    ownerId: fdStr(formData, "ownerId"),
  });

  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  try {
    const contact = await createContact({
      ...parsed.data,
      companyId: parsed.data.companyId || null,
      ownerId: parsed.data.ownerId || null,
      createdById: user.id,
    });
    revalidateCrm();
    return { ok: true as const, id: contact.id };
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : "Could not create contact.",
    };
  }
}

export async function updateContactAction(formData: FormData) {
  await assertSameOrigin();
  const user = await requireAdminUser("manage_crm");

  const parsed = updateContactSchema.safeParse({
    contactId: fdStr(formData, "contactId"),
    firstName: fdStr(formData, "firstName"),
    lastName: fdStr(formData, "lastName"),
    displayName: fdStr(formData, "displayName"),
    email: fdStr(formData, "email"),
    phone: fdStr(formData, "phone"),
    jobTitle: fdStr(formData, "jobTitle"),
    companyId: fdStr(formData, "companyId"),
    source: fdStr(formData, "source") || undefined,
    sourceDetail: fdStr(formData, "sourceDetail"),
    ownerId: fdStr(formData, "ownerId"),
    countryCode: fdStr(formData, "countryCode"),
    countryName: fdStr(formData, "countryName"),
    stateRegion: fdStr(formData, "stateRegion"),
    city: fdStr(formData, "city"),
    postalCode: fdStr(formData, "postalCode"),
    timezone: fdStr(formData, "timezone"),
  });

  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  try {
    const { contactId, ...data } = parsed.data;
    await updateContact({
      contactId,
      ...data,
      companyId: data.companyId || null,
      ownerId: data.ownerId || null,
      actorId: user.id,
    });

    const { setContactPropertyValues } = await import("@/lib/crm/properties/values");
    const propertyEntries: Array<{ definitionId: string; rawValue: unknown }> = [];
    for (const [key, val] of formData.entries()) {
      if (key.startsWith("property_")) {
        propertyEntries.push({
          definitionId: key.slice(9),
          rawValue: String(val),
        });
      }
    }
    if (propertyEntries.length) {
      await setContactPropertyValues({ contactId, values: propertyEntries });
    }

    const { upsertContactSocialProfile, deleteContactSocialProfile } = await import(
      "@/lib/crm/social-profiles"
    );
    for (const [key, val] of formData.entries()) {
      if (key.startsWith("social_")) {
        const platform = key.slice(7) as import("@prisma/client").CrmSocialPlatform;
        const url = String(val).trim();
        if (url) {
          await upsertContactSocialProfile({ contactId, platform, url });
        } else {
          const existing = await import("@/lib/db").then((m) =>
            m.prisma.crmContactSocialProfile.findFirst({
              where: { contactId, platform },
            }),
          );
          if (existing) await deleteContactSocialProfile(existing.id, contactId);
        }
      }
    }

    revalidateCrm();
    revalidatePath(`/admin/crm/contacts/${contactId}`);
    return { ok: true as const };
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : "Could not update contact.",
    };
  }
}

export async function createCompanyAction(formData: FormData) {
  await assertSameOrigin();
  await requireAdminUser("manage_crm");

  const parsed = createCompanySchema.safeParse({
    name: fdStr(formData, "name"),
    website: fdStr(formData, "website"),
    industry: fdStr(formData, "industry"),
    phone: fdStr(formData, "phone"),
    location: fdStr(formData, "location"),
    address: fdStr(formData, "address"),
    sizeLabel: fdStr(formData, "sizeLabel"),
    description: fdStr(formData, "description"),
    ownerId: fdStr(formData, "ownerId"),
  });

  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  try {
    const company = await createCompany({
      ...parsed.data,
      ownerId: parsed.data.ownerId || null,
    });
    revalidateCrm();
    return { ok: true as const, id: company.id };
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : "Could not create company.",
    };
  }
}

export async function createLeadAction(formData: FormData) {
  await assertSameOrigin();
  const user = await requireAdminUser("manage_crm");

  const parsed = createLeadSchema.safeParse({
    contactId: fdStr(formData, "contactId"),
    companyId: fdStr(formData, "companyId"),
    status: fdStr(formData, "status") || "NEW",
    temperature: fdStr(formData, "temperature") || "COLD",
    source: fdStr(formData, "source") || "MANUAL",
    ownerId: fdStr(formData, "ownerId"),
    interestSummary: fdStr(formData, "interestSummary"),
    servicesInterested: formData.getAll("servicesInterested").map(String),
    estimatedValue: fdStr(formData, "estimatedValue") || undefined,
    currency: fdStr(formData, "currency") || "USD",
  });

  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  try {
    const lead = await createLead({
      ...parsed.data,
      companyId: parsed.data.companyId || null,
      ownerId: parsed.data.ownerId || null,
      createdById: user.id,
    });
    revalidateCrm();
    return { ok: true as const, id: lead.id };
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : "Could not create lead.",
    };
  }
}

export async function updateLeadStatusAction(formData: FormData) {
  await assertSameOrigin();
  const user = await requireAdminUser("manage_crm");

  const parsed = updateLeadStatusSchema.safeParse({
    leadId: fdStr(formData, "leadId"),
    status: fdStr(formData, "status"),
    disqualificationReason: fdStr(formData, "disqualificationReason") || undefined,
    disqualificationNote: fdStr(formData, "disqualificationNote"),
  });

  if (!parsed.success) {
    return { ok: false as const, error: "Invalid lead status." };
  }

  try {
    await updateLeadStatus({ ...parsed.data, actorId: user.id });
    revalidateCrm();
    return { ok: true as const };
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : "Update failed.",
    };
  }
}

export async function updateLeadTemperatureAction(formData: FormData) {
  await assertSameOrigin();
  const user = await requireAdminUser("manage_crm");

  const parsed = updateLeadTemperatureSchema.safeParse({
    leadId: fdStr(formData, "leadId"),
    temperature: fdStr(formData, "temperature"),
  });

  if (!parsed.success) {
    return { ok: false as const, error: "Invalid temperature." };
  }

  try {
    await updateLeadTemperature({ ...parsed.data, actorId: user.id });
    revalidateCrm();
    return { ok: true as const };
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : "Update failed.",
    };
  }
}

export async function createDealAction(formData: FormData) {
  await assertSameOrigin();
  const user = await requireAdminUser("manage_crm");

  const parsed = createDealSchema.safeParse({
    title: fdStr(formData, "title"),
    contactId: fdStr(formData, "contactId"),
    companyId: fdStr(formData, "companyId"),
    leadId: fdStr(formData, "leadId"),
    ownerId: fdStr(formData, "ownerId"),
    stage: fdStr(formData, "stage") || "NEW_OPPORTUNITY",
    amount: fdStr(formData, "amount") || undefined,
    currency: fdStr(formData, "currency") || "USD",
    expectedCloseAt: fdStr(formData, "expectedCloseAt") || undefined,
    servicesInterested: formData.getAll("servicesInterested").map(String),
  });

  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  try {
    const deal = await createDeal({
      ...parsed.data,
      companyId: parsed.data.companyId || null,
      leadId: parsed.data.leadId || null,
      ownerId: parsed.data.ownerId || null,
      createdById: user.id,
    });
    revalidateCrm();
    return { ok: true as const, id: deal.id };
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : "Could not create deal.",
    };
  }
}

export async function createDealFromLeadAction(formData: FormData) {
  await assertSameOrigin();
  const user = await requireAdminUser("manage_crm");
  const leadId = String(formData.get("leadId") || "");
  if (!leadId) return { ok: false as const, error: "Missing lead." };

  try {
    const deal = await createDealFromLead({
      leadId,
      title: String(formData.get("title") || "") || undefined,
      actorId: user.id,
    });
    revalidateCrm();
    return { ok: true as const, id: deal.id };
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : "Could not create deal.",
    };
  }
}

export async function updateDealStageAction(formData: FormData) {
  await assertSameOrigin();
  const user = await requireAdminUser("manage_crm");

  const parsed = updateDealStageSchema.safeParse({
    dealId: fdStr(formData, "dealId"),
    stage: fdStr(formData, "stage"),
    lostReason: fdStr(formData, "lostReason") || undefined,
    lostNote: fdStr(formData, "lostNote"),
  });

  if (!parsed.success) {
    return { ok: false as const, error: "Invalid deal stage." };
  }

  try {
    await updateDealStage({ ...parsed.data, actorId: user.id });
    revalidateCrm();
    return { ok: true as const };
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : "Update failed.",
    };
  }
}

export async function createTaskAction(formData: FormData) {
  await assertSameOrigin();
  const user = await requireAdminUser("manage_crm");

  const parsed = createTaskSchema.safeParse({
    title: fdStr(formData, "title"),
    description: fdStr(formData, "description"),
    contactId: fdStr(formData, "contactId"),
    companyId: fdStr(formData, "companyId"),
    leadId: fdStr(formData, "leadId"),
    dealId: fdStr(formData, "dealId"),
    assignedToId: fdStr(formData, "assignedToId") || user.id,
    priority: fdStr(formData, "priority") || "NORMAL",
    dueAt: fdStr(formData, "dueAt") || undefined,
  });

  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  try {
    const task = await createTask({
      ...parsed.data,
      contactId: parsed.data.contactId || null,
      companyId: parsed.data.companyId || null,
      leadId: parsed.data.leadId || null,
      dealId: parsed.data.dealId || null,
      assignedToId: parsed.data.assignedToId || user.id,
      createdById: user.id,
    });
    revalidateCrm();
    return { ok: true as const, id: task.id };
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : "Could not create task.",
    };
  }
}

export async function completeTaskAction(formData: FormData) {
  await assertSameOrigin();
  const user = await requireAdminUser("manage_crm");
  const taskId = String(formData.get("taskId") || "");
  if (!taskId) return { ok: false as const, error: "Missing task." };

  try {
    await completeTask({ taskId, actorId: user.id });
    revalidateCrm();
    return { ok: true as const };
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : "Could not complete task.",
    };
  }
}

export async function cancelTaskAction(formData: FormData) {
  await assertSameOrigin();
  const user = await requireAdminUser("manage_crm");
  const taskId = String(formData.get("taskId") || "");
  if (!taskId) return { ok: false as const, error: "Missing task." };

  try {
    await cancelTask({ taskId, actorId: user.id });
    revalidateCrm();
    return { ok: true as const };
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : "Could not cancel task.",
    };
  }
}

export async function addNoteAction(formData: FormData) {
  await assertSameOrigin();
  const user = await requireAdminUser("manage_crm");

  const parsed = addNoteSchema.safeParse({
    contactId: fdStr(formData, "contactId"),
    subject: fdStr(formData, "subject"),
    body: fdStr(formData, "body"),
    leadId: fdStr(formData, "leadId"),
    dealId: fdStr(formData, "dealId"),
  });

  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid note." };
  }

  try {
    await addNote({
      ...parsed.data,
      leadId: parsed.data.leadId || null,
      dealId: parsed.data.dealId || null,
      actorId: user.id,
    });
    revalidatePath(`/admin/crm/contacts/${parsed.data.contactId}`);
    return { ok: true as const };
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : "Could not add note.",
    };
  }
}

export async function updateEmailStatusAction(formData: FormData) {
  await assertSameOrigin();
  const user = await requireAdminUser("manage_crm");

  const parsed = updateEmailStatusSchema.safeParse({
    contactId: fdStr(formData, "contactId"),
    emailStatus: fdStr(formData, "emailStatus"),
  });

  if (!parsed.success) {
    return { ok: false as const, error: "Invalid email status." };
  }

  try {
    await updateContactEmailStatus({
      contactId: parsed.data.contactId,
      emailStatus: parsed.data.emailStatus,
      actorId: user.id,
    });
    await writeAuditLog({
      actorId: user.id,
      action: "crm_email_status_change",
      entityType: "CrmContact",
      entityId: parsed.data.contactId,
      metadata: { emailStatus: parsed.data.emailStatus },
    });
    revalidateCrm();
    return { ok: true as const };
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : "Update failed.",
    };
  }
}

export async function archiveContactAction(formData: FormData) {
  await assertSameOrigin();
  const user = await requireAdminUser("manage_crm");
  const id = String(formData.get("id") || "");
  if (!id) return { ok: false as const, error: "Missing contact." };

  try {
    await archiveContact({ id, actorId: user.id });
    await writeAuditLog({
      actorId: user.id,
      action: "crm_contact_archive",
      entityType: "CrmContact",
      entityId: id,
    });
    revalidateCrm();
    return { ok: true as const };
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : "Archive failed.",
    };
  }
}

export async function sendCrmEmailAction(formData: FormData) {
  await assertSameOrigin();
  const user = await requireAdminUser("send_crm_email");

  if (isFormRateLimited(`crm-email:${user.id}`, 10, 15 * 60 * 1000)) {
    return { ok: false as const, error: "Email rate limit reached. Try again later." };
  }

  const parsed = sendCrmEmailSchema.safeParse({
    contactId: fdStr(formData, "contactId"),
    dealId: fdStr(formData, "dealId"),
    subject: fdStr(formData, "subject"),
    body: fdStr(formData, "body"),
    createFollowUpDays: fdStr(formData, "createFollowUpDays") || undefined,
    sendingProfileId: fdStr(formData, "sendingProfileId") || undefined,
    clientRequestId: fdStr(formData, "clientRequestId") || undefined,
  });

  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid email." };
  }

  if (parsed.data.sendingProfileId) {
    assertCan(user.role, "choose_email_sender");
  }

  try {
    const email = await sendCrmEmail({
      ...parsed.data,
      dealId: parsed.data.dealId || null,
      actorId: user.id,
      actorName: user.name,
      createFollowUpDays: parsed.data.createFollowUpDays,
      sendingProfileId: parsed.data.sendingProfileId || null,
      clientRequestId: parsed.data.clientRequestId || null,
    });
    revalidateCrm();
    revalidatePath(`/admin/crm/contacts/${parsed.data.contactId}`);
    return {
      ok: true as const,
      emailId: email.id,
      subject: email.subject,
      sentAt: email.sentAt?.toISOString() ?? new Date().toISOString(),
      fromName: email.fromNameSnapshot,
      fromEmail: email.fromEmailSnapshot,
      deliveryStatus: email.deliveryStatus,
      ambiguous: false as const,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Email send failed.";
    const ambiguous = /timeout|network|ECONNRESET|fetch failed|uncertain/i.test(message);
    return {
      ok: false as const,
      error: ambiguous
        ? "Email status is uncertain. Check Email History before retrying."
        : message,
      ambiguous,
    };
  }
}

export async function sendContactEmailAction(input: {
  contactId: string;
  subject: string;
  body: string;
  createFollowUpDays?: number | null;
  sendingProfileId?: string | null;
  clientRequestId: string;
}) {
  await assertSameOrigin();
  const user = await requireAdminUser("send_crm_email");

  if (isFormRateLimited(`crm-email:${user.id}`, 10, 15 * 60 * 1000)) {
    return { ok: false as const, error: "Email rate limit reached. Try again later.", ambiguous: false as const };
  }

  const parsed = sendCrmEmailSchema.safeParse({
    contactId: input.contactId,
    subject: input.subject,
    body: input.body,
    createFollowUpDays: input.createFollowUpDays ?? undefined,
    sendingProfileId: input.sendingProfileId ?? "",
    clientRequestId: input.clientRequestId,
  });

  if (!parsed.success) {
    return {
      ok: false as const,
      error: parsed.error.issues[0]?.message ?? "Invalid email.",
      ambiguous: false as const,
    };
  }

  if (parsed.data.sendingProfileId) {
    assertCan(user.role, "choose_email_sender");
  }

  // #region agent log
  const { agentDebugLog } = await import("@/lib/debug/agent-log");
  agentDebugLog({
    hypothesisId: "B",
    location: "crm-actions.ts:sendContactEmailAction",
    message: "action parsed sender",
    data: {
      inputSendingProfileId: input.sendingProfileId ?? null,
      parsedSendingProfileId: parsed.data.sendingProfileId || null,
      clientRequestIdPrefix: parsed.data.clientRequestId?.slice(0, 8) ?? null,
    },
  });
  // #endregion

  try {
    const email = await sendCrmEmail({
      contactId: parsed.data.contactId,
      subject: parsed.data.subject,
      body: parsed.data.body,
      actorId: user.id,
      actorName: user.name,
      createFollowUpDays: parsed.data.createFollowUpDays,
      sendingProfileId: parsed.data.sendingProfileId || null,
      clientRequestId: parsed.data.clientRequestId || null,
    });
    // #region agent log
    agentDebugLog({
      hypothesisId: "D",
      location: "crm-actions.ts:sendContactEmailAction:ok",
      message: "action send result snapshots",
      data: {
        emailId: email.id,
        fromNameSnapshot: email.fromNameSnapshot,
        fromEmailSnapshot: email.fromEmailSnapshot,
        sendingProfileId: email.sendingProfileId,
        deliveryStatus: email.deliveryStatus,
        sentAt: email.sentAt?.toISOString() ?? null,
      },
    });
    // #endregion
    revalidateCrm();
    revalidatePath(`/admin/crm/contacts/${parsed.data.contactId}`);
    return {
      ok: true as const,
      emailId: email.id,
      subject: email.subject,
      sentAt: email.sentAt?.toISOString() ?? new Date().toISOString(),
      fromName: email.fromNameSnapshot,
      fromEmail: email.fromEmailSnapshot,
      deliveryStatus: email.deliveryStatus,
      ambiguous: false as const,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Email send failed.";
    const ambiguous = /timeout|network|ECONNRESET|fetch failed|uncertain/i.test(message);
    return {
      ok: false as const,
      error: ambiguous
        ? "Email status is uncertain. Check Email History before retrying."
        : message,
      ambiguous,
    };
  }
}

export async function renderContactEmailTemplateAction(input: {
  contactId: string;
  templateId: string;
}) {
  await assertSameOrigin();
  const user = await requireAdminUser("send_crm_email");

  const template = await prisma.crmEmailTemplate.findFirst({
    where: { id: input.templateId, isActive: true },
  });
  if (!template) {
    return { ok: false as const, error: "Template not found." };
  }

  const contact = await prisma.crmContact.findUnique({
    where: { id: input.contactId },
    include: {
      company: true,
      leads: {
        where: { status: { notIn: ["UNQUALIFIED", "CLOSED"] } },
        take: 1,
      },
    },
  });
  if (!contact) {
    return { ok: false as const, error: "Contact not found." };
  }

  const { renderOutreachEmail } = await import("@/lib/crm/outreach/personalization");
  const rendered = renderOutreachEmail({
    subject: template.subject,
    body: template.body,
    contact,
    senderName: user.name,
  });

  return {
    ok: true as const,
    subject: rendered.subject,
    body: rendered.body,
    hasUnresolved: rendered.hasUnresolved,
  };
}

export async function saveEmailTemplateAction(formData: FormData) {
  await assertSameOrigin();
  const user = await requireAdminUser("manage_crm");
  const id = String(formData.get("id") || "");

  const parsed = emailTemplateSchema.safeParse({
    name: fdStr(formData, "name"),
    subject: fdStr(formData, "subject"),
    body: fdStr(formData, "body"),
    category: fdStr(formData, "category"),
    isActive: fdStr(formData, "isActive") === "on" || fdStr(formData, "isActive") === "true",
  });

  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid template." };
  }

  try {
    if (id) {
      await updateEmailTemplate({ id, ...parsed.data, updatedById: user.id });
    } else {
      await createEmailTemplate({ ...parsed.data, createdById: user.id });
    }
    revalidatePath("/admin/crm/email-templates");
    return { ok: true as const };
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : "Save failed.",
    };
  }
}

export async function exportCrmAction(type: "contacts" | "leads" | "deals" | "companies") {
  await assertSameOrigin();
  const user = await requireAdminUser("view_crm");
  assertCan(user.role, "export_crm");

  if (isFormRateLimited(`crm-export:${user.id}`, 3, 15 * 60 * 1000)) {
    return { ok: false as const, error: "Export rate limit reached." };
  }

  try {
    let csv = "";
    if (type === "contacts") csv = await exportContactsCsv(user.id);
    else if (type === "leads") csv = await exportLeadsCsv();
    else if (type === "deals") csv = await exportDealsCsv();
    else csv = await exportCompaniesCsv();

    await writeAuditLog({
      actorId: user.id,
      action: "crm_export",
      entityType: "Crm",
      metadata: { type },
    });

    return { ok: true as const, csv };
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : "Export failed.",
    };
  }
}

export async function canExportCrmAction() {
  const user = await requireAdminUser("view_crm");
  return can(user.role, "export_crm");
}

export async function canSendCrmEmailAction() {
  const user = await requireAdminUser("view_crm");
  return can(user.role, "send_crm_email");
}
