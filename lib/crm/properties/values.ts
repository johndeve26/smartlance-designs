import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import {
  lockContactPropertyDefinition,
  lockContactPropertyDefinitions,
  type PropertyTransactionClient,
} from "@/lib/crm/properties/lock";
import {
  validatePropertyValueInput,
  type ParsedPropertyValue,
} from "@/lib/crm/properties/validate";

export async function getContactPropertyValues(contactId: string) {
  return prisma.crmContactPropertyValue.findMany({
    where: { contactId },
    include: { definition: true },
    orderBy: { definition: { displayOrder: "asc" } },
  });
}

export async function setContactPropertyValueInTx(
  tx: PropertyTransactionClient,
  input: {
    contactId: string;
    definitionId: string;
    rawValue: unknown;
  },
) {
  const def = await lockContactPropertyDefinition(tx, input.definitionId);
  if (def.objectType !== "CONTACT") {
    throw new Error("Property definition not found.");
  }
  if (!def.isActive) throw new Error("Property is archived.");

  const validated = validatePropertyValueInput(def, input.rawValue);
  if (!validated.ok) throw new Error(validated.error);

  const empty = isEmptyValue(validated.value);
  if (empty) {
    await tx.crmContactPropertyValue.deleteMany({
      where: { contactId: input.contactId, definitionId: input.definitionId },
    });
    return null;
  }

  const data = toPrismaValue(validated.value);
  return tx.crmContactPropertyValue.upsert({
    where: {
      definitionId_contactId: {
        definitionId: input.definitionId,
        contactId: input.contactId,
      },
    },
    create: {
      definitionId: input.definitionId,
      contactId: input.contactId,
      ...data,
    },
    update: data,
    include: { definition: true },
  });
}

export async function setContactPropertyValue(input: {
  contactId: string;
  definitionId: string;
  rawValue: unknown;
}) {
  return prisma.$transaction((tx) => setContactPropertyValueInTx(tx, input));
}

export async function setContactPropertyValues(input: {
  contactId: string;
  values: Array<{ definitionId: string; rawValue: unknown }>;
}) {
  const sorted = [...input.values].sort((a, b) =>
    a.definitionId.localeCompare(b.definitionId),
  );

  return prisma.$transaction(async (tx) => {
    const definitionIds = sorted.map((v) => v.definitionId);
    await lockContactPropertyDefinitions(tx, definitionIds);

    const results = [];
    for (const v of sorted) {
      results.push(
        await setContactPropertyValueInTx(tx, {
          contactId: input.contactId,
          definitionId: v.definitionId,
          rawValue: v.rawValue,
        }),
      );
    }
    return results;
  });
}

function isEmptyValue(v: ParsedPropertyValue): boolean {
  return (
    v.textValue == null &&
    v.numberValue == null &&
    v.booleanValue == null &&
    v.dateValue == null &&
    (v.jsonValue == null || v.jsonValue.length === 0)
  );
}

function toPrismaValue(v: ParsedPropertyValue) {
  return {
    textValue: v.textValue ?? null,
    numberValue: v.numberValue ?? null,
    booleanValue: v.booleanValue ?? null,
    dateValue: v.dateValue ?? null,
    jsonValue: v.jsonValue ? (v.jsonValue as Prisma.InputJsonValue) : undefined,
  };
}
