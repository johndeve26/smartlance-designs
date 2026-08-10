import { describe, expect, it } from "vitest";
import {
  CRM_CSV_IMPORT_MAX_ROWS,
  DEFAULT_IMPORT_OPTIONS,
} from "@/lib/crm/import/constants";
import {
  hashCsvFile,
  parseContactCsvBuffer,
  buildRejectedRowsCsv,
  sanitizeCsvCell,
} from "@/lib/crm/import/parse";
import { suggestColumnMapping } from "@/lib/crm/import/mapping";
import { validateImportRows } from "@/lib/crm/import/validate";
import type { ImportableCsvField } from "@/lib/crm/import/constants";

const mockImportDb = {
  crmContact: { findMany: async () => [] },
  crmCompany: {},
  crmContactImport: { findFirst: async () => null },
  crmPropertyDefinition: { findMany: async () => [] },
} as unknown as Parameters<typeof validateImportRows>[0]["db"];

function csvBuffer(text: string) {
  return Buffer.from(text, "utf8");
}

describe("CSV import parse", () => {
  it("parses basic contacts", () => {
    const { headers, rows } = parseContactCsvBuffer(
      csvBuffer("First Name,Last Name,Email\nJane,Doe,jane@example.com\n"),
    );
    expect(headers).toEqual(["First Name", "Last Name", "Email"]);
    expect(rows).toHaveLength(1);
    expect(rows[0]!.rowNumber).toBe(2);
    expect(rows[0]!.values["First Name"]).toBe("Jane");
  });

  it("handles quoted commas", () => {
    const { rows } = parseContactCsvBuffer(
      csvBuffer('Name,Company\nJane Doe,"Acme, Inc."\n'),
    );
    expect(rows[0]!.values.Company).toBe("Acme, Inc.");
  });

  it("strips UTF-8 BOM", () => {
    const bom = "\uFEFF";
    const { headers } = parseContactCsvBuffer(
      csvBuffer(`${bom}Name,Email\nJane,jane@example.com\n`),
    );
    expect(headers[0]).toBe("Name");
  });

  it("rejects row limit overflow", () => {
    const header = "Email\n";
    const body = Array.from({ length: CRM_CSV_IMPORT_MAX_ROWS + 1 }, (_, i) => `u${i}@x.com`).join("\n");
    expect(() => parseContactCsvBuffer(csvBuffer(header + body))).toThrow(/maximum/);
  });

  it("computes stable file hash", () => {
    const buf = csvBuffer("a,b\n1,2\n");
    expect(hashCsvFile(buf)).toHaveLength(64);
    expect(hashCsvFile(buf)).toBe(hashCsvFile(Buffer.from("a,b\n1,2\n")));
  });

  it("sanitizes formula injection cells", () => {
    expect(sanitizeCsvCell("=HYPERLINK(\"x\")")).toBe("=HYPERLINK(\"x\")");
    expect(sanitizeCsvCell("'=SUM(A1)")).toBe("=SUM(A1)");
  });
});

describe("CSV column auto-mapping", () => {
  it("maps common headers", () => {
    const mapping = suggestColumnMapping([
      "First Name",
      "Last Name",
      "Email Address",
      "Company",
    ]);
    expect(mapping["First Name"]).toBe("firstName");
    expect(mapping["Last Name"]).toBe("lastName");
    expect(mapping["Email Address"]).toBe("email");
    expect(mapping.Company).toBe("companyName");
  });

  it("blocks internal headers", () => {
    const mapping = suggestColumnMapping(["emailStatus", "isArchived", "Email"]);
    expect(mapping.emailStatus).toBe("skip");
    expect(mapping.isArchived).toBe("skip");
    expect(mapping.Email).toBe("email");
  });

  it("maps display name from Name column", () => {
    const mapping = suggestColumnMapping(["Name", "Email"]);
    expect(mapping.Name).toBe("displayName");
  });
});

describe("CSV import validation", () => {
  it("requires identity", async () => {
    const { rows, summary } = await validateImportRows({
      db: mockImportDb,
      rows: [{ rowNumber: 2, values: { Notes: "hello" } }],
      mapping: { Notes: "notes" },
      options: DEFAULT_IMPORT_OPTIONS,
    });
    expect(summary.invalidRows).toBe(1);
    expect(rows[0]!.action).toBe("INVALID");
  });

  it("flags duplicate emails in file", async () => {
    const parsed = parseContactCsvBuffer(
      csvBuffer("Email\na@example.com\na@example.com\n"),
    );
    const mapping = suggestColumnMapping(["Email"]);
    const { rows, summary } = await validateImportRows({
      db: mockImportDb,
      rows: parsed.rows,
      mapping,
      options: DEFAULT_IMPORT_OPTIONS,
    });
    expect(summary.duplicateInFile).toBe(1);
    expect(rows.some((r) => r.action === "DUPLICATE_IN_FILE")).toBe(true);
    expect(rows.some((r) => r.action === "CREATE")).toBe(true);
  });

  it("rejects invalid email", async () => {
    const { rows } = await validateImportRows({
      db: mockImportDb,
      rows: [{ rowNumber: 2, values: { Email: "not-an-email" } }],
      mapping: { Email: "email" },
      options: DEFAULT_IMPORT_OPTIONS,
    });
    expect(rows[0]!.action).toBe("INVALID");
    expect(rows[0]!.issues.some((i) => i.code === "INVALID_EMAIL")).toBe(true);
  });

  it("maps displayName without splitting", async () => {
    const { rows } = await validateImportRows({
      db: mockImportDb,
      rows: [{ rowNumber: 2, values: { Name: "Jane Doe", Email: "jane@example.com" } }],
      mapping: { Name: "displayName", Email: "email" },
      options: DEFAULT_IMPORT_OPTIONS,
    });
    expect(rows[0]!.action).toBe("CREATE");
    expect(rows[0]!.data.displayName).toBe("Jane Doe");
  });
});

describe("rejected rows CSV export", () => {
  it("escapes formula injection", () => {
    const csv = buildRejectedRowsCsv({
      headers: ["Name"],
      rows: [
        {
          rowNumber: 3,
          values: { Name: "=HYPERLINK(\"x\")" },
          code: "INVALID_EMAIL",
          message: "Invalid email",
        },
      ],
    });
    expect(csv).toContain("'=HYPERLINK");
  });
});
