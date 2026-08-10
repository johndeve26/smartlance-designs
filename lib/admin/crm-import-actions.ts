"use server";

import { revalidatePath } from "next/cache";
import { assertSameOrigin, requireAdminUser } from "@/lib/admin/session";
import { writeAuditLog } from "@/lib/repositories/auditRepository";
import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import {
  CRM_CSV_IMPORT_MAX_ISSUES_STORED,
  CRM_CSV_IMPORT_PREVIEW_ROWS,
  DEFAULT_IMPORT_OPTIONS,
  STANDARD_IMPORT_FIELDS,
  type ColumnMapping,
  type ContactImportOptions,
} from "@/lib/crm/import/constants";
import {
  buildImportTemplateCsv,
  buildRejectedRowsCsv,
  hashCsvFile,
  parseContactCsvBuffer,
} from "@/lib/crm/import/parse";
import { suggestColumnMapping, sampleValuesForColumn, mappingFieldLabel } from "@/lib/crm/import/mapping";
import { listContactPropertyDefinitions } from "@/lib/crm/properties/definitions";
import { validateImportRows } from "@/lib/crm/import/validate";
import { executeContactImport } from "@/lib/crm/import/execute";
import { z } from "zod";

const optionsSchema = z.object({
  existingStrategy: z.enum(["SKIP", "UPDATE_EMPTY", "UPDATE_SELECTED"]),
  updateFields: z.array(z.string()).optional(),
  createMissingCompanies: z.boolean(),
  createLeads: z.boolean(),
  leadStatus: z.enum([
    "NEW",
    "ATTEMPTING",
    "CONNECTED",
    "QUALIFIED",
    "UNQUALIFIED",
    "BAD_TIMING",
    "CLOSED",
  ]),
  leadTemperature: z.enum(["COLD", "WARM", "HOT"]),
  source: z.enum(["MANUAL", "OUTBOUND", "REFERRAL", "OTHER", "SOCIAL", "UPWORK"]),
  sourceDetail: z.string().max(200),
  assignOwnerId: z.string().cuid().nullable().optional(),
});

async function readCsvFileAsync(formData: FormData) {
  const file = formData.get("file");
  if (!(file instanceof File)) throw new Error("CSV file required.");
  if (!file.name.toLowerCase().endsWith(".csv")) throw new Error("Only .csv files are supported.");
  const buffer = Buffer.from(await file.arrayBuffer());
  return { buffer, fileName: file.name.slice(0, 200) };
}

export async function getContactImportTemplateAction() {
  await requireAdminUser("manage_crm");
  return { ok: true as const, csv: buildImportTemplateCsv() };
}

export async function parseContactImportUploadAction(formData: FormData) {
  await assertSameOrigin();
  await requireAdminUser("manage_crm");

  try {
    const { buffer, fileName } = await readCsvFileAsync(formData);
    const fileHash = hashCsvFile(buffer);
    const { headers, rows } = parseContactCsvBuffer(buffer);
    const customProperties = await listContactPropertyDefinitions();
    const suggestedMapping = suggestColumnMapping(headers, customProperties);

    const columnSamples = headers.map((header) => ({
      header,
      samples: sampleValuesForColumn(rows, header),
      suggested: suggestedMapping[header] ?? "skip",
      label: mappingFieldLabel(suggestedMapping[header] ?? "skip", customProperties),
    }));

    return {
      ok: true as const,
      fileName,
      fileHash,
      headers,
      totalRows: rows.length,
      columnSamples,
      suggestedMapping,
      mappingOptions: [
        { value: "skip", label: "Do not import" },
        ...STANDARD_IMPORT_FIELDS.map((f) => ({
          value: f,
          label: mappingFieldLabel(f, customProperties),
        })),
        ...customProperties.map((p) => ({
          value: `custom:${p.id}`,
          label: mappingFieldLabel(`custom:${p.id}`, customProperties),
        })),
      ],
    };
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : "Failed to parse CSV.",
    };
  }
}

export async function previewContactImportAction(input: {
  formData: FormData;
  mapping: ColumnMapping;
  options: ContactImportOptions;
  previewFileHash: string;
}) {
  await assertSameOrigin();
  const user = await requireAdminUser("manage_crm");

  try {
    const { buffer, fileName } = await readCsvFileAsync(input.formData);
    const fileHash = hashCsvFile(buffer);
    if (fileHash !== input.previewFileHash) {
      return { ok: false as const, error: "File changed since upload. Please re-upload and preview again." };
    }

    const parsed = parseContactCsvBuffer(buffer);
    const options = optionsSchema.parse(input.options) as ContactImportOptions;
    const { rows: validated, summary } = await validateImportRows({
      rows: parsed.rows,
      mapping: input.mapping,
      options,
      fileHash,
    });

    const importJob = await prisma.crmContactImport.create({
      data: {
        fileName,
        fileHash,
        status: "PREVIEWED",
        totalRows: summary.totalRows,
        validRows: summary.validRows,
        invalidRows: summary.invalidRows,
        duplicateRows: summary.duplicateInFile,
        mappingJson: input.mapping,
        optionsJson: options,
        summaryJson: summary,
        createdById: user.id,
      },
    });

    const issueRows = validated
      .filter((r) => r.issues.length)
      .slice(0, CRM_CSV_IMPORT_MAX_ISSUES_STORED);

    if (issueRows.length) {
      await prisma.crmContactImportIssue.createMany({
        data: issueRows.flatMap((r) =>
          r.issues.map((issue) => ({
            importId: importJob.id,
            rowNumber: r.rowNumber,
            severity: issue.severity,
            code: issue.code,
            field: issue.field ?? null,
            message: issue.message,
            rowSnapshotJson: JSON.parse(JSON.stringify(r.data)) as Prisma.InputJsonValue,
          })),
        ),
      });
    }

    const previewRows = validated.slice(0, CRM_CSV_IMPORT_PREVIEW_ROWS).map((r) => ({
      rowNumber: r.rowNumber,
      name:
        r.data.displayName ||
        [r.data.firstName, r.data.lastName].filter(Boolean).join(" ") ||
        "—",
      email: r.data.email ?? "—",
      phone: r.data.phone ?? "—",
      company: r.data.companyName ?? "—",
      action: r.action,
      issues: r.issues.map((i) => i.message),
    }));

    return {
      ok: true as const,
      importId: importJob.id,
      fileHash,
      summary,
      previewRows,
    };
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : "Preview failed.",
    };
  }
}

export async function executeContactImportAction(input: {
  formData: FormData;
  importId: string;
  expectedFileHash: string;
  mapping: ColumnMapping;
  options: ContactImportOptions;
}) {
  await assertSameOrigin();
  const user = await requireAdminUser("manage_crm");

  const job = await prisma.crmContactImport.findUnique({
    where: { id: input.importId },
  });
  if (!job || job.status !== "PREVIEWED") {
    return { ok: false as const, error: "Import preview not found or already processed." };
  }

  try {
    const { buffer, fileName } = await readCsvFileAsync(input.formData);
    const fileHash = hashCsvFile(buffer);
    if (fileHash !== input.expectedFileHash || fileHash !== job.fileHash) {
      return { ok: false as const, error: "File does not match previewed file. Please preview again." };
    }

    const parsed = parseContactCsvBuffer(buffer);
    const options = optionsSchema.parse(input.options) as ContactImportOptions;
    const { rows: validated } = await validateImportRows({
      rows: parsed.rows,
      mapping: input.mapping,
      options,
      fileHash,
    });

    const result = await executeContactImport({
      importId: input.importId,
      rows: validated,
      options,
      actorId: user.id,
      fileName,
    });

    await writeAuditLog({
      actorId: user.id,
      action: "crm_contact_import_completed",
      entityType: "CrmContactImport",
      entityId: input.importId,
      metadata: {
        fileName,
        ...result,
      },
    });

    revalidatePath("/admin/crm/contacts");
    revalidatePath("/admin/crm/imports");
    revalidatePath(`/admin/crm/imports/${input.importId}`);

    return { ok: true as const, importId: input.importId, result };
  } catch (err) {
    await writeAuditLog({
      actorId: user.id,
      action: "crm_contact_import_failed",
      entityType: "CrmContactImport",
      entityId: input.importId,
      metadata: {
        error: err instanceof Error ? err.message.slice(0, 120) : "failed",
      },
    });
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : "Import failed.",
    };
  }
}

export async function downloadImportRejectedRowsAction(importId: string) {
  await assertSameOrigin();
  await requireAdminUser("manage_crm");

  const job = await prisma.crmContactImport.findUnique({ where: { id: importId } });
  if (!job) return { ok: false as const, error: "Import not found." };

  const issues = await prisma.crmContactImportIssue.findMany({
    where: { importId, severity: "ERROR" },
    orderBy: { rowNumber: "asc" },
    take: CRM_CSV_IMPORT_MAX_ISSUES_STORED,
  });

  const mapping = job.mappingJson as ColumnMapping;
  const headers = Object.keys(mapping);

  const csv = buildRejectedRowsCsv({
    headers,
    rows: issues.map((issue) => ({
      rowNumber: issue.rowNumber,
      values: (issue.rowSnapshotJson as Record<string, string>) ?? {},
      code: issue.code,
      message: issue.message,
    })),
  });

  return { ok: true as const, csv, fileName: `rejected-${job.fileName}` };
}

export async function listContactImportsAction() {
  await requireAdminUser("view_crm");
  return prisma.crmContactImport.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      createdBy: { select: { id: true, name: true } },
    },
  });
}

export async function getContactImportDetailAction(importId: string) {
  await requireAdminUser("view_crm");
  return prisma.crmContactImport.findUnique({
    where: { id: importId },
    include: {
      createdBy: { select: { id: true, name: true } },
      issues: { orderBy: { rowNumber: "asc" }, take: 200 },
    },
  });
}
