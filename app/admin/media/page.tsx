import Link from "next/link";
import { requireAdminUser } from "@/lib/admin/session";
import { listMediaAssets, countMediaByStatus } from "@/lib/repositories/mediaRepository";
import { isMediaStorageConfigured, getConfiguredStorageProviderName } from "@/lib/media/storage";
import { MediaUploadForm } from "@/components/admin/media/MediaUploadForm";
import { StaticMediaSyncPanel } from "@/components/admin/media/StaticMediaSyncPanel";
import { getLatestStaticMediaSyncRun } from "@/lib/media/sync-static";
import {
  getAdminSiteSettingsExtras,
  getSiteSettingsAdmin,
} from "@/lib/repositories/siteSettingsRepository";

export const dynamic = "force-dynamic";

export default async function AdminMediaPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; source?: string; status?: string; page?: string }>;
}) {
  await requireAdminUser("manage_media");
  const sp = await searchParams;
  const page = Number(sp.page || "1") || 1;
  const sourceType =
    sp.source === "STATIC_EXISTING" || sp.source === "UPLOADED"
      ? sp.source
      : undefined;
  const status =
    sp.status === "ARCHIVED" || sp.status === "ACTIVE" ? sp.status : "ACTIVE";

  const [{ items, total, pageSize }, counts, settingsRow, latestSync] =
    await Promise.all([
    listMediaAssets({
      q: sp.q,
      sourceType,
      status,
      page,
      pageSize: 24,
    }),
    countMediaByStatus(),
    getSiteSettingsAdmin(),
    getLatestStaticMediaSyncRun(),
  ]);

  const storageOk = isMediaStorageConfigured();
  const maxMb = getAdminSiteSettingsExtras(settingsRow).mediaMaxUploadMb;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Media</h1>
          <p className="mt-1 text-sm text-neutral-600">
            {counts.total} assets · {counts.ACTIVE} active · {counts.ARCHIVED} archived
          </p>
        </div>
        <p className="text-xs text-neutral-500">
          Storage:{" "}
          {storageOk
            ? `Configured (${getConfiguredStorageProviderName()})`
            : "Not configured — uploads disabled"}
        </p>
      </div>

      {storageOk ? (
        <MediaUploadForm maxMb={maxMb} />
      ) : (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Configure persistent object storage before uploading. Local disk is
          development-only and rejected in production.
        </div>
      )}

      <StaticMediaSyncPanel
        lastRunAt={latestSync?.createdAt?.toISOString() ?? null}
      />

      <form className="flex flex-wrap gap-2" method="get">
        <input
          name="q"
          defaultValue={sp.q || ""}
          placeholder="Search filename, title, alt…"
          className="min-w-[16rem] flex-1 rounded border border-neutral-300 px-3 py-2 text-sm"
        />
        <select
          name="source"
          defaultValue={sp.source || ""}
          className="rounded border border-neutral-300 px-3 py-2 text-sm"
        >
          <option value="">All sources</option>
          <option value="STATIC_EXISTING">Static existing</option>
          <option value="UPLOADED">Uploaded</option>
        </select>
        <select
          name="status"
          defaultValue={status}
          className="rounded border border-neutral-300 px-3 py-2 text-sm"
        >
          <option value="ACTIVE">Active</option>
          <option value="ARCHIVED">Archived</option>
        </select>
        <button
          type="submit"
          className="rounded bg-neutral-900 px-4 py-2 text-sm font-medium text-white"
        >
          Filter
        </button>
      </form>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {items.map((item) => (
          <Link
            key={item.id}
            href={`/admin/media/${item.id}`}
            className="group overflow-hidden rounded-lg border border-neutral-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#F47A48]"
            aria-label={`${item.title || item.filename}, ${item.width || "?"}×${item.height || "?"} ${item.mimeType}`}
          >
            <div className="aspect-[4/3] bg-neutral-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.publicUrl}
                alt={item.altText || ""}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="space-y-1 p-3">
              <div className="truncate text-sm font-medium text-neutral-900">
                {item.title || item.filename}
              </div>
              <div className="text-xs text-neutral-500">
                {item.sourceType.replace("_", " ")} ·{" "}
                {item.width && item.height
                  ? `${item.width}×${item.height}`
                  : item.mimeType}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {total > pageSize ? (
        <div className="flex gap-2 text-sm">
          {page > 1 ? (
            <Link
              href={`/admin/media?page=${page - 1}&q=${encodeURIComponent(sp.q || "")}&source=${sp.source || ""}&status=${status}`}
              className="rounded border px-3 py-1"
            >
              Previous
            </Link>
          ) : null}
          <span className="px-2 py-1 text-neutral-500">
            Page {page} of {Math.ceil(total / pageSize)}
          </span>
          {page * pageSize < total ? (
            <Link
              href={`/admin/media?page=${page + 1}&q=${encodeURIComponent(sp.q || "")}&source=${sp.source || ""}&status=${status}`}
              className="rounded border px-3 py-1"
            >
              Next
            </Link>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
