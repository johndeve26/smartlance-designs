"use server";

import { revalidatePath } from "next/cache";
import { assertSameOrigin, requireAdminUser } from "@/lib/admin/session";
import { writeAuditLog } from "@/lib/repositories/auditRepository";
import {
  archiveContactPropertyDefinition,
  countPropertyValues,
  createContactPropertyDefinition,
  getPropertyDefinitionById,
  listContactPropertyDefinitions,
  restoreContactPropertyDefinition,
  updateContactPropertyDefinition,
} from "@/lib/crm/properties/definitions";
import { PropertyTypeInUseError } from "@/lib/crm/properties/errors";
import type { CrmPropertyFieldType } from "@prisma/client";
import type { PropertySelectOption } from "@/lib/crm/properties/constants";
import { z } from "zod";

const propertySchema = z.object({
  label: z.string().trim().min(1).max(120),
  key: z.string().trim().max(64).optional(),
  fieldType: z.enum([
    "TEXT",
    "MULTILINE_TEXT",
    "NUMBER",
    "BOOLEAN",
    "DATE",
    "SINGLE_SELECT",
    "MULTI_SELECT",
    "URL",
    "EMAIL",
    "PHONE",
  ]),
  description: z.string().trim().max(500).optional().or(z.literal("")),
  isRequired: z.coerce.boolean().optional(),
  displayOrder: z.coerce.number().int().min(0).max(999).optional(),
});

export async function listContactPropertiesAction() {
  await requireAdminUser("view_crm");
  return listContactPropertyDefinitions({ includeInactive: true });
}

export async function listActiveContactPropertiesAction() {
  await requireAdminUser("view_crm");
  return listContactPropertyDefinitions();
}

export async function getContactPropertyDetailAction(id: string) {
  await requireAdminUser("view_crm");
  const def = await getPropertyDefinitionById(id);
  if (!def || def.objectType !== "CONTACT") return null;
  const valueCount = await countPropertyValues(id);
  return { definition: def, valueCount };
}

export async function createContactPropertyAction(input: {
  label: string;
  key?: string;
  fieldType: CrmPropertyFieldType;
  description?: string;
  isRequired?: boolean;
  displayOrder?: number;
  options?: PropertySelectOption[];
}) {
  await assertSameOrigin();
  const user = await requireAdminUser("manage_crm");
  const parsed = propertySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  try {
    const def = await createContactPropertyDefinition({
      ...parsed.data,
      options: input.options,
      actorId: user.id,
    });
    await writeAuditLog({
      actorId: user.id,
      action: "crm_property_created",
      entityType: "CrmPropertyDefinition",
      entityId: def.id,
      metadata: { label: def.label, key: def.key, fieldType: def.fieldType },
    });
    revalidatePath("/admin/crm/settings/properties");
    return { ok: true as const, id: def.id };
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : "Failed to create property.",
    };
  }
}

export async function archiveContactPropertyAction(id: string) {
  await assertSameOrigin();
  const user = await requireAdminUser("manage_crm");
  await archiveContactPropertyDefinition(id, user.id);
  await writeAuditLog({
    actorId: user.id,
    action: "crm_property_archived",
    entityType: "CrmPropertyDefinition",
    entityId: id,
  });
  revalidatePath("/admin/crm/settings/properties");
  return { ok: true as const };
}

export async function restoreContactPropertyAction(id: string) {
  await assertSameOrigin();
  const user = await requireAdminUser("manage_crm");
  await restoreContactPropertyDefinition(id, user.id);
  revalidatePath("/admin/crm/settings/properties");
  return { ok: true as const };
}

export async function updateContactPropertyAction(input: {
  id: string;
  label?: string;
  description?: string;
  isRequired?: boolean;
  displayOrder?: number;
  fieldType?: CrmPropertyFieldType;
  options?: PropertySelectOption[];
}) {
  await assertSameOrigin();
  const user = await requireAdminUser("manage_crm");

  const existing = await getPropertyDefinitionById(input.id);
  if (!existing) {
    return { ok: false as const, error: "Property not found." };
  }

  try {
    const updated = await updateContactPropertyDefinition({ ...input, actorId: user.id });
    await writeAuditLog({
      actorId: user.id,
      action: "crm_property_updated",
      entityType: "CrmPropertyDefinition",
      entityId: input.id,
      metadata: {
        label: updated.label,
        fieldTypeChanged: input.fieldType != null && input.fieldType !== existing.fieldType,
        optionsChanged: Boolean(input.options),
      },
    });
    revalidatePath("/admin/crm/settings/properties");
    revalidatePath(`/admin/crm/settings/properties/${input.id}`);
    return { ok: true as const };
  } catch (err) {
    if (err instanceof PropertyTypeInUseError) {
      return { ok: false as const, error: err.message, code: err.code };
    }
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : "Update failed.",
    };
  }
}
