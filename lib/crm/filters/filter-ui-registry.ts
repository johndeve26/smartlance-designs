import type { CrmPropertyFieldType } from "@prisma/client";
import type { PropertySelectOption } from "@/lib/crm/properties/constants";

export type FilterValueKind =
  | "text"
  | "number"
  | "boolean"
  | "date"
  | "dateRange"
  | "enum"
  | "enumMulti"
  | "country"
  | "company"
  | "owner"
  | "none";

export type FilterOperatorDef = {
  value: string;
  label: string;
  valueKind: FilterValueKind;
};

export type FilterFieldDef =
  | {
      id: string;
      kind: "STANDARD";
      field: string;
      label: string;
      group: string;
      operators: FilterOperatorDef[];
      enumValues?: Array<{ value: string; label: string }>;
    }
  | {
      id: string;
      kind: "CUSTOM";
      propertyId: string;
      label: string;
      group: "Custom properties";
      fieldType: CrmPropertyFieldType;
      operators: FilterOperatorDef[];
      options: PropertySelectOption[];
      isActive: boolean;
    }
  | {
      id: string;
      kind: "SOCIAL";
      platform: string;
      label: string;
      group: "Social";
      operators: FilterOperatorDef[];
    }
  | {
      id: string;
      kind: "NOTES";
      label: string;
      group: "Activity";
      operators: FilterOperatorDef[];
    }
  | {
      id: string;
      kind: "ENGAGEMENT";
      field: "hasDetectedOpen" | "hasDetectedClick";
      label: string;
      group: "Engagement";
      operators: FilterOperatorDef[];
    };

const textOps: FilterOperatorDef[] = [
  { value: "IS", label: "is", valueKind: "text" },
  { value: "IS_NOT", label: "is not", valueKind: "text" },
  { value: "CONTAINS", label: "contains", valueKind: "text" },
  { value: "NOT_CONTAINS", label: "does not contain", valueKind: "text" },
  { value: "STARTS_WITH", label: "starts with", valueKind: "text" },
  { value: "IS_KNOWN", label: "is known", valueKind: "none" },
  { value: "IS_UNKNOWN", label: "is unknown", valueKind: "none" },
];

const numberOps: FilterOperatorDef[] = [
  { value: "EQ", label: "equals", valueKind: "number" },
  { value: "NEQ", label: "not equals", valueKind: "number" },
  { value: "GT", label: "greater than", valueKind: "number" },
  { value: "GTE", label: "greater than or equal", valueKind: "number" },
  { value: "LT", label: "less than", valueKind: "number" },
  { value: "LTE", label: "less than or equal", valueKind: "number" },
  { value: "IS_KNOWN", label: "is known", valueKind: "none" },
  { value: "IS_UNKNOWN", label: "is unknown", valueKind: "none" },
];

const boolOps: FilterOperatorDef[] = [
  { value: "IS_TRUE", label: "is true", valueKind: "none" },
  { value: "IS_FALSE", label: "is false", valueKind: "none" },
  { value: "IS_UNKNOWN", label: "is unknown", valueKind: "none" },
];

const dateOps: FilterOperatorDef[] = [
  { value: "BEFORE", label: "before", valueKind: "date" },
  { value: "AFTER", label: "after", valueKind: "date" },
  { value: "ON", label: "on", valueKind: "date" },
  { value: "BETWEEN", label: "between", valueKind: "dateRange" },
  { value: "IS_KNOWN", label: "is known", valueKind: "none" },
  { value: "IS_UNKNOWN", label: "is unknown", valueKind: "none" },
];

const selectOps: FilterOperatorDef[] = [
  { value: "IN", label: "is any of", valueKind: "enumMulti" },
  { value: "NOT_IN", label: "is none of", valueKind: "enumMulti" },
  { value: "IS_KNOWN", label: "is known", valueKind: "none" },
  { value: "IS_UNKNOWN", label: "is unknown", valueKind: "none" },
];

const multiOps: FilterOperatorDef[] = [
  { value: "CONTAINS_ANY", label: "contains any", valueKind: "enumMulti" },
  { value: "CONTAINS_ALL", label: "contains all", valueKind: "enumMulti" },
  { value: "CONTAINS_NONE", label: "contains none", valueKind: "enumMulti" },
  { value: "IS_KNOWN", label: "is known", valueKind: "none" },
  { value: "IS_UNKNOWN", label: "is unknown", valueKind: "none" },
];

const socialOps: FilterOperatorDef[] = [
  { value: "HAS", label: "is known", valueKind: "none" },
  { value: "MISSING", label: "is unknown", valueKind: "none" },
];

const engagementOps: FilterOperatorDef[] = [
  { value: "IS_TRUE", label: "is known", valueKind: "none" },
  { value: "IS_FALSE", label: "is unknown", valueKind: "none" },
];

const LIFECYCLE = ["PROSPECT", "LEAD", "OPPORTUNITY", "CLIENT", "PAST_CLIENT", "OTHER"];
const LEAD_STATUS = ["NEW", "ATTEMPTING", "CONNECTED", "QUALIFIED", "UNQUALIFIED", "BAD_TIMING", "CLOSED"];
const TEMPERATURE = ["COLD", "WARM", "HOT"];
const SOURCE = ["MANUAL", "CONTACT_FORM", "WEBSITE_REVIEW", "PROJECT_PLANNER", "REFERRAL", "INBOUND_EMAIL", "OUTBOUND", "UPWORK", "SOCIAL", "OTHER"];
const EMAIL_STATUS = ["SENDABLE", "DO_NOT_EMAIL", "UNSUBSCRIBED", "BOUNCED", "COMPLAINED", "INVALID", "SUPPRESSED"];

function std(field: string, label: string, group: string, operators: FilterOperatorDef[], enumValues?: Array<{ value: string; label: string }>): FilterFieldDef {
  return { id: `std:${field}`, kind: "STANDARD", field, label, group, operators, enumValues };
}

export function buildStandardFilterFields(): FilterFieldDef[] {
  const enumVals = (values: string[]) => values.map((v) => ({ value: v, label: v }));
  return [
    std("firstName", "First name", "Contact", textOps),
    std("lastName", "Last name", "Contact", textOps),
    std("displayName", "Display name", "Contact", textOps),
    std("email", "Email", "Contact", textOps),
    std("phone", "Phone", "Contact", textOps),
    std("jobTitle", "Job title", "Contact", textOps),
    std("countryCode", "Country", "Location", [{ value: "IN", label: "is any of", valueKind: "country" }, { value: "IS_KNOWN", label: "is known", valueKind: "none" }, { value: "IS_UNKNOWN", label: "is unknown", valueKind: "none" }]),
    std("stateRegion", "State / Region", "Location", textOps),
    std("city", "City", "Location", textOps),
    std("companyId", "Company", "CRM", [{ value: "IS", label: "is", valueKind: "company" }, { value: "IS_KNOWN", label: "is known", valueKind: "none" }, { value: "IS_UNKNOWN", label: "is unknown", valueKind: "none" }]),
    std("source", "Source", "CRM", selectOps, enumVals(SOURCE)),
    std("sourceDetail", "Source detail", "CRM", textOps),
    std("lifecycleStage", "Lifecycle stage", "CRM", selectOps, enumVals(LIFECYCLE)),
    std("leadStatus", "Lead status", "CRM", selectOps, enumVals(LEAD_STATUS)),
    std("temperature", "Temperature", "CRM", selectOps, enumVals(TEMPERATURE)),
    std("emailStatus", "Email status", "CRM", selectOps, enumVals(EMAIL_STATUS)),
    std("ownerId", "Owner", "CRM", [{ value: "IS", label: "is", valueKind: "owner" }, { value: "IS_UNKNOWN", label: "is unassigned", valueKind: "none" }]),
    std("createdAt", "Created at", "CRM", dateOps),
    std("lastContactedAt", "Last contacted", "CRM", dateOps),
    std("nextActivityAt", "Next activity", "CRM", dateOps),
    std("hasOpenDeal", "Has open deal", "Activity", [{ value: "IS_TRUE", label: "yes", valueKind: "none" }, { value: "IS_FALSE", label: "no", valueKind: "none" }]),
    std("hasOverdueTask", "Has overdue task", "Activity", [{ value: "IS_TRUE", label: "yes", valueKind: "none" }]),
    std("hasOpenTask", "Has open task", "Activity", [{ value: "IS_TRUE", label: "yes", valueKind: "none" }]),
    std("hasLocation", "Has location", "Location", [{ value: "IS_TRUE", label: "yes", valueKind: "none" }]),
    std("missingLocation", "Missing location", "Location", [{ value: "IS_TRUE", label: "yes", valueKind: "none" }]),
    { id: "notes", kind: "NOTES", label: "Notes", group: "Activity", operators: [{ value: "CONTAINS", label: "contains", valueKind: "text" }] },
    { id: "eng:open", kind: "ENGAGEMENT", field: "hasDetectedOpen", label: "Detected open", group: "Engagement", operators: engagementOps },
    { id: "eng:click", kind: "ENGAGEMENT", field: "hasDetectedClick", label: "Detected click", group: "Engagement", operators: engagementOps },
    ...(["LINKEDIN", "X", "FACEBOOK", "INSTAGRAM", "GITHUB", "YOUTUBE", "TIKTOK"] as const).map(
      (platform): FilterFieldDef => ({
        id: `social:${platform}`,
        kind: "SOCIAL",
        platform,
        label: platform === "X" ? "X (Twitter)" : platform.charAt(0) + platform.slice(1).toLowerCase(),
        group: "Social",
        operators: socialOps,
      }),
    ),
    {
      id: "social:ANY",
      kind: "SOCIAL",
      platform: "ANY",
      label: "Any social profile",
      group: "Social",
      operators: socialOps,
    },
  ];
}

export function customPropertyToFilterField(input: {
  id: string;
  label: string;
  fieldType: CrmPropertyFieldType;
  options: PropertySelectOption[];
  isActive: boolean;
}): FilterFieldDef {
  let operators: FilterOperatorDef[];
  switch (input.fieldType) {
    case "NUMBER":
      operators = numberOps;
      break;
    case "BOOLEAN":
      operators = boolOps;
      break;
    case "DATE":
      operators = dateOps;
      break;
    case "SINGLE_SELECT":
      operators = selectOps;
      break;
    case "MULTI_SELECT":
      operators = multiOps;
      break;
    case "URL":
    case "EMAIL":
    case "PHONE":
    case "TEXT":
    case "MULTILINE_TEXT":
    default:
      operators = textOps;
  }
  return {
    id: `custom:${input.id}`,
    kind: "CUSTOM",
    propertyId: input.id,
    label: input.label,
    group: "Custom properties",
    fieldType: input.fieldType,
    operators,
    options: input.options,
    isActive: input.isActive,
  };
}

export function getOperatorsForField(field: FilterFieldDef): FilterOperatorDef[] {
  return field.operators;
}

export function operatorNeedsValue(op: FilterOperatorDef): boolean {
  return op.valueKind !== "none";
}
