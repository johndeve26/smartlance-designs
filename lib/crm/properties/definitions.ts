import type { Prisma, CrmPropertyFieldType } from "@prisma/client";
import { prisma } from "@/lib/db";
import {
  CRM_MAX_ACTIVE_CONTACT_PROPERTIES,
  CRM_PROPERTY_KEY_MAX,
  CRM_PROPERTY_LABEL_MAX,
  CRM_PROPERTY_OPTION_MAX,
  RESERVED_PROPERTY_KEYS,
  type PropertySelectOption,
} from "@/lib/crm/properties/constants";
import { PropertyTypeInUseError } from "@/lib/crm/properties/errors";
import { normalizePropertyOptions } from "@/lib/crm/properties/options";
import {
  countPropertyValuesInTx,
  lockContactPropertyDefinition,
} from "@/lib/crm/properties/lock";

function slugifyKey(label: string): string {
  return label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, CRM_PROPERTY_KEY_MAX);
}

export function normalizePropertyKey(key: string): string {
  return key.trim().toLowerCase().replace(/[^a-z0-9_]/g, "_").slice(0, CRM_PROPERTY_KEY_MAX);
}

export function assertPropertyKeyAllowed(key: string) {
  const normalized = normalizePropertyKey(key);
  if (!normalized) throw new Error("Property key required.");
  if (RESERVED_PROPERTY_KEYS.has(normalized)) {
    throw new Error(`Key "${normalized}" is reserved.`);
  }
  return normalized;
}

export async function listContactPropertyDefinitions(input?: {
  includeInactive?: boolean;
}) {
  return prisma.crmPropertyDefinition.findMany({
    where: {
      objectType: "CONTACT",
      ...(input?.includeInactive ? {} : { isActive: true }),
    },
    orderBy: [{ displayOrder: "asc" }, { label: "asc" }],
  });
}

export async function getPropertyDefinitionById(id: string) {
  return prisma.crmPropertyDefinition.findUnique({ where: { id } });
}

export async function countActiveContactProperties() {
  return prisma.crmPropertyDefinition.count({
    where: { objectType: "CONTACT", isActive: true },
  });
}

export async function countPropertyValues(definitionId: string) {
  return prisma.crmContactPropertyValue.count({ where: { definitionId } });
}

export async function propertyDefinitionHasValues(definitionId: string) {
  return (await countPropertyValues(definitionId)) > 0;
}

export async function listContactPropertyDefinitionsWithCounts(input?: {
  includeInactive?: boolean;
}) {
  const defs = await listContactPropertyDefinitions(input);
  if (!defs.length) return [];

  const counts = await prisma.crmContactPropertyValue.groupBy({
    by: ["definitionId"],
    where: { definitionId: { in: defs.map((d) => d.id) } },
    _count: { _all: true },
  });
  const countMap = new Map(counts.map((c) => [c.definitionId, c._count._all]));

  return defs.map((d) => ({
    ...d,
    valueCount: countMap.get(d.id) ?? 0,
  }));
}

export async function createContactPropertyDefinition(input: {
  label: string;
  key?: string;
  fieldType: CrmPropertyFieldType;
  description?: string | null;
  isRequired?: boolean;
  options?: PropertySelectOption[];
  displayOrder?: number;
  actorId: string;
}) {
  const activeCount = await countActiveContactProperties();
  if (activeCount >= CRM_MAX_ACTIVE_CONTACT_PROPERTIES) {
    throw new Error(`Maximum of ${CRM_MAX_ACTIVE_CONTACT_PROPERTIES} active properties reached.`);
  }

  const label = input.label.trim().slice(0, CRM_PROPERTY_LABEL_MAX);
  if (!label) throw new Error("Label required.");

  const key = assertPropertyKeyAllowed(input.key?.trim() || slugifyKey(label));

  const isSelect =
    input.fieldType === "SINGLE_SELECT" || input.fieldType === "MULTI_SELECT";
  let optionsJson: PropertySelectOption[] | undefined;
  if (isSelect) {
    if (!input.options?.length) {
      throw new Error("Select properties require at least one option.");
    }
    optionsJson = normalizePropertyOptions(input.options);
  } else if (input.options?.length) {
    throw new Error("Options are only valid for select properties.");
  }

  return prisma.crmPropertyDefinition.create({
    data: {
      objectType: "CONTACT",
      label,
      key,
      fieldType: input.fieldType,
      description: input.description?.trim() || null,
      isRequired: input.isRequired ?? false,
      optionsJson: optionsJson?.length ? optionsJson : undefined,
      displayOrder: input.displayOrder ?? 0,
      createdById: input.actorId,
      updatedById: input.actorId,
    },
  });
}

export async function updateContactPropertyDefinition(input: {
  id: string;
  label?: string;
  description?: string | null;
  isRequired?: boolean;
  fieldType?: CrmPropertyFieldType;
  options?: PropertySelectOption[];
  displayOrder?: number;
  actorId: string;
}) {
  return prisma.$transaction(async (tx) => {
    const existing = await lockContactPropertyDefinition(tx, input.id);

    const data: Prisma.CrmPropertyDefinitionUpdateInput = {
      updatedBy: { connect: { id: input.actorId } },
    };

    if (input.label != null) data.label = input.label.trim().slice(0, CRM_PROPERTY_LABEL_MAX);
    if (input.description !== undefined) data.description = input.description?.trim() || null;
    if (input.isRequired != null) data.isRequired = input.isRequired;
    if (input.displayOrder != null) data.displayOrder = input.displayOrder;

    if (input.fieldType != null && input.fieldType !== existing.fieldType) {
      const valueCount = await countPropertyValuesInTx(tx, input.id);
      if (valueCount > 0) throw new PropertyTypeInUseError();
      data.fieldType = input.fieldType;
    }

    if (input.options) {
      const fieldType = (input.fieldType ?? existing.fieldType) as CrmPropertyFieldType;
      if (fieldType !== "SINGLE_SELECT" && fieldType !== "MULTI_SELECT") {
        throw new Error("Options are only valid for select properties.");
      }
      data.optionsJson = normalizePropertyOptions(input.options);
    }

    return tx.crmPropertyDefinition.update({ where: { id: input.id }, data });
  });
}

export async function archiveContactPropertyDefinition(id: string, actorId: string) {
  return prisma.crmPropertyDefinition.update({
    where: { id },
    data: { isActive: false, updatedById: actorId },
  });
}

export async function restoreContactPropertyDefinition(id: string, actorId: string) {
  const activeCount = await countActiveContactProperties();
  if (activeCount >= CRM_MAX_ACTIVE_CONTACT_PROPERTIES) {
    throw new Error(`Maximum of ${CRM_MAX_ACTIVE_CONTACT_PROPERTIES} active properties reached.`);
  }
  return prisma.crmPropertyDefinition.update({
    where: { id },
    data: { isActive: true, updatedById: actorId },
  });
}
