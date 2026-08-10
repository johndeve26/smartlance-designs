import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminUser } from "@/lib/admin/session";
import { getContactImportDetailAction } from "@/lib/admin/crm-import-actions";
import { formatDateTime } from "@/lib/crm/display";
import { ImportRejectedDownloadButton } from "@/components/admin/crm/ImportRejectedDownloadButton";
import { AdminDetailHeader } from "@/components/admin/patterns/AdminDetailHeader";
import { AdminPanel, AdminSection } from "@/components/admin/patterns/AdminPanel";

export const dynamic = "force-dynamic";

export default async function CrmImportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdminUser("view_crm");
  const { id } = await params;
  const job = await getContactImportDetailAction(id);
  if (!job) notFound();

  return (
    <div className="space-y-6">
      <Link href="/admin/crm/imports" className="text-sm text-accent-text hover:underline">
        ← Import history
      </Link>

      <AdminDetailHeader
        title={job.fileName}
        subtitle={`${job.status} · ${formatDateTime(job.createdAt)} · ${job.createdBy.name}`}
      />

      <AdminPanel>
        <dl className="grid gap-2 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-muted">Total rows</dt>
            <dd className="font-medium">{job.totalRows}</dd>
          </div>
          <div>
            <dt className="text-muted">Created</dt>
            <dd className="font-medium">{job.createdContacts}</dd>
          </div>
          <div>
            <dt className="text-muted">Updated</dt>
            <dd className="font-medium">{job.updatedContacts}</dd>
          </div>
          <div>
            <dt className="text-muted">Skipped</dt>
            <dd className="font-medium">{job.skippedContacts}</dd>
          </div>
          <div>
            <dt className="text-muted">Invalid</dt>
            <dd className="font-medium">{job.invalidRows}</dd>
          </div>
          <div>
            <dt className="text-muted">Leads</dt>
            <dd className="font-medium">{job.createdLeads}</dd>
          </div>
        </dl>
      </AdminPanel>

      {job.invalidRows > 0 ? <ImportRejectedDownloadButton importId={job.id} /> : null}

      {job.issues.length ? (
        <AdminSection title="Issues">
          <AdminPanel flush>
            <ul className="divide-y divide-border text-sm">
              {job.issues.map((issue) => (
                <li key={issue.id} className="px-4 py-2">
                  Row {issue.rowNumber} · {issue.code} — {issue.message}
                </li>
              ))}
            </ul>
          </AdminPanel>
        </AdminSection>
      ) : null}
    </div>
  );
}
