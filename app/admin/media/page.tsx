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
import { AdminListPage } from "@/components/admin/patterns/AdminListPage";
import { AdminPanel } from "@/components/admin/patterns/AdminPanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Pagination } from "@/components/ui/pagination";

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
    <AdminListPage
      title="Media"
      description={
        <>
          {counts.total} assets · {counts.ACTIVE} active · {counts.ARCHIVED} archived
          <span className="mt-1 block text-xs text-muted">
            Storage:{" "}
            {storageOk
              ? `Configured (${getConfiguredStorageProviderName()})`
              : "Not configured — uploads disabled"}
          </span>
        </>
      }
      filters={
        <form className="flex flex-wrap items-end gap-3" method="get">
          <Input
            name="q"
            label="Search"
            defaultValue={sp.q || ""}
            placeholder="Filename, title, alt…"
            className="min-w-[16rem] flex-1"
          />
          <Select name="source" label="Source" defaultValue={sp.source || ""}>
            <option value="">All sources</option>
            <option value="STATIC_EXISTING">Static existing</option>
            <option value="UPLOADED">Uploaded</option>
          </Select>
          <Select name="status" label="Status" defaultValue={status}>
            <option value="ACTIVE">Active</option>
            <option value="ARCHIVED">Archived</option>
          </Select>
          <Button type="submit" size="sm">
            Filter
          </Button>
        </form>
      }
      isEmpty={items.length === 0}
      empty={{
        title: "No media assets match these filters",
        description: storageOk
          ? "Upload an asset or adjust your filters."
          : "Configure persistent object storage before uploading.",
      }}
      pagination={
        total > pageSize ? (
          <Pagination
            page={page}
            pageSize={pageSize}
            total={total}
            hrefForPage={(p) => {
              const params = new URLSearchParams();
              if (sp.q) params.set("q", sp.q);
              if (sp.source) params.set("source", sp.source);
              params.set("status", status);
              params.set("page", String(p));
              return `/admin/media?${params.toString()}`;
            }}
          />
        ) : undefined
      }
    >
      {storageOk ? (
        <MediaUploadForm maxMb={maxMb} />
      ) : (
        <AdminPanel className="border-warning bg-warning-soft/40 text-sm text-warning-text">
          Configure persistent object storage before uploading. Local disk is
          development-only and rejected in production.
        </AdminPanel>
      )}

      <StaticMediaSyncPanel
        lastRunAt={latestSync?.createdAt?.toISOString() ?? null}
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {items.map((item) => (
          <Link
            key={item.id}
            href={`/admin/media/${item.id}`}
            className="group overflow-hidden rounded-lg border border-border bg-surface focus:outline-none focus:ring-2 focus:ring-accent"
            aria-label={`${item.title || item.filename}, ${item.width || "?"}×${item.height || "?"} ${item.mimeType}`}
          >
            <div className="aspect-[4/3] bg-surface-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.publicUrl}
                alt={item.altText || ""}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="space-y-1 p-3">
              <div className="truncate text-sm font-medium text-foreground">
                {item.title || item.filename}
              </div>
              <div className="text-xs text-muted">
                {item.sourceType.replace("_", " ")} ·{" "}
                {item.width && item.height
                  ? `${item.width}×${item.height}`
                  : item.mimeType}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </AdminListPage>
  );
}
