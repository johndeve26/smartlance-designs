"use client";
import { AdminPanel } from "@/components/admin/patterns/AdminPanel";

import { useState } from "react";
import Link from "next/link";
import {
  parseContactImportUploadAction,
  previewContactImportAction,
  executeContactImportAction,
  getContactImportTemplateAction,
} from "@/lib/admin/crm-import-actions";
import {
  DEFAULT_IMPORT_OPTIONS,
  type ColumnMapping,
  type ContactImportOptions,
} from "@/lib/crm/import/constants";

type Step = "upload" | "map" | "preview" | "results";

type MappingOption = { value: string; label: string };

export function ContactCsvImportWizard() {
  const [step, setStep] = useState<Step>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [fileHash, setFileHash] = useState("");
  const [fileName, setFileName] = useState("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [columnSamples, setColumnSamples] = useState<
    Array<{ header: string; samples: string[]; suggested: string; label?: string }>
  >([]);
  const [mappingOptions, setMappingOptions] = useState<MappingOption[]>([
    { value: "skip", label: "Do not import" },
  ]);
  const [mapping, setMapping] = useState<ColumnMapping>({});
  const [options, setOptions] = useState<ContactImportOptions>(DEFAULT_IMPORT_OPTIONS);
  const [summary, setSummary] = useState<Record<string, unknown> | null>(null);
  const [previewRows, setPreviewRows] = useState<
    Array<{
      rowNumber: number;
      name: string;
      email: string;
      phone: string;
      company: string;
      action: string;
      issues: string[];
    }>
  >([]);
  const [importId, setImportId] = useState("");
  const [result, setResult] = useState<Record<string, number> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function downloadTemplate() {
    const res = await getContactImportTemplateAction();
    if (!res.ok) return;
    const blob = new Blob([res.csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "crm-contacts-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleUpload() {
    if (!file) return;
    setPending(true);
    setError(null);
    const fd = new FormData();
    fd.set("file", file);
    const res = await parseContactImportUploadAction(fd);
    setPending(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setFileHash(res.fileHash);
    setFileName(res.fileName);
    setHeaders(res.headers);
    setColumnSamples(res.columnSamples);
    setMapping(res.suggestedMapping);
    setMappingOptions(res.mappingOptions);
    setStep("map");
  }

  async function handlePreview() {
    if (!file) return;
    setPending(true);
    setError(null);
    const fd = new FormData();
    fd.set("file", file);
    const res = await previewContactImportAction({
      formData: fd,
      mapping,
      options,
      previewFileHash: fileHash,
    });
    setPending(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setImportId(res.importId);
    setSummary(res.summary as Record<string, unknown>);
    setPreviewRows(res.previewRows);
    setStep("preview");
  }

  async function handleImport() {
    if (!file) return;
    setPending(true);
    setError(null);
    const fd = new FormData();
    fd.set("file", file);
    const res = await executeContactImportAction({
      formData: fd,
      importId,
      expectedFileHash: fileHash,
      mapping,
      options,
    });
    setPending(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setResult(res.result as Record<string, number>);
    setStep("results");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2 text-sm">
        {(["upload", "map", "preview", "results"] as Step[]).map((s, i) => (
          <span
            key={s}
            className={
              step === s
                ? "rounded bg-neutral-900 px-2 py-1 text-white"
                : "rounded bg-neutral-100 px-2 py-1 text-neutral-600"
            }
          >
            {i + 1}. {s}
          </span>
        ))}
      </div>

      {error ? (
        <p className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>
      ) : null}

      {step === "upload" ? (
        <AdminPanel className="space-y-4">
          <p className="text-sm text-neutral-600">
            Import CRM contacts from a CSV file. Preview and validate every row before anything is
            added. Importing a CRM contact does not subscribe them to marketing emails.
          </p>
          <button type="button" className="admin-btn admin-btn-secondary" onClick={downloadTemplate}>
            Download CSV template
          </button>
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
          {file ? (
            <p className="text-sm text-neutral-600">
              {file.name} · {(file.size / 1024).toFixed(1)} KB
            </p>
          ) : null}
          <button
            type="button"
            className="admin-btn admin-btn-primary"
            disabled={!file || pending}
            onClick={handleUpload}
          >
            {pending ? "Parsing…" : "Continue"}
          </button>
        </AdminPanel>
      ) : null}

      {step === "map" ? (
        <AdminPanel className="space-y-4">
          <h2 className="font-semibold">Map columns</h2>
          <div className="overflow-x-auto">
            <table className="admin-table min-w-full text-sm">
              <thead>
                <tr>
                  <th>CSV column</th>
                  <th>Samples</th>
                  <th>Map to</th>
                </tr>
              </thead>
              <tbody>
                {columnSamples.map((col) => (
                  <tr key={col.header}>
                    <td>{col.header}</td>
                    <td className="text-neutral-600">{col.samples.join(" · ") || "—"}</td>
                    <td>
                      <select
                        className="admin-input"
                        value={mapping[col.header] ?? "skip"}
                        onChange={(e) =>
                          setMapping((m) => ({
                            ...m,
                            [col.header]: e.target.value as ColumnMapping[string],
                          }))
                        }
                      >
                        {mappingOptions.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm">
              Existing contacts
              <select
                className="admin-input mt-1"
                value={options.existingStrategy}
                onChange={(e) =>
                  setOptions((o) => ({
                    ...o,
                    existingStrategy: e.target.value as ContactImportOptions["existingStrategy"],
                  }))
                }
              >
                <option value="SKIP">Skip existing</option>
                <option value="UPDATE_EMPTY">Update empty fields only</option>
              </select>
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={options.createMissingCompanies}
                onChange={(e) =>
                  setOptions((o) => ({ ...o, createMissingCompanies: e.target.checked }))
                }
              />
              Create missing companies
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={options.createLeads}
                onChange={(e) => setOptions((o) => ({ ...o, createLeads: e.target.checked }))}
              />
              Create leads for new contacts
            </label>
            <label className="text-sm">
              Source detail
              <input
                className="admin-input mt-1"
                value={options.sourceDetail}
                onChange={(e) => setOptions((o) => ({ ...o, sourceDetail: e.target.value }))}
                placeholder="e.g. August prospect list"
              />
            </label>
          </div>

          {options.createLeads ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm">
                Lead status
                <select
                  className="admin-input mt-1"
                  value={options.leadStatus}
                  onChange={(e) =>
                    setOptions((o) => ({
                      ...o,
                      leadStatus: e.target.value as ContactImportOptions["leadStatus"],
                    }))
                  }
                >
                  <option value="NEW">NEW</option>
                  <option value="ATTEMPTING">ATTEMPTING</option>
                </select>
              </label>
              <label className="text-sm">
                Temperature
                <select
                  className="admin-input mt-1"
                  value={options.leadTemperature}
                  onChange={(e) =>
                    setOptions((o) => ({
                      ...o,
                      leadTemperature: e.target.value as ContactImportOptions["leadTemperature"],
                    }))
                  }
                >
                  <option value="COLD">COLD</option>
                  <option value="WARM">WARM</option>
                  <option value="HOT">HOT</option>
                </select>
              </label>
            </div>
          ) : null}

          <div className="flex gap-2">
            <button type="button" className="admin-btn admin-btn-secondary" onClick={() => setStep("upload")}>
              Back
            </button>
            <button
              type="button"
              className="admin-btn admin-btn-primary"
              disabled={pending}
              onClick={handlePreview}
            >
              {pending ? "Validating…" : "Preview import"}
            </button>
          </div>
        </AdminPanel>
      ) : null}

      {step === "preview" && summary ? (
        <AdminPanel className="space-y-4">
          <h2 className="font-semibold">Validation summary</h2>
          {summary.duplicateFileWarning ? (
            <p className="text-sm text-amber-800">{String(summary.duplicateFileWarning)}</p>
          ) : null}
          <div className="grid gap-2 sm:grid-cols-3 text-sm">
            <p>Total rows: {String(summary.totalRows)}</p>
            <p>Valid: {String(summary.validRows)}</p>
            <p>Invalid: {String(summary.invalidRows)}</p>
            <p>New contacts: {String(summary.newContacts)}</p>
            <p>Existing: {String(summary.existingContacts)}</p>
            <p>Duplicates in file: {String(summary.duplicateInFile)}</p>
            <p>Will update: {String(summary.willUpdate)}</p>
            <p>Will skip: {String(summary.willSkip)}</p>
            <p>Leads (est.): {String(summary.createdLeadsEstimate)}</p>
          </div>

          <div className="overflow-x-auto">
            <table className="admin-table min-w-full text-sm">
              <thead>
                <tr>
                  <th>Row</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Company</th>
                  <th>Action</th>
                  <th>Issues</th>
                </tr>
              </thead>
              <tbody>
                {previewRows.map((r) => (
                  <tr key={r.rowNumber}>
                    <td>{r.rowNumber}</td>
                    <td>{r.name}</td>
                    <td>{r.email}</td>
                    <td>{r.company}</td>
                    <td>{r.action}</td>
                    <td className="text-neutral-600">{r.issues.join("; ") || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex gap-2">
            <button type="button" className="admin-btn admin-btn-secondary" onClick={() => setStep("map")}>
              Back
            </button>
            <button
              type="button"
              className="admin-btn admin-btn-primary"
              disabled={pending}
              onClick={handleImport}
            >
              {pending ? "Importing…" : "Import contacts"}
            </button>
          </div>
        </AdminPanel>
      ) : null}

      {step === "results" && result ? (
        <AdminPanel className="space-y-4">
          <h2 className="text-lg font-semibold">Import complete</h2>
          <ul className="text-sm space-y-1">
            <li>{result.createdContacts} contacts created</li>
            <li>{result.updatedContacts} contacts updated</li>
            <li>{result.skippedContacts} skipped</li>
            <li>{result.createdLeads} leads created</li>
          </ul>
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/crm/contacts" className="admin-btn admin-btn-primary">
              View contacts
            </Link>
            <Link href={`/admin/crm/imports/${importId}`} className="admin-btn admin-btn-secondary">
              Import details
            </Link>
            <Link href="/admin/crm/contacts/import" className="admin-btn admin-btn-secondary">
              Import another CSV
            </Link>
          </div>
        </AdminPanel>
      ) : null}
    </div>
  );
}
