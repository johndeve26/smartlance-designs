"use client";

import type { PublishStatus } from "@prisma/client";
import { StatusBadge } from "@/components/admin/StatusBadge";

type PublishBarProps = {
  status?: PublishStatus | null;
  canEdit?: boolean;
  canPublish?: boolean;
  canSlug?: boolean;
  previewHref?: string;
  saveAction?: (formData: FormData) => void | Promise<void>;
  publishAction?: (formData: FormData) => void | Promise<void>;
  unpublishAction?: (formData: FormData) => void | Promise<void>;
  slugAction?: (formData: FormData) => void | Promise<void>;
  currentSlug?: string;
  message?: string | null;
  error?: string | null;
};

export function PublishBar({
  status,
  canEdit = true,
  canPublish = false,
  canSlug = false,
  previewHref,
  saveAction,
  publishAction,
  unpublishAction,
  slugAction,
  currentSlug,
  message,
  error,
}: PublishBarProps) {
  return (
    <div className="sticky top-0 z-10 -mx-6 mb-6 border-b border-neutral-200 bg-white/95 px-6 py-3 backdrop-blur">
      <div className="flex flex-wrap items-center gap-3">
        {status ? <StatusBadge status={status} /> : null}
        {canEdit && saveAction ? (
          <button type="submit" formAction={saveAction} className="admin-btn">
            Save Draft
          </button>
        ) : null}
        {canPublish && publishAction ? (
          <button
            type="submit"
            formAction={publishAction}
            className="admin-btn-primary"
          >
            Publish
          </button>
        ) : null}
        {canPublish && unpublishAction ? (
          <button
            type="submit"
            formAction={unpublishAction}
            className="admin-btn-ghost"
          >
            Unpublish
          </button>
        ) : null}
        {previewHref ? (
          <a
            href={previewHref}
            target="_blank"
            rel="noopener noreferrer"
            className="admin-btn-ghost"
          >
            Preview
          </a>
        ) : null}
        {message ? (
          <span className="text-sm text-emerald-700">{message}</span>
        ) : null}
        {error ? <span className="text-sm text-red-700">{error}</span> : null}
      </div>
      {canSlug && slugAction && currentSlug != null ? (
        <div className="mt-3 flex flex-wrap items-end gap-2 border-t border-neutral-100 pt-3">
          <label className="admin-field min-w-[200px] flex-1">
            <span className="admin-label">Change slug</span>
            <input
              name="newSlug"
              className="admin-input"
              defaultValue={currentSlug}
              formNoValidate
            />
          </label>
          <button type="submit" formAction={slugAction} className="admin-btn">
            Update slug
          </button>
        </div>
      ) : null}
    </div>
  );
}
