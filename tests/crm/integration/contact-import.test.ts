import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import type { PrismaClient } from "@prisma/client";
import {
  cleanupCrmIntegrationFixtures,
  disconnectIntegrationPrisma,
  getIntegrationPrisma,
} from "./db";
import { createIntegrationAdmin, TEST_PREFIX } from "./fixtures";
import { hasIntegrationDatabase } from "./guard";
import { parseContactCsvBuffer } from "@/lib/crm/import/parse";
import { suggestColumnMapping } from "@/lib/crm/import/mapping";
import { validateImportRows } from "@/lib/crm/import/validate";
import { executeContactImport } from "@/lib/crm/import/execute";
import { DEFAULT_IMPORT_OPTIONS } from "@/lib/crm/import/constants";

const describeIntegration = hasIntegrationDatabase() ? describe : describe.skip;

describeIntegration("CRM contact CSV import — live DB", () => {
  let db: PrismaClient;
  let adminId: string;

  beforeAll(async () => {
    db = getIntegrationPrisma();
    const admin = await createIntegrationAdmin(db);
    adminId = admin.id;
  });

  beforeEach(async () => {
    await cleanupCrmIntegrationFixtures(db);
    await db.crmContactImportIssue.deleteMany({
      where: { import: { fileName: { in: ["test-import.csv", "skip.csv"] } } },
    });
    await db.crmContactImport.deleteMany({
      where: { fileName: { in: ["test-import.csv", "skip.csv"] } },
    });
    await db.crmContact.deleteMany({
      where: { email: { contains: "@import.test" } },
    });
  });

  afterAll(async () => {
    await cleanupCrmIntegrationFixtures(db);
    await disconnectIntegrationPrisma();
  });

  it("imports new contacts without creating subscribers", async () => {
    const csv = Buffer.from(
      `First Name,Last Name,Email\nJane,Import,${TEST_PREFIX}jane@import.test\n`,
    );
    const parsed = parseContactCsvBuffer(csv);
    const mapping = suggestColumnMapping(parsed.headers);
    const { rows } = await validateImportRows({
      db,
      rows: parsed.rows,
      mapping,
      options: DEFAULT_IMPORT_OPTIONS,
    });

    const importJob = await db.crmContactImport.create({
      data: {
        fileName: "test-import.csv",
        fileHash: "test-hash",
        status: "PREVIEWED",
        totalRows: 1,
        validRows: 1,
        mappingJson: mapping,
        optionsJson: DEFAULT_IMPORT_OPTIONS,
        createdById: adminId,
      },
    });

    const result = await executeContactImport({
      db,
      importId: importJob.id,
      rows,
      options: DEFAULT_IMPORT_OPTIONS,
      actorId: adminId,
      fileName: "test-import.csv",
    });

    expect(result.createdContacts).toBe(1);

    const contact = await db.crmContact.findFirst({
      where: { emailNormalized: `${TEST_PREFIX}jane@import.test` },
    });
    expect(contact).toBeTruthy();
    expect(contact?.sourceDetail).toContain("CSV import");

    const subscribers = await db.subscriber.count({
      where: { emailNormalized: `${TEST_PREFIX}jane@import.test` },
    });
    expect(subscribers).toBe(0);
  });

  it("skips existing contact with SKIP strategy", async () => {
    const email = `${TEST_PREFIX}skip@import.test`;
    await db.crmContact.create({
      data: {
        email,
        emailNormalized: email,
        firstName: "Existing",
        source: "MANUAL",
        createdById: adminId,
      },
    });

    const parsed = parseContactCsvBuffer(
      Buffer.from(`Email,Phone\n${email},+15551234567\n`),
    );
    const mapping = suggestColumnMapping(parsed.headers);
    const { rows } = await validateImportRows({
      db,
      rows: parsed.rows,
      mapping,
      options: { ...DEFAULT_IMPORT_OPTIONS, existingStrategy: "SKIP" },
    });

    expect(rows[0]?.action).toBe("SKIP_EXISTING");

    const importJob = await db.crmContactImport.create({
      data: {
        fileName: "skip.csv",
        fileHash: "skip-hash",
        status: "PREVIEWED",
        mappingJson: mapping,
        optionsJson: DEFAULT_IMPORT_OPTIONS,
        createdById: adminId,
      },
    });

    const result = await executeContactImport({
      db,
      importId: importJob.id,
      rows,
      options: { ...DEFAULT_IMPORT_OPTIONS, existingStrategy: "SKIP" },
      actorId: adminId,
      fileName: "skip.csv",
    });

    expect(result.skippedContacts).toBe(1);
    const contact = await db.crmContact.findFirst({ where: { emailNormalized: email } });
    expect(contact?.phone).toBeNull();
  });
});
