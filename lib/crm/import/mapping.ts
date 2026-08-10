import type { CrmPropertyDefinition } from "@prisma/client";
import type {
  ColumnMapping,
  StandardImportField,
} from "@/lib/crm/import/constants";
import { STANDARD_IMPORT_FIELDS } from "@/lib/crm/import/constants";
import { normalizePropertyKey } from "@/lib/crm/properties/definitions";

const HEADER_ALIASES: Record<StandardImportField, string[]> = {
  firstName: ["first name", "firstname", "first_name", "first", "given name"],
  lastName: ["last name", "lastname", "last_name", "last", "surname", "family name"],
  displayName: ["name", "full name", "fullname", "full_name", "contact name", "display name"],
  email: ["email", "email address", "e-mail", "e_mail", "work email"],
  phone: ["phone", "phone number", "mobile", "telephone", "cell"],
  jobTitle: ["job title", "title", "position", "role"],
  companyName: ["company", "company name", "business", "business name", "organization"],
  companyWebsite: ["website", "company website", "url", "web", "company url"],
  companyDomain: ["domain", "company domain"],
  country: ["country", "country name", "country code"],
  stateRegion: ["state", "region", "state region", "state/region", "province"],
  city: ["city", "town"],
  postalCode: ["postal code", "zip", "zip code", "postcode"],
  timezone: ["timezone", "time zone", "tz"],
  linkedinUrl: ["linkedin", "linkedin url", "linkedin profile"],
  xUrl: ["x", "twitter", "x url", "twitter url"],
  facebookUrl: ["facebook", "facebook url"],
  instagramUrl: ["instagram", "instagram url"],
  githubUrl: ["github", "github url"],
  youtubeUrl: ["youtube", "youtube url"],
  tiktokUrl: ["tiktok", "tiktok url"],
  lifecycle: ["lifecycle", "lifecycle stage", "stage"],
  notes: ["notes", "note", "comments", "comment"],
  sourceDetail: ["source detail", "source_detail", "list name", "campaign"],
};

const BLOCKED_HEADERS = new Set([
  "id",
  "emailstatus",
  "email status",
  "createdat",
  "updatedat",
  "createdbyid",
  "ownerid",
  "isarchived",
  "emailnormalized",
  "lastcontactedat",
]);

function normalizeHeader(header: string): string {
  return header.trim().toLowerCase().replace(/[\s_-]+/g, " ");
}

export function suggestColumnMapping(
  headers: string[],
  customProperties: CrmPropertyDefinition[] = [],
): ColumnMapping {
  const mapping: ColumnMapping = {};
  const usedFields = new Set<string>();

  const customByLabel = new Map(
    customProperties.map((p) => [p.label.trim().toLowerCase(), p]),
  );
  const customByKey = new Map(customProperties.map((p) => [p.key.toLowerCase(), p]));

  for (const header of headers) {
    const norm = normalizeHeader(header);
    if (BLOCKED_HEADERS.has(norm.replace(/ /g, "")) || BLOCKED_HEADERS.has(norm)) {
      mapping[header] = "skip";
      continue;
    }

    const custom =
      customByLabel.get(norm) ??
      customByKey.get(normalizePropertyKey(header));
    if (custom && custom.isActive) {
      const key = `custom:${custom.id}` as const;
      if (!usedFields.has(key)) {
        mapping[header] = key;
        usedFields.add(key);
        continue;
      }
    }

    let matched: StandardImportField | null = null;
    for (const field of STANDARD_IMPORT_FIELDS) {
      if (usedFields.has(field)) continue;
      const aliases = HEADER_ALIASES[field];
      if (aliases.some((a) => norm === a || norm.replace(/ /g, "") === a.replace(/ /g, ""))) {
        matched = field;
        break;
      }
    }

    mapping[header] = matched ?? "skip";
    if (matched) usedFields.add(matched);
  }

  return mapping;
}

export function sampleValuesForColumn(
  rows: Array<{ values: Record<string, string> }>,
  header: string,
  limit = 3,
): string[] {
  const samples: string[] = [];
  for (const row of rows) {
    const v = row.values[header]?.trim();
    if (v && !samples.includes(v)) samples.push(v);
    if (samples.length >= limit) break;
  }
  return samples;
}

export const STANDARD_MAPPING_LABELS: Record<StandardImportField | "skip", string> = {
  skip: "Do not import",
  firstName: "Standard · First name",
  lastName: "Standard · Last name",
  displayName: "Standard · Display name",
  email: "Standard · Email",
  phone: "Standard · Phone",
  jobTitle: "Standard · Job title",
  companyName: "Standard · Company name",
  companyWebsite: "Standard · Company website",
  companyDomain: "Standard · Company domain",
  country: "Standard · Country",
  stateRegion: "Standard · State/Region",
  city: "Standard · City",
  postalCode: "Standard · Postal code",
  timezone: "Standard · Timezone",
  linkedinUrl: "Standard · LinkedIn URL",
  xUrl: "Standard · X URL",
  facebookUrl: "Standard · Facebook URL",
  instagramUrl: "Standard · Instagram URL",
  githubUrl: "Standard · GitHub URL",
  youtubeUrl: "Standard · YouTube URL",
  tiktokUrl: "Standard · TikTok URL",
  lifecycle: "Standard · Lifecycle",
  notes: "Standard · Notes",
  sourceDetail: "Standard · Source detail",
};

export function mappingFieldLabel(
  field: StandardImportField | `custom:${string}` | "skip",
  customProperties: CrmPropertyDefinition[] = [],
): string {
  if (field === "skip") return STANDARD_MAPPING_LABELS.skip;
  if (field.startsWith("custom:")) {
    const id = field.slice(7);
    const def = customProperties.find((p) => p.id === id);
    return def ? `Custom · ${def.label}` : "Custom · Unknown";
  }
  return STANDARD_MAPPING_LABELS[field as StandardImportField];
}

/** @deprecated */
export const MAPPING_FIELD_LABELS = STANDARD_MAPPING_LABELS;
/** @deprecated */
export const IMPORTABLE_CSV_FIELDS = STANDARD_IMPORT_FIELDS;
