import { createHash } from "node:crypto";
import { parse } from "csv-parse/sync";
import { escapeCrmCsvCell } from "@/lib/crm/contacts";
import {
  CRM_CSV_IMPORT_MAX_BYTES,
  CRM_CSV_IMPORT_MAX_CELL_LENGTH,
  CRM_CSV_IMPORT_MAX_ROWS,
  type ParsedImportRow,
} from "@/lib/crm/import/constants";

export function hashCsvFile(buffer: Buffer): string {
  return createHash("sha256").update(buffer).digest("hex");
}

export function sanitizeCsvCell(value: string): string {
  let v = value.trim();
  if (v.startsWith("'") && /^'[=+\-@]/.test(v)) {
    v = v.slice(1);
  }
  if (v.length > CRM_CSV_IMPORT_MAX_CELL_LENGTH) {
    return v.slice(0, CRM_CSV_IMPORT_MAX_CELL_LENGTH);
  }
  return v;
}

export function parseContactCsvBuffer(buffer: Buffer): {
  headers: string[];
  rows: ParsedImportRow[];
} {
  if (buffer.length > CRM_CSV_IMPORT_MAX_BYTES) {
    throw new Error(`CSV file exceeds ${CRM_CSV_IMPORT_MAX_BYTES / (1024 * 1024)} MB limit.`);
  }

  let text = buffer.toString("utf8");
  if (text.charCodeAt(0) === 0xfeff) {
    text = text.slice(1);
  }

  const records = parse(text, {
    columns: true,
    skip_empty_lines: true,
    relax_column_count: true,
    trim: true,
    bom: true,
  }) as Record<string, string>[];

  if (records.length > CRM_CSV_IMPORT_MAX_ROWS) {
    throw new Error(`CSV exceeds maximum of ${CRM_CSV_IMPORT_MAX_ROWS} data rows.`);
  }

  const headers = records.length
    ? Object.keys(records[0]!)
    : parse(text, { to_line: 1, trim: true, bom: true })[0]?.map(String) ?? [];

  const rows: ParsedImportRow[] = records.map((record, idx) => {
    const values: Record<string, string> = {};
    for (const [key, val] of Object.entries(record)) {
      values[key] = sanitizeCsvCell(String(val ?? ""));
    }
    return { rowNumber: idx + 2, values };
  });

  return { headers: headers.map((h) => h.trim()), rows };
}

export function buildImportTemplateCsv(): string {
  return [
    "First Name,Last Name,Email,Phone,Job Title,Company,Country,State,City,LinkedIn URL,Source Detail",
    "",
  ].join("\n");
}

export function buildRejectedRowsCsv(input: {
  headers: string[];
  rows: Array<{ rowNumber: number; values: Record<string, string>; code: string; message: string }>;
}): string {
  const outHeaders = ["Row", "Error Code", "Error Message", ...input.headers];
  const lines = [outHeaders.map(escapeCrmCsvCell).join(",")];
  for (const row of input.rows) {
    const cells = [
      String(row.rowNumber),
      row.code,
      row.message,
      ...input.headers.map((h) => row.values[h] ?? ""),
    ];
    lines.push(cells.map(escapeCrmCsvCell).join(","));
  }
  return lines.join("\n");
}
