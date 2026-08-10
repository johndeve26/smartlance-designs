import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminUser } from "@/lib/admin/session";
import { can } from "@/lib/admin/rbac";
import { getMediaAsset } from "@/lib/repositories/mediaRepository";
import { findMediaUsages } from "@/lib/media/usage";
import { MediaDetailActions } from "@/components/admin/media/MediaDetailActions";
import { AdminPanel } from "@/components/admin/patterns/AdminPanel";
import { PageHeader } from "@/components/ui/page-header";

export const dynamic = "force-dynamic";

export default async function AdminMediaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireAdminUser("manage_media");
  const { id } = await params;
  const asset = await getMediaAsset(id);
  if (!asset) notFound();
  const usages = await findMediaUsages(asset.publicUrl);
  const publishedUsages = usages.filter((u) => u.published);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        title={asset.title || asset.filename}
        breadcrumbs={
          <Link href="/admin/media" className="text-accent-text hover:underline">
            ← Media library
          </Link>
        }
        description={
          <span className="break-all font-mono text-xs">{asset.publicUrl}</span>
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <AdminPanel flush className="overflow-hidden p-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={asset.publicUrl}
            alt={asset.altText || ""}
            className="w-full object-contain"
          />
        </AdminPanel>

        <div className="space-y-4">
          <AdminPanel>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-muted">Type</dt>
                <dd>{asset.mimeType}</dd>
              </div>
              <div>
                <dt className="text-muted">Size</dt>
                <dd>{Math.round(asset.byteSize / 1024)} KB</dd>
              </div>
              <div>
                <dt className="text-muted">Dimensions</dt>
                <dd>
                  {asset.width && asset.height
                    ? `${asset.width}×${asset.height}`
                    : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-muted">Source</dt>
                <dd>{asset.sourceType}</dd>
              </div>
              <div>
                <dt className="text-muted">Status</dt>
                <dd>{asset.status}</dd>
              </div>
              <div>
                <dt className="text-muted">Created</dt>
                <dd>{asset.createdAt.toISOString().slice(0, 10)}</dd>
              </div>
            </dl>
          </AdminPanel>

          <MediaDetailActions
            asset={{
              id: asset.id,
              altText: asset.altText,
              title: asset.title,
              caption: asset.caption,
              status: asset.status,
              sourceType: asset.sourceType,
            }}
            canDelete={can(user.role, "media_permanent_delete")}
            publishedUsageCount={publishedUsages.length}
          />

          <AdminPanel>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
              Usage ({usages.length})
            </h2>
            {usages.length === 0 ? (
              <p className="mt-2 text-sm text-muted">Not referenced.</p>
            ) : (
              <ul className="mt-2 space-y-1 text-sm">
                {usages.map((u) => (
                  <li key={`${u.entityType}-${u.entityId}-${u.field}`}>
                    {u.href ? (
                      <Link href={u.href} className="text-accent-text hover:underline">
                        {u.label}
                      </Link>
                    ) : (
                      u.label
                    )}{" "}
                    <span className="text-muted">
                      ({u.field}
                      {u.published ? ", published" : ""})
                    </span>
                  </li>
                ))}
              </ul>
            )}
            {publishedUsages.length > 0 ? (
              <p className="mt-2 text-sm text-warning-text">
                This asset is currently used by {publishedUsages.length} published
                record(s). Permanent deletion is blocked unless forced by Super
                Admin.
              </p>
            ) : null}
          </AdminPanel>
        </div>
      </div>
    </div>
  );
}
