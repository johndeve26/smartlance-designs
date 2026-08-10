import type { CrmPropertyFieldType } from "@prisma/client";

export const CRM_MAX_ACTIVE_CONTACT_PROPERTIES = 100;
export const CRM_PROPERTY_LABEL_MAX = 120;
export const CRM_PROPERTY_KEY_MAX = 64;
export const CRM_PROPERTY_OPTION_MAX = 100;
export const CRM_PROPERTY_OPTION_LABEL_MAX = 120;
export const CRM_CONTACT_FILTER_MAX_CONDITIONS = 30;

export const CRM_TEXT_VALUE_MAX = 500;
export const CRM_MULTILINE_VALUE_MAX = 5000;

export const CRM_MULTI_SELECT_CSV_DELIMITER = ";";

export const RESERVED_PROPERTY_KEYS = new Set([
  "id",
  "email",
  "email_normalized",
  "emailnormalized",
  "first_name",
  "firstname",
  "last_name",
  "lastname",
  "display_name",
  "displayname",
  "phone",
  "job_title",
  "jobtitle",
  "company",
  "company_id",
  "country",
  "country_code",
  "state",
  "city",
  "lifecycle",
  "lifecycle_stage",
  "source",
  "source_detail",
  "owner",
  "owner_id",
  "status",
  "created_at",
  "updated_at",
  "is_archived",
  "email_status",
]);

export type PropertySelectOption = {
  key: string;
  label: string;
  displayOrder: number;
  isActive: boolean;
};

export const FIELD_TYPE_LABELS: Record<CrmPropertyFieldType, string> = {
  TEXT: "Text",
  MULTILINE_TEXT: "Multiline text",
  NUMBER: "Number",
  BOOLEAN: "Boolean",
  DATE: "Date",
  SINGLE_SELECT: "Single select",
  MULTI_SELECT: "Multi select",
  URL: "URL",
  EMAIL: "Email",
  PHONE: "Phone",
};
