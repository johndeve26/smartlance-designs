import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminUser } from "@/lib/admin/session";
import { can } from "@/lib/admin/rbac";
import { getMediaAsset } from "@/lib/repositories/mediaRepository";
import { findMediaUsages } from "@/lib/media/usage";
import { MediaDetailActions } from "@/components/admin/media/MediaDetailActions";

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
      <Link href="/admin/media" className="text-sm text-neutral-600 hover:underline">
        ← Media library
      </Link>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="overflow-hidden rounded-lg border bg-white">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={asset.publicUrl}
            alt={asset.altText || ""}
            className="w-full object-contain"
          />
        </div>
        <div className="space-y-4">
          <div>
            <h1 className="text-xl font-semibold">{asset.title || asset.filename}</h1>
            <p className="mt-1 text-sm text-neutral-500 break-all">{asset.publicUrl}</p>
          </div>
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-neutral-500">Type</dt>
              <dd>{asset.mimeType}</dd>
            </div>
            <div>
              <dt className="text-neutral-500">Size</dt>
              <dd>{Math.round(asset.byteSize / 1024)} KB</dd>
            </div>
            <div>
              <dt className="text-neutral-500">Dimensions</dt>
              <dd>
                {asset.width && asset.height
                  ? `${asset.width}×${asset.height}`
                  : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-neutral-500">Source</dt>
              <dd>{asset.sourceType}</dd>
            </div>
            <div>
              <dt className="text-neutral-500">Status</dt>
              <dd>{asset.status}</dd>
            </div>
            <div>
              <dt className="text-neutral-500">Created</dt>
              <dd>{asset.createdAt.toISOString().slice(0, 10)}</dd>
            </div>
          </dl>

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

          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
              Usage ({usages.length})
            </h2>
            {usages.length === 0 ? (
              <p className="mt-2 text-sm text-neutral-600">Not referenced.</p>
            ) : (
              <ul className="mt-2 space-y-1 text-sm">
                {usages.map((u) => (
                  <li key={`${u.entityType}-${u.entityId}-${u.field}`}>
                    {u.href ? (
                      <Link href={u.href} className="text-[#F47A48] hover:underline">
                        {u.label}
                      </Link>
                    ) : (
                      u.label
                    )}{" "}
                    <span className="text-neutral-500">
                      ({u.field}
                      {u.published ? ", published" : ""})
                    </span>
                  </li>
                ))}
              </ul>
            )}
            {publishedUsages.length > 0 ? (
              <p className="mt-2 text-sm text-amber-800">
                This asset is currently used by {publishedUsages.length} published
                record(s). Permanent deletion is blocked unless forced by Super
                Admin.
              </p>
            ) : null}
          </section>
        </div>
      </div>
    </div>
  );
}
