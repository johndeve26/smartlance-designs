import { formatPortalDate } from "@/lib/portal/status-labels";

export function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatFileUploadedLabel(date: Date) {
  return formatPortalDate(date);
}
