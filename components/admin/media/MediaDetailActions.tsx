"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  archiveMediaAction,
  deleteMediaAction,
  updateMediaMetadataAction,
} from "@/lib/admin/phase4-actions";

export function MediaDetailActions({
  asset,
  canDelete,
  publishedUsageCount,
}: {
  asset: {
    id: string;
    altText: string | null;
    title: string | null;
    caption: string | null;
    status: string;
    sourceType: string;
  };
  canDelete: boolean;
  publishedUsageCount: number;
}) {
  const router = useRouter();
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <div className="space-y-4">
      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          start(async () => {
            const res = await updateMediaMetadataAction(fd);
            setMsg(res.ok ? "Metadata saved." : res.error);
          });
        }}
      >
        <input type="hidden" name="id" value={asset.id} />
        <label className="block text-sm">
          Alt text
          <input
            name="altText"
            defaultValue={asset.altText ?? ""}
            className="mt-1 w-full rounded border px-3 py-2"
            placeholder="Leave empty for decorative images"
          />
        </label>
        <label className="block text-sm">
          Title
          <input
            name="title"
            defaultValue={asset.title ?? ""}
            className="mt-1 w-full rounded border px-3 py-2"
          />
        </label>
        <label className="block text-sm">
          Caption (optional)
          <input
            name="caption"
            defaultValue={asset.caption ?? ""}
            className="mt-1 w-full rounded border px-3 py-2"
          />
        </label>
        <button
          type="submit"
          disabled={pending}
          className="rounded bg-neutral-900 px-4 py-2 text-sm font-medium text-white"
        >
          Save metadata
        </button>
      </form>

      {asset.status === "ACTIVE" ? (
        <form
          action={(fd) => {
            start(async () => {
              await archiveMediaAction(fd);
              router.push("/admin/media?status=ARCHIVED");
            });
          }}
        >
          <input type="hidden" name="id" value={asset.id} />
          <button type="submit" className="text-sm text-amber-800 underline">
            Archive (hidden from new pickers)
          </button>
        </form>
      ) : null}

      {canDelete ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (
              !confirm(
                publishedUsageCount > 0
                  ? `Dangerous: asset is used by ${publishedUsageCount} published records. Force delete metadata/storage?`
                  : "Permanently delete this media asset?",
              )
            ) {
              return;
            }
            const fd = new FormData(e.currentTarget);
            start(async () => {
              const res = await deleteMediaAction(fd);
              if (!res.ok) setMsg(res.error);
              else router.push("/admin/media");
            });
          }}
        >
          <input type="hidden" name="id" value={asset.id} />
          <input
            type="hidden"
            name="force"
            value={publishedUsageCount > 0 ? "1" : "0"}
          />
          <button type="submit" className="text-sm text-red-700 underline">
            Permanent delete (Super Admin)
          </button>
        </form>
      ) : null}

      {msg ? (
        <p className="text-sm text-neutral-700" role="status">
          {msg}
        </p>
      ) : null}
    </div>
  );
}
