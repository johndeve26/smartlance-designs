import type { PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/db";
import { BLOCKED_EMAIL_STATUSES } from "@/lib/crm/constants";
import {
  normalizeCompanyDomain,
  normalizeCrmEmail,
  normalizePhone,
} from "@/lib/crm/normalize";
import { normalizeCountryInput, isValidIanaTimezone } from "@/lib/crm/country";
import { validateSocialProfileUrl } from "@/lib/crm/social";
import { validatePropertyValueInput } from "@/lib/crm/properties/validate";
import type { CrmPropertyDefinition } from "@prisma/client";
import type {
  ColumnMapping,
  ContactImportOptions,
  ImportValidationSummary,
  ParsedImportRow,
  ValidatedImportRow,
} from "@/lib/crm/import/constants";

const LIFECYCLES = new Set([
  "PROSPECT",
  "LEAD",
  "OPPORTUNITY",
  "CLIENT",
  "PAST_CLIENT",
  "OTHER",
]);

function mapRowToData(
  row: ParsedImportRow,
  mapping: ColumnMapping,
  customDefs: Map<string, CrmPropertyDefinition>,
): ValidatedImportRow["data"] {
  const data: ValidatedImportRow["data"] = {
    socialProfiles: {},
    customProperties: {},
  };
  for (const [header, field] of Object.entries(mapping)) {
    if (field === "skip") continue;
    const raw = row.values[header]?.trim();
    if (!raw) continue;

    if (field.startsWith("custom:")) {
      data.customProperties![field.slice(7)] = raw;
      continue;
    }

    switch (field) {
      case "email":
        data.email = raw;
        data.emailNormalized = normalizeCrmEmail(raw);
        break;
      case "phone":
        data.phone = normalizePhone(raw);
        break;
      case "country": {
        const c = normalizeCountryInput(raw);
        if (c) {
          data.countryCode = c.countryCode;
          data.countryName = c.countryName;
        } else {
          data.countryName = raw;
        }
        break;
      }
      case "timezone":
        data.timezone = raw;
        break;
      case "linkedinUrl":
        data.socialProfiles!.LINKEDIN = raw;
        break;
      case "xUrl":
        data.socialProfiles!.X = raw;
        break;
      case "facebookUrl":
        data.socialProfiles!.FACEBOOK = raw;
        break;
      case "instagramUrl":
        data.socialProfiles!.INSTAGRAM = raw;
        break;
      case "githubUrl":
        data.socialProfiles!.GITHUB = raw;
        break;
      case "youtubeUrl":
        data.socialProfiles!.YOUTUBE = raw;
        break;
      case "tiktokUrl":
        data.socialProfiles!.TIKTOK = raw;
        break;
      case "companyWebsite":
        data.companyWebsite = raw;
        data.companyDomain =
          normalizeCompanyDomain(raw) ?? data.companyDomain ?? null;
        break;
      case "companyDomain":
        data.companyDomain = normalizeCompanyDomain(raw) ?? raw.toLowerCase();
        break;
      case "firstName":
        data.firstName = raw;
        break;
      case "lastName":
        data.lastName = raw;
        break;
      case "displayName":
        data.displayName = raw;
        break;
      case "jobTitle":
        data.jobTitle = raw;
        break;
      case "stateRegion":
        data.stateRegion = raw;
        break;
      case "city":
        data.city = raw;
        break;
      case "postalCode":
        data.postalCode = raw;
        break;
      case "lifecycle":
        data.lifecycle = raw;
        break;
      case "notes":
        data.notes = raw;
        break;
      case "sourceDetail":
        data.sourceDetail = raw;
        break;
      case "companyName":
        data.companyName = raw;
        break;
    }
  }
  return data;
}

function hasIdentity(data: ValidatedImportRow["data"]): boolean {
  return Boolean(
    data.displayName?.trim() ||
      data.firstName?.trim() ||
      data.lastName?.trim() ||
      data.emailNormalized ||
      data.phone?.trim(),
  );
}

export async function validateImportRows(input: {
  db?: Pick<PrismaClient, "crmContact" | "crmCompany" | "crmContactImport" | "crmPropertyDefinition">;
  rows: ParsedImportRow[];
  mapping: ColumnMapping;
  options: ContactImportOptions;
  fileHash?: string;
}): Promise<{ rows: ValidatedImportRow[]; summary: ImportValidationSummary }> {
  const db = input.db ?? prisma;
  const customPropertyIds = [
    ...new Set(
      Object.values(input.mapping)
        .filter((f): f is `custom:${string}` => typeof f === "string" && f.startsWith("custom:"))
        .map((f) => f.slice(7)),
    ),
  ];
  const customDefsList = customPropertyIds.length
    ? await db.crmPropertyDefinition.findMany({
        where: { id: { in: customPropertyIds }, objectType: "CONTACT", isActive: true },
      })
    : [];
  const customDefs = new Map(customDefsList.map((d) => [d.id, d]));

  const seenEmails = new Map<string, number>();
  const validated: ValidatedImportRow[] = [];

  const emails = input.rows
    .map((r) => mapRowToData(r, input.mapping, customDefs).emailNormalized)
    .filter((e): e is string => Boolean(e));

  const existingContacts = emails.length
    ? await db.crmContact.findMany({
        where: { emailNormalized: { in: emails.slice(0, 5000) } },
        select: {
          id: true,
          emailNormalized: true,
          isArchived: true,
          emailStatus: true,
        },
      })
    : [];
  const existingByEmail = new Map(
    existingContacts.map((c) => [c.emailNormalized!, c]),
  );

  let duplicateFileWarning: string | null = null;
  if (input.fileHash) {
    const prior = await db.crmContactImport.findFirst({
      where: { fileHash: input.fileHash, status: "COMPLETED" },
      orderBy: { completedAt: "desc" },
      select: { completedAt: true, fileName: true },
    });
    if (prior?.completedAt) {
      duplicateFileWarning = `This exact file was previously imported on ${prior.completedAt.toISOString().slice(0, 10)} (${prior.fileName}).`;
    }
  }

  const companyDomains = new Set<string>();

  for (const row of input.rows) {
    const data = mapRowToData(row, input.mapping, customDefs);
    const issues: ValidatedImportRow["issues"] = [];
    let action: ValidatedImportRow["action"] = "CREATE";

    if (!hasIdentity(data)) {
      issues.push({
        severity: "ERROR",
        code: "MISSING_IDENTITY",
        message: "Row needs a name, email, or phone.",
      });
      action = "INVALID";
    }

    if (data.email && !data.emailNormalized) {
      issues.push({
        severity: "ERROR",
        code: "INVALID_EMAIL",
        field: "email",
        message: "Invalid email address.",
      });
      action = "INVALID";
    }

    if (data.lifecycle && !LIFECYCLES.has(data.lifecycle.toUpperCase())) {
      issues.push({
        severity: "ERROR",
        code: "INVALID_LIFECYCLE",
        field: "lifecycle",
        message: "Unknown lifecycle value.",
      });
      action = "INVALID";
    } else if (data.lifecycle) {
      data.lifecycle = data.lifecycle.toUpperCase();
    }

    if (data.countryName && !data.countryCode) {
      const c = normalizeCountryInput(data.countryName);
      if (c) {
        data.countryCode = c.countryCode;
        data.countryName = c.countryName;
      } else {
        issues.push({
          severity: "WARNING",
          code: "UNKNOWN_COUNTRY",
          field: "country",
          message: "Country could not be normalized.",
        });
      }
    }

    if (data.timezone && !isValidIanaTimezone(data.timezone)) {
      issues.push({
        severity: "ERROR",
        code: "INVALID_TIMEZONE",
        field: "timezone",
        message: "Invalid IANA timezone.",
      });
      action = "INVALID";
    }

    for (const [platform, url] of Object.entries(data.socialProfiles ?? {})) {
      if (!url) continue;
      const validated = validateSocialProfileUrl(platform as never, url);
      if (!validated.ok) {
        issues.push({
          severity: "ERROR",
          code: "INVALID_SOCIAL_URL",
          field: platform,
          message: validated.error,
        });
        action = "INVALID";
      }
    }

    for (const [defId, rawVal] of Object.entries(data.customProperties ?? {})) {
      const def = customDefs.get(defId);
      if (!def) {
        issues.push({
          severity: "ERROR",
          code: "UNKNOWN_PROPERTY",
          message: "Unknown custom property.",
        });
        action = "INVALID";
        continue;
      }
      const v = validatePropertyValueInput(def, rawVal);
      if (!v.ok) {
        issues.push({
          severity: "ERROR",
          code: "INVALID_CUSTOM_PROPERTY",
          field: def.label,
          message: v.error,
        });
        action = "INVALID";
      }
    }

    if (data.emailNormalized) {
      const firstRow = seenEmails.get(data.emailNormalized);
      if (firstRow != null) {
        issues.push({
          severity: "ERROR",
          code: "DUPLICATE_EMAIL_IN_FILE",
          field: "email",
          message: `Duplicate of row ${firstRow}.`,
        });
        action = "DUPLICATE_IN_FILE";
      } else {
        seenEmails.set(data.emailNormalized, row.rowNumber);
      }
    }

    let existingContactId: string | null = null;
    let existingArchived = false;

    if (data.emailNormalized && action !== "DUPLICATE_IN_FILE" && action !== "INVALID") {
      const existing = existingByEmail.get(data.emailNormalized);
      if (existing) {
        existingContactId = existing.id;
        existingArchived = existing.isArchived;
        if (existing.isArchived) {
          action = "SKIP_ARCHIVED";
          issues.push({
            severity: "WARNING",
            code: "EXISTING_ARCHIVED",
            message: "Contact is archived — skipped by default.",
          });
        } else if (input.options.existingStrategy === "SKIP") {
          action = "SKIP_EXISTING";
        } else {
          action = "UPDATE";
        }
      }
    }

    if (data.companyDomain) companyDomains.add(data.companyDomain);
    else if (data.companyName) companyDomains.add(`name:${data.companyName.toLowerCase()}`);

    validated.push({
      rowNumber: row.rowNumber,
      action: issues.some(
        (i) => i.severity === "ERROR" && i.code !== "DUPLICATE_EMAIL_IN_FILE",
      )
        ? "INVALID"
        : action,
      issues,
      data,
      existingContactId,
      existingArchived,
    });
  }

  const summary: ImportValidationSummary = {
    totalRows: input.rows.length,
    validRows: validated.filter((r) => r.action !== "INVALID" && r.action !== "DUPLICATE_IN_FILE").length,
    invalidRows: validated.filter((r) => r.action === "INVALID").length,
    newContacts: validated.filter((r) => r.action === "CREATE").length,
    existingContacts: validated.filter((r) =>
      ["SKIP_EXISTING", "UPDATE", "SKIP_ARCHIVED"].includes(r.action),
    ).length,
    duplicateInFile: validated.filter((r) => r.action === "DUPLICATE_IN_FILE").length,
    willUpdate: validated.filter((r) => r.action === "UPDATE").length,
    willSkip: validated.filter((r) =>
      ["SKIP_EXISTING", "SKIP_ARCHIVED", "DUPLICATE_IN_FILE"].includes(r.action),
    ).length,
    potentialCompanies: companyDomains.size,
    createdLeadsEstimate:
      input.options.createLeads
        ? validated.filter((r) => r.action === "CREATE").length
        : 0,
    duplicateFileWarning,
  };

  return { rows: validated, summary };
}

export function isSuppressedStatus(status: string): boolean {
  return BLOCKED_EMAIL_STATUSES.includes(
    status as (typeof BLOCKED_EMAIL_STATUSES)[number],
  );
}
