"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { assertSameOrigin, requireAdminUser } from "@/lib/admin/session";
import { writeAuditLog } from "@/lib/repositories/auditRepository";
import { CRM_BULK_MAX_IDS } from "@/lib/crm/constants";
import {
  formatBulkResultMessage,
  type BulkMutationResult,
} from "@/lib/crm/bulk";
import {
  bulkDeleteContacts,
  bulkUpdateContactLifecycle,
} from "@/lib/crm/contacts";
import {
  bulkDeleteLeads,
  bulkUpdateLeadStatus,
  bulkUpdateLeadTemperature,
} from "@/lib/crm/leads";

const idsSchema = z
  .array(z.string().cuid())
  .min(1)
  .max(CRM_BULK_MAX_IDS);

const lifecycleSchema = z.enum([
  "PROSPECT",
  "LEAD",
  "OPPORTUNITY",
  "CLIENT",
  "PAST_CLIENT",
  "OTHER",
]);

const leadStatusSchema = z.enum([
  "NEW",
  "ATTEMPTING",
  "CONNECTED",
  "QUALIFIED",
  "UNQUALIFIED",
  "BAD_TIMING",
  "CLOSED",
]);

const temperatureSchema = z.enum(["COLD", "WARM", "HOT"]);

function revalidateCrmLists() {
  revalidatePath("/admin/crm");
  revalidatePath("/admin/crm/contacts");
  revalidatePath("/admin/crm/leads");
  revalidatePath("/admin/crm/deals");
  revalidatePath("/admin/crm/tasks");
}

function toActionResult(
  result: BulkMutationResult,
  noun: string,
): { ok: boolean; message: string } {
  const message = formatBulkResultMessage(result, noun);
  if (result.updated + result.deleted === 0) {
    return { ok: false, message };
  }
  // Partial success still ok so selection clears; failures are in the message.
  return { ok: true, message };
}

export async function bulkUpdateContactLifecycleAction(input: {
  ids: string[];
  lifecycleStage: string;
}) {
  await assertSameOrigin();
  const user = await requireAdminUser("manage_crm");

  const ids = idsSchema.safeParse(input.ids);
  const stage = lifecycleSchema.safeParse(input.lifecycleStage);
  if (!ids.success || !stage.success) {
    return { ok: false as const, message: "Invalid input." };
  }

  const result = await bulkUpdateContactLifecycle({
    ids: ids.data,
    lifecycleStage: stage.data,
    actorId: user.id,
  });

  await writeAuditLog({
    actorId: user.id,
    action: "crm_bulk_contact_lifecycle",
    entityType: "CrmContact",
    metadata: {
      ids: ids.data,
      lifecycleStage: stage.data,
      updated: result.updated,
      failed: result.failed.length,
    },
  });

  revalidateCrmLists();
  return toActionResult(result, "contact(s)");
}

export async function bulkDeleteContactsAction(input: { ids: string[] }) {
  await assertSameOrigin();
  const user = await requireAdminUser("manage_crm");

  const ids = idsSchema.safeParse(input.ids);
  if (!ids.success) {
    return { ok: false as const, message: "Invalid input." };
  }

  const result = await bulkDeleteContacts({
    ids: ids.data,
    actorId: user.id,
  });

  await writeAuditLog({
    actorId: user.id,
    action: "crm_bulk_contact_delete",
    entityType: "CrmContact",
    metadata: {
      ids: ids.data,
      deleted: result.deleted,
      failed: result.failed,
    },
  });

  revalidateCrmLists();
  return toActionResult(result, "contact(s)");
}

export async function bulkUpdateLeadStatusAction(input: {
  ids: string[];
  status: string;
}) {
  await assertSameOrigin();
  const user = await requireAdminUser("manage_crm");

  const ids = idsSchema.safeParse(input.ids);
  const status = leadStatusSchema.safeParse(input.status);
  if (!ids.success || !status.success) {
    return { ok: false as const, message: "Invalid input." };
  }

  const result = await bulkUpdateLeadStatus({
    ids: ids.data,
    status: status.data,
    actorId: user.id,
  });

  await writeAuditLog({
    actorId: user.id,
    action: "crm_bulk_lead_status",
    entityType: "CrmLead",
    metadata: {
      ids: ids.data,
      status: status.data,
      updated: result.updated,
      failed: result.failed.length,
    },
  });

  revalidateCrmLists();
  return toActionResult(result, "lead(s)");
}

export async function bulkUpdateLeadTemperatureAction(input: {
  ids: string[];
  temperature: string;
}) {
  await assertSameOrigin();
  const user = await requireAdminUser("manage_crm");

  const ids = idsSchema.safeParse(input.ids);
  const temperature = temperatureSchema.safeParse(input.temperature);
  if (!ids.success || !temperature.success) {
    return { ok: false as const, message: "Invalid input." };
  }

  const result = await bulkUpdateLeadTemperature({
    ids: ids.data,
    temperature: temperature.data,
    actorId: user.id,
  });

  await writeAuditLog({
    actorId: user.id,
    action: "crm_bulk_lead_temperature",
    entityType: "CrmLead",
    metadata: {
      ids: ids.data,
      temperature: temperature.data,
      updated: result.updated,
      failed: result.failed.length,
    },
  });

  revalidateCrmLists();
  return toActionResult(result, "lead(s)");
}

export async function bulkDeleteLeadsAction(input: { ids: string[] }) {
  await assertSameOrigin();
  const user = await requireAdminUser("manage_crm");

  const ids = idsSchema.safeParse(input.ids);
  if (!ids.success) {
    return { ok: false as const, message: "Invalid input." };
  }

  const result = await bulkDeleteLeads({
    ids: ids.data,
    actorId: user.id,
  });

  await writeAuditLog({
    actorId: user.id,
    action: "crm_bulk_lead_delete",
    entityType: "CrmLead",
    metadata: {
      ids: ids.data,
      deleted: result.deleted,
      failed: result.failed,
    },
  });

  revalidateCrmLists();
  return toActionResult(result, "lead(s)");
}
