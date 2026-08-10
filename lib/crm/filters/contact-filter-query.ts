import type { Prisma, CrmPropertyFieldType } from "@prisma/client";
import { prisma } from "@/lib/db";
import type {
  ContactFilterCondition,
  ContactFilterV3,
} from "@/lib/crm/filters/contact-filter-schema";

type Where = Prisma.CrmContactWhereInput;

function textWhere(
  field: keyof Prisma.CrmContactWhereInput,
  operator: string,
  value?: unknown,
): Where {
  const v = typeof value === "string" ? value.trim() : "";
  switch (operator) {
    case "IS":
      return { [field]: { equals: v, mode: "insensitive" } } as Where;
    case "IS_NOT":
      return { NOT: { [field]: { equals: v, mode: "insensitive" } } } as Where;
    case "CONTAINS":
      return { [field]: { contains: v, mode: "insensitive" } } as Where;
    case "NOT_CONTAINS":
      return { NOT: { [field]: { contains: v, mode: "insensitive" } } } as Where;
    case "STARTS_WITH":
      return { [field]: { startsWith: v, mode: "insensitive" } } as Where;
    case "IS_KNOWN":
      return { [field]: { not: null } } as Where;
    case "IS_UNKNOWN":
      return { [field]: null } as Where;
    default:
      return {};
  }
}

async function customConditionToWhere(cond: Extract<ContactFilterCondition, { kind: "CUSTOM" }>): Promise<Where> {
  const def = await prisma.crmPropertyDefinition.findUnique({
    where: { id: cond.propertyId },
  });
  if (!def) return { id: "__none__" };

  const op = cond.operator;
  const val = cond.value;

  const relation: Prisma.CrmContactPropertyValueListRelationFilter = { some: {} };
  const some: Prisma.CrmContactPropertyValueWhereInput = { definitionId: def.id };

  const fieldType = def.fieldType as CrmPropertyFieldType;

  if (op === "IS_KNOWN") {
    relation.some = some;
    return { propertyValues: relation };
  }
  if (op === "IS_UNKNOWN") {
    return { propertyValues: { none: { definitionId: def.id } } };
  }

  switch (fieldType) {
    case "TEXT":
    case "URL":
    case "EMAIL":
    case "PHONE":
    case "MULTILINE_TEXT":
      if (op === "CONTAINS") some.textValue = { contains: String(val), mode: "insensitive" };
      else if (op === "IS") some.textValue = { equals: String(val), mode: "insensitive" };
      else if (op === "IS_NOT") {
        return { NOT: { propertyValues: { some: { definitionId: def.id, textValue: { equals: String(val), mode: "insensitive" } } } } };
      }
      break;
    case "NUMBER": {
      const n = Number(val);
      if (op === "EQ") some.numberValue = n;
      else if (op === "NEQ") {
        return { NOT: { propertyValues: { some: { definitionId: def.id, numberValue: n } } } };
      } else if (op === "GT") some.numberValue = { gt: n };
      else if (op === "GTE") some.numberValue = { gte: n };
      else if (op === "LT") some.numberValue = { lt: n };
      else if (op === "LTE") some.numberValue = { lte: n };
      break;
    }
    case "BOOLEAN":
      if (op === "IS_TRUE") some.booleanValue = true;
      else if (op === "IS_FALSE") some.booleanValue = false;
      break;
    case "DATE": {
      const d = new Date(String(val));
      if (op === "BEFORE") some.dateValue = { lt: d };
      else if (op === "AFTER") some.dateValue = { gt: d };
      else if (op === "ON") {
        const start = new Date(d);
        start.setUTCHours(0, 0, 0, 0);
        const end = new Date(d);
        end.setUTCHours(23, 59, 59, 999);
        some.dateValue = { gte: start, lte: end };
      }
      break;
    }
    case "SINGLE_SELECT":
      if (op === "IN" && Array.isArray(val)) {
        some.textValue = { in: val.map(String) };
      } else if (op === "NOT_IN" && Array.isArray(val)) {
        return { NOT: { propertyValues: { some: { definitionId: def.id, textValue: { in: val.map(String) } } } } };
      } else if (op === "IS") {
        some.textValue = String(val);
      }
      break;
    case "MULTI_SELECT":
      if (op === "CONTAINS_ANY" && Array.isArray(val)) {
        some.jsonValue = { array_contains: val.map(String) };
      } else if (op === "CONTAINS_ALL" && Array.isArray(val)) {
        return {
          AND: val.map((item) => ({
            propertyValues: {
              some: {
                definitionId: def.id,
                jsonValue: { array_contains: [String(item)] },
              },
            },
          })),
        };
      }
      break;
    default:
      break;
  }

  relation.some = some;
  return { propertyValues: relation };
}

async function conditionToWhere(cond: ContactFilterCondition): Promise<Where> {
  if (cond.kind === "SOCIAL") {
    if (cond.operator === "MISSING") {
      if (cond.platform === "ANY") return { socialProfiles: { none: {} } };
      return { socialProfiles: { none: { platform: cond.platform } } };
    }
    if (cond.platform === "ANY") return { socialProfiles: { some: {} } };
    return { socialProfiles: { some: { platform: cond.platform } } };
  }

  if (cond.kind === "NOTES") {
    return {
      activities: {
        some: {
          type: "NOTE",
          body: { contains: cond.value, mode: "insensitive" },
        },
      },
    };
  }

  if (cond.kind === "ENGAGEMENT") {
    const emailSome: Prisma.CrmEmailWhereInput = { direction: "OUTBOUND" };
    if (cond.field === "hasDetectedOpen") {
      if (cond.operator === "IS_TRUE") emailSome.openDetectedCount = { gt: 0 };
      else return { emails: { none: { direction: "OUTBOUND", openDetectedCount: { gt: 0 } } } };
    } else {
      if (cond.operator === "IS_TRUE") emailSome.clickDetectedCount = { gt: 0 };
      else return { emails: { none: { direction: "OUTBOUND", clickDetectedCount: { gt: 0 } } } };
    }
    return { emails: { some: emailSome } };
  }

  if (cond.kind === "CUSTOM") {
    return customConditionToWhere(cond);
  }

  const { field, operator, value } = cond;

  switch (field) {
    case "firstName":
    case "lastName":
    case "displayName":
    case "email":
    case "phone":
    case "jobTitle":
    case "stateRegion":
    case "city":
    case "sourceDetail":
      return textWhere(field, operator, value);
    case "countryCode":
      if (operator === "IN" && Array.isArray(value)) {
        return { countryCode: { in: value.map(String) } };
      }
      return textWhere("countryCode", operator, value);
    case "source":
    case "lifecycleStage":
    case "emailStatus":
      if (operator === "IN" && Array.isArray(value)) {
        return { [field]: { in: value } } as Where;
      }
      if (operator === "IS") return { [field]: value } as Where;
      return {};
    case "ownerId":
    case "companyId":
      if (operator === "IS") return { [field]: String(value) } as Where;
      if (operator === "IS_UNKNOWN") return { [field]: null } as Where;
      if (operator === "IS_KNOWN") return { [field]: { not: null } } as Where;
      return {};
    case "leadStatus":
    case "temperature": {
      const leadWhere: Prisma.CrmLeadWhereInput = {
        status: { notIn: ["UNQUALIFIED", "CLOSED"] },
      };
      if (field === "leadStatus") {
        if (operator === "IN" && Array.isArray(value)) leadWhere.status = { in: value as never[] };
        else if (operator === "IS") leadWhere.status = value as never;
      }
      if (field === "temperature") {
        if (operator === "IN" && Array.isArray(value)) leadWhere.temperature = { in: value as never[] };
        else if (operator === "IS") leadWhere.temperature = value as never;
      }
      return { leads: { some: leadWhere } };
    }
    case "lastContactedAt":
    case "createdAt":
    case "nextActivityAt": {
      const d = value ? new Date(String(value)) : null;
      if (!d || Number.isNaN(d.getTime())) return {};
      if (operator === "BEFORE") return { [field]: { lt: d } } as Where;
      if (operator === "AFTER") return { [field]: { gt: d } } as Where;
      return {};
    }
    case "hasOpenDeal":
      if (operator === "IS_FALSE") {
        return { deals: { none: { isArchived: false, stage: { notIn: ["WON", "LOST"] } } } };
      }
      return { deals: { some: { isArchived: false, stage: { notIn: ["WON", "LOST"] } } } };
    case "hasOpenTask":
      if (operator === "IS_FALSE") return { tasks: { none: { status: "OPEN" } } };
      return { tasks: { some: { status: "OPEN" } } };
    case "hasOverdueTask":
      return { tasks: { some: { status: "OPEN", dueAt: { lt: new Date() } } } };
    case "hasLocation":
      if (operator === "IS_TRUE") {
        return { OR: [{ countryCode: { not: null } }, { city: { not: null } }] };
      }
      return { countryCode: null, city: null, stateRegion: null };
    case "missingLocation":
      return { countryCode: null, city: null, stateRegion: null };
    default:
      return {};
  }
}

export async function contactFilterV3ToWhere(filter: ContactFilterV3): Promise<Where> {
  const base: Where = { isArchived: false };
  if (!filter.conditions.length) return base;

  const parts = await Promise.all(filter.conditions.map(conditionToWhere));
  const meaningful = parts.filter((p) => Object.keys(p).length);

  if (!meaningful.length) return base;

  if (filter.match === "ANY") {
    return { ...base, OR: meaningful };
  }
  return { ...base, AND: meaningful };
}

export async function countContactsMatchingFilter(filter: ContactFilterV3) {
  const where = await contactFilterV3ToWhere(filter);
  return prisma.crmContact.count({ where });
}
