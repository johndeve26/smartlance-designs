import type { PortalFileItem } from "@/lib/portal/files";
import { formatFileSize, formatFileUploadedLabel } from "@/lib/portal/file-display";

export function PortalFileListCompact({ files }: { files: PortalFileItem[] }) {
  if (!files.length) {
    return <p className="text-sm text-neutral-600">No files for this project yet.</p>;
  }

  return (
    <ul className="divide-y divide-neutral-100">
      {files.map((file) => (
        <li key={file.id} className="flex items-center justify-between gap-3 py-3 text-sm">
          <div className="min-w-0">
            <p className="font-medium text-[#535353]">{file.name}</p>
            <p className="text-neutral-500">
              {file.isDeliveredByAgency ? "Smartlance" : "You"} ·{" "}
              {formatFileUploadedLabel(file.uploadedAt)}
            </p>
          </div>
          <a href={file.downloadHref} className="shrink-0 text-[#F47A48] hover:underline">
            Download
          </a>
        </li>
      ))}
    </ul>
  );
}
