import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminUser } from "@/lib/admin/session";
import { can } from "@/lib/admin/rbac";
import {
  getSegmentById,
  previewSegmentContacts,
  parseSegmentFilter,
  countSegmentMatches,
} from "@/lib/crm/segments/service";
import { contactDisplayName } from "@/lib/crm/normalize";
import { SegmentForm } from "@/components/admin/crm/SegmentForm";
import { SegmentEnrollPanel } from "@/components/admin/crm/SegmentEnrollPanel";
import { SegmentExportButton } from "@/components/admin/crm/SegmentExportButton";
import { AdminDetailHeader } from "@/components/admin/patterns/AdminDetailHeader";
import { AdminPanel, AdminSection } from "@/components/admin/patterns/AdminPanel";

export const dynamic = "force-dynamic";

export default async function SegmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireAdminUser("view_crm");
  const { id } = await params;
  const segment = await getSegmentById(id);
  if (!segment) notFound();

  const filter = parseSegmentFilter(segment.filterJson);
  const [count, preview] = await Promise.all([
    countSegmentMatches(filter),
    previewSegmentContacts(filter, 1, 15),
  ]);

  return (
    <div className="space-y-6">
      <Link href="/admin/crm/segments" className="text-sm text-accent-text hover:underline">
        ← Segments
      </Link>

      <AdminDetailHeader
        title={segment.name}
        subtitle={
          segment.description
            ? `${segment.description} · ${count} matching contacts`
            : `${count} matching contacts`
        }
        secondaryActions={
          can(user.role, "export_crm") ? (
            <SegmentExportButton segmentId={segment.id} segmentName={segment.name} />
          ) : undefined
        }
      />

      {can(user.role, "manage_crm") ? (
        <AdminSection title="Edit segment">
          <AdminPanel>
            <SegmentForm
              initial={{
                id: segment.id,
                name: segment.name,
                description: segment.description ?? "",
                filter: segment.filterJson,
              }}
            />
          </AdminPanel>
        </AdminSection>
      ) : null}

      <AdminSection title="Preview">
        <AdminPanel flush>
          <ul className="divide-y divide-border text-sm">
            {preview.items.map((c) => (
              <li key={c.id} className="px-4 py-2">
                <Link
                  href={`/admin/crm/contacts/${c.id}`}
                  className="text-accent-text hover:underline"
                >
                  {contactDisplayName(c)}
                </Link>
                {c.email ? ` · ${c.email}` : ""}
              </li>
            ))}
            {!preview.items.length ? (
              <li className="px-4 py-6 text-muted">No matching contacts.</li>
            ) : null}
          </ul>
        </AdminPanel>
      </AdminSection>

      {can(user.role, "send_crm_email") ? (
        <SegmentEnrollPanel contactIds={preview.items.map((c) => c.id)} />
      ) : null}
    </div>
  );
}
