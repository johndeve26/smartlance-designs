import Link from "next/link";
import type { PortalFileCategory, PortalFileItem } from "@/lib/portal/files";
import { formatFileSize, formatFileUploadedLabel } from "@/lib/portal/file-display";
import { PortalCard } from "@/components/portal/PortalShell";

const CATEGORIES: PortalFileCategory[] = [
  "Brand Assets",
  "Content",
  "Images",
  "Documents",
  "Deliverables",
  "Other",
];

export function PortalFileLibrary({
  files,
  projects,
  currentProjectId,
  currentCategory,
  currentQuery,
}: {
  files: PortalFileItem[];
  projects: Array<{ id: string; name: string }>;
  currentProjectId?: string;
  currentCategory?: string;
  currentQuery?: string;
}) {
  return (
    <div className="space-y-4">
      <form method="get" className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <label className="flex flex-1 flex-col gap-1 text-sm">
          <span className="text-neutral-600">Search</span>
          <input
            type="search"
            name="q"
            defaultValue={currentQuery}
            placeholder="Search files…"
            className="rounded-md border border-neutral-300 px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm sm:w-44">
          <span className="text-neutral-600">Project</span>
          <select
            name="projectId"
            defaultValue={currentProjectId ?? ""}
            className="rounded-md border border-neutral-300 px-3 py-2"
          >
            <option value="">All projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm sm:w-40">
          <span className="text-neutral-600">Category</span>
          <select
            name="category"
            defaultValue={currentCategory ?? ""}
            className="rounded-md border border-neutral-300 px-3 py-2"
          >
            <option value="">All categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          className="rounded-md bg-[#535353] px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700"
        >
          Filter
        </button>
      </form>

      {files.length ? (
        <PortalCard className="p-0">
          <ul className="divide-y divide-neutral-100">
            {files.map((file) => (
              <li key={file.id} className="flex flex-col gap-2 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                <div className="min-w-0">
                  <p className="font-medium text-[#535353]">{file.name}</p>
                  <p className="text-sm text-neutral-600">
                    {file.projectName} · {file.category}
                  </p>
                  <p className="text-xs text-neutral-500">
                    {file.isDeliveredByAgency ? "Delivered by Smartlance" : "Uploaded by you"} ·{" "}
                    {formatFileUploadedLabel(file.uploadedAt)} · {formatFileSize(file.byteSize)}
                  </p>
                </div>
                <a
                  href={file.downloadHref}
                  className="shrink-0 text-sm font-medium text-[#F47A48] hover:underline"
                >
                  Download
                </a>
              </li>
            ))}
          </ul>
        </PortalCard>
      ) : (
        <PortalCard>
          <p className="text-sm text-neutral-600">No files found.</p>
          <p className="mt-1 text-sm text-neutral-500">
            Files you upload and deliverables shared by Smartlance will appear here.
          </p>
        </PortalCard>
      )}
    </div>
  );
}
