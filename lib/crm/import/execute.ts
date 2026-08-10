import type { PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/db";
import { recordCrmActivity } from "@/lib/crm/activities";
import { createCompany, findCompanyByDomain, findCompanyByName } from "@/lib/crm/companies";
import { CRM_CSV_IMPORT_BATCH_SIZE } from "@/lib/crm/import/constants";
import type { ContactImportOptions, ValidatedImportRow } from "@/lib/crm/import/constants";
import { syncSubscriberStatusToContact } from "@/lib/crm/email";
import { findActiveLeadForContact, createLead } from "@/lib/crm/leads";
import { normalizeCompanyDomain } from "@/lib/crm/normalize";
import { upsertContactSocialProfile } from "@/lib/crm/social-profiles";
import { setContactPropertyValue } from "@/lib/crm/properties/values";
import type { CrmSocialPlatform } from "@prisma/client";

type Db = PrismaClient;

async function resolveCompanyId(
  db: Db,
  row: ValidatedImportRow,
  options: ContactImportOptions,
  companyCache: Map<string, string>,
): Promise<{ companyId: string | null; created: boolean }> {
  const domain =
    row.data.companyDomain ??
    (row.data.companyWebsite ? normalizeCompanyDomain(row.data.companyWebsite) : null);
  const name = row.data.companyName?.trim();

  if (domain) {
    const cacheKey = `d:${domain}`;
    if (companyCache.has(cacheKey)) {
      return { companyId: companyCache.get(cacheKey)!, created: false };
    }
    const existing = await findCompanyByDomain(db, domain);
    if (existing) {
      companyCache.set(cacheKey, existing.id);
      return { companyId: existing.id, created: false };
    }
    if (!options.createMissingCompanies || !name) return { companyId: null, created: false };
    const created = await createCompany({
      name,
      website: row.data.companyWebsite ?? null,
    });
    companyCache.set(cacheKey, created.id);
    return { companyId: created.id, created: true };
  }

  if (name) {
    const cacheKey = `n:${name.toLowerCase()}`;
    if (companyCache.has(cacheKey)) {
      return { companyId: companyCache.get(cacheKey)!, created: false };
    }
    const existing = await findCompanyByName(db, name);
    if (existing) {
      companyCache.set(cacheKey, existing.id);
      return { companyId: existing.id, created: false };
    }
    if (!options.createMissingCompanies) return { companyId: null, created: false };
    const created = await createCompany({
      name,
      website: row.data.companyWebsite ?? null,
    });
    companyCache.set(cacheKey, created.id);
    return { companyId: created.id, created: true };
  }

  return { companyId: null, created: false };
}

async function applyEmptyFieldUpdates(
  db: Db,
  contactId: string,
  row: ValidatedImportRow,
  options: ContactImportOptions,
) {
  const existing = await db.crmContact.findUniqueOrThrow({ where: { id: contactId } });
  const updates: Record<string, string | null> = {};

  const maybeSet = (
    field: keyof ValidatedImportRow["data"],
    dbField: keyof typeof existing,
    value?: string | null,
  ) => {
    if (!value?.trim()) return;
    const current = existing[dbField as keyof typeof existing];
    if (options.existingStrategy === "UPDATE_EMPTY" && current) return;
    if (
      options.existingStrategy === "UPDATE_SELECTED" &&
      options.updateFields &&
      !options.updateFields.includes(field as never)
    ) {
      return;
    }
    updates[dbField as string] = value.trim();
  };

  maybeSet("firstName", "firstName", row.data.firstName);
  maybeSet("lastName", "lastName", row.data.lastName);
  maybeSet("displayName", "displayName", row.data.displayName);
  maybeSet("phone", "phone", row.data.phone);
  maybeSet("jobTitle", "jobTitle", row.data.jobTitle);
  maybeSet("stateRegion", "stateRegion", row.data.stateRegion);
  maybeSet("city", "city", row.data.city);
  maybeSet("postalCode", "postalCode", row.data.postalCode);
  maybeSet("timezone", "timezone", row.data.timezone);
  if (row.data.countryCode && !existing.countryCode) {
    updates.countryCode = row.data.countryCode;
    updates.countryName = row.data.countryName ?? null;
  }

  if (Object.keys(updates).length) {
    await db.crmContact.update({ where: { id: contactId }, data: updates });
  }

  await applySocialAndCustom(db, contactId, row, options.existingStrategy === "UPDATE_EMPTY");
}

async function applySocialAndCustom(
  db: Db,
  contactId: string,
  row: ValidatedImportRow,
  emptyOnly: boolean,
) {
  for (const [platform, url] of Object.entries(row.data.socialProfiles ?? {})) {
    if (!url?.trim()) continue;
    if (emptyOnly) {
      const existing = await db.crmContactSocialProfile.findFirst({
        where: { contactId, platform: platform as CrmSocialPlatform },
      });
      if (existing) continue;
    }
    await upsertContactSocialProfile({
      contactId,
      platform: platform as CrmSocialPlatform,
      url,
    });
  }

  for (const [defId, rawVal] of Object.entries(row.data.customProperties ?? {})) {
    if (emptyOnly) {
      const existing = await db.crmContactPropertyValue.findUnique({
        where: { definitionId_contactId: { definitionId: defId, contactId } },
      });
      if (existing) continue;
    }
    await setContactPropertyValue({ contactId, definitionId: defId, rawValue: rawVal });
  }
}

export async function executeContactImport(input: {
  db?: Db;
  importId: string;
  rows: ValidatedImportRow[];
  options: ContactImportOptions;
  actorId: string;
  fileName: string;
}) {
  const db = input.db ?? prisma;
  const companyCache = new Map<string, string>();
  const counts = {
    createdContacts: 0,
    updatedContacts: 0,
    skippedContacts: 0,
    createdCompanies: 0,
    createdLeads: 0,
    invalidRows: 0,
    duplicateRows: 0,
  };

  const importable = input.rows.filter(
    (r) => !["INVALID", "DUPLICATE_IN_FILE"].includes(r.action),
  );

  await db.crmContactImport.update({
    where: { id: input.importId },
    data: { status: "PROCESSING", startedAt: new Date() },
  });

  try {
    for (let i = 0; i < importable.length; i += CRM_CSV_IMPORT_BATCH_SIZE) {
      const batch = importable.slice(i, i + CRM_CSV_IMPORT_BATCH_SIZE);

      for (const row of batch) {
        if (row.action === "SKIP_EXISTING" || row.action === "SKIP_ARCHIVED") {
          counts.skippedContacts++;
          continue;
        }

        if (row.action === "DUPLICATE_IN_FILE") {
          counts.duplicateRows++;
          continue;
        }

        const { companyId, created: companyCreated } = await resolveCompanyId(
          db,
          row,
          input.options,
          companyCache,
        );
        if (companyCreated) counts.createdCompanies++;

        if (row.action === "UPDATE" && row.existingContactId) {
          await applyEmptyFieldUpdates(db, row.existingContactId, row, input.options);
          await applySocialAndCustom(db, row.existingContactId, row, input.options.existingStrategy === "UPDATE_EMPTY");
          if (companyId) {
            const c = await db.crmContact.findUnique({
              where: { id: row.existingContactId },
            });
            if (c && !c.companyId) {
              await db.crmContact.update({
                where: { id: row.existingContactId },
                data: { companyId },
              });
            }
          }
          await recordCrmActivity({
            contactId: row.existingContactId,
            type: "CONTACT_IMPORTED",
            subject: "Contact updated from CSV import",
            metadata: { importId: input.importId, fileName: input.fileName, mode: "update" },
            createdById: input.actorId,
          });
          counts.updatedContacts++;
          continue;
        }

        if (row.action !== "CREATE") {
          counts.skippedContacts++;
          continue;
        }

        try {
          const contact = await db.crmContact.create({
            data: {
              firstName: row.data.firstName?.trim() || null,
              lastName: row.data.lastName?.trim() || null,
              displayName: row.data.displayName?.trim() || null,
              email: row.data.email?.trim() || null,
              emailNormalized: row.data.emailNormalized ?? null,
              phone: row.data.phone ?? null,
              jobTitle: row.data.jobTitle?.trim() || null,
              companyId,
              countryCode: row.data.countryCode ?? null,
              countryName: row.data.countryName ?? null,
              stateRegion: row.data.stateRegion?.trim() || null,
              city: row.data.city?.trim() || null,
              postalCode: row.data.postalCode?.trim() || null,
              timezone: row.data.timezone?.trim() || null,
              lifecycleStage:
                (row.data.lifecycle as never) ?? "PROSPECT",
              source: input.options.source,
              sourceDetail:
                row.data.sourceDetail?.trim() ||
                input.options.sourceDetail ||
                `CSV import: ${input.fileName}`,
              ownerId: input.options.assignOwnerId ?? null,
              createdById: input.actorId,
            },
          });

          if (contact.email) {
            await syncSubscriberStatusToContact(contact.email);
          }

          await applySocialAndCustom(db, contact.id, row, false);

          if (row.data.notes?.trim()) {
            await recordCrmActivity({
              contactId: contact.id,
              type: "NOTE",
              subject: "Imported note",
              body: row.data.notes.trim().slice(0, 8000),
              createdById: input.actorId,
            });
          }

          await recordCrmActivity({
            contactId: contact.id,
            companyId: contact.companyId,
            type: "CONTACT_IMPORTED",
            subject: "Contact imported from CSV",
            metadata: { importId: input.importId, fileName: input.fileName },
            createdById: input.actorId,
          });

          counts.createdContacts++;

          if (input.options.createLeads) {
            const active = await findActiveLeadForContact(contact.id);
            if (!active) {
              try {
                await createLead({
                  contactId: contact.id,
                  companyId: contact.companyId,
                  status: input.options.leadStatus,
                  temperature: input.options.leadTemperature,
                  source: input.options.source,
                  ownerId: input.options.assignOwnerId ?? null,
                  createdById: input.actorId,
                });
                counts.createdLeads++;
              } catch {
                // active lead race — skip
              }
            }
          }
        } catch (err) {
          if (
            err instanceof Error &&
            err.message.includes("Unique constraint")
          ) {
            counts.skippedContacts++;
          } else {
            throw err;
          }
        }
      }
    }

    await db.crmContactImport.update({
      where: { id: input.importId },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
        createdContacts: counts.createdContacts,
        updatedContacts: counts.updatedContacts,
        skippedContacts: counts.skippedContacts,
        createdCompanies: counts.createdCompanies,
        createdLeads: counts.createdLeads,
        duplicateRows: counts.duplicateRows,
        invalidRows: input.rows.filter((r) => r.action === "INVALID").length,
      },
    });

    return counts;
  } catch (err) {
    await db.crmContactImport.update({
      where: { id: input.importId },
      data: {
        status: "FAILED",
        failedAt: new Date(),
        failureSafe:
          err instanceof Error ? err.message.slice(0, 200) : "Import failed.",
        createdContacts: counts.createdContacts,
        updatedContacts: counts.updatedContacts,
        skippedContacts: counts.skippedContacts,
        createdCompanies: counts.createdCompanies,
        createdLeads: counts.createdLeads,
      },
    });
    throw err;
  }
}
