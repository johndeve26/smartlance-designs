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
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    displayName: formData.get("displayName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    jobTitle: formData.get("jobTitle"),
    companyId: formData.get("companyId"),
    lifecycleStage: formData.get("lifecycleStage") || "PROSPECT",
    source: formData.get("source") || "MANUAL",
    sourceDetail: formData.get("sourceDetail"),
    sourceUrl: formData.get("sourceUrl"),
    ownerId: formData.get("ownerId"),
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
    contactId: formData.get("contactId"),
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    displayName: formData.get("displayName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    jobTitle: formData.get("jobTitle"),
    companyId: formData.get("companyId"),
    source: formData.get("source"),
    sourceDetail: formData.get("sourceDetail"),
    ownerId: formData.get("ownerId"),
    countryCode: formData.get("countryCode"),
    countryName: formData.get("countryName"),
    stateRegion: formData.get("stateRegion"),
    city: formData.get("city"),
    postalCode: formData.get("postalCode"),
    timezone: formData.get("timezone"),
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
    name: formData.get("name"),
    website: formData.get("website"),
    industry: formData.get("industry"),
    phone: formData.get("phone"),
    location: formData.get("location"),
    address: formData.get("address"),
    sizeLabel: formData.get("sizeLabel"),
    description: formData.get("description"),
    ownerId: formData.get("ownerId"),
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
    contactId: formData.get("contactId"),
    companyId: formData.get("companyId"),
    status: formData.get("status") || "NEW",
    temperature: formData.get("temperature") || "COLD",
    source: formData.get("source") || "MANUAL",
    ownerId: formData.get("ownerId"),
    interestSummary: formData.get("interestSummary"),
    servicesInterested: formData.getAll("servicesInterested"),
    estimatedValue: formData.get("estimatedValue") || undefined,
    currency: formData.get("currency") || "USD",
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
    leadId: formData.get("leadId"),
    status: formData.get("status"),
    disqualificationReason: formData.get("disqualificationReason") || undefined,
    disqualificationNote: formData.get("disqualificationNote"),
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
    leadId: formData.get("leadId"),
    temperature: formData.get("temperature"),
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
    title: formData.get("title"),
    contactId: formData.get("contactId"),
    companyId: formData.get("companyId"),
    leadId: formData.get("leadId"),
    ownerId: formData.get("ownerId"),
    stage: formData.get("stage") || "NEW_OPPORTUNITY",
    amount: formData.get("amount") || undefined,
    currency: formData.get("currency") || "USD",
    expectedCloseAt: formData.get("expectedCloseAt") || undefined,
    servicesInterested: formData.getAll("servicesInterested"),
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
    dealId: formData.get("dealId"),
    stage: formData.get("stage"),
    lostReason: formData.get("lostReason") || undefined,
    lostNote: formData.get("lostNote"),
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
    title: formData.get("title"),
    description: formData.get("description"),
    contactId: formData.get("contactId"),
    companyId: formData.get("companyId"),
    leadId: formData.get("leadId"),
    dealId: formData.get("dealId"),
    assignedToId: formData.get("assignedToId") || user.id,
    priority: formData.get("priority") || "NORMAL",
    dueAt: formData.get("dueAt") || undefined,
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
    contactId: formData.get("contactId"),
    subject: formData.get("subject"),
    body: formData.get("body"),
    leadId: formData.get("leadId"),
    dealId: formData.get("dealId"),
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
    contactId: formData.get("contactId"),
    emailStatus: formData.get("emailStatus"),
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
    contactId: formData.get("contactId"),
    dealId: formData.get("dealId"),
    subject: formData.get("subject"),
    body: formData.get("body"),
    createFollowUpDays: formData.get("createFollowUpDays") || undefined,
    sendingProfileId: formData.get("sendingProfileId") || undefined,
  });

  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid email." };
  }

  if (parsed.data.sendingProfileId) {
    assertCan(user.role, "choose_email_sender");
  }

  try {
    await sendCrmEmail({
      ...parsed.data,
      dealId: parsed.data.dealId || null,
      actorId: user.id,
      actorName: user.name,
      createFollowUpDays: parsed.data.createFollowUpDays,
      sendingProfileId: parsed.data.sendingProfileId || null,
    });
    revalidateCrm();
    return { ok: true as const };
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : "Email send failed.",
    };
  }
}

export async function saveEmailTemplateAction(formData: FormData) {
  await assertSameOrigin();
  const user = await requireAdminUser("manage_crm");
  const id = String(formData.get("id") || "");

  const parsed = emailTemplateSchema.safeParse({
    name: formData.get("name"),
    subject: formData.get("subject"),
    body: formData.get("body"),
    category: formData.get("category"),
    isActive: formData.get("isActive") === "on" || formData.get("isActive") === "true",
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
