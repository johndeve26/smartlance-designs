import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminUser } from "@/lib/admin/session";
import { can } from "@/lib/admin/rbac";
import { getEnquiryById } from "@/lib/enquiries/service";
import { listAuditLogs } from "@/lib/repositories/auditRepository";
import {
  DeliveryBadge,
  EnquiryStatusBadge,
} from "@/components/admin/enquiries/EnquiryBadges";
import { EnquiryDetailActions } from "@/components/admin/enquiries/EnquiryDetailActions";
import { AdminPanel } from "@/components/admin/patterns/AdminPanel";
import { PageHeader } from "@/components/ui/page-header";

export const dynamic = "force-dynamic";

function safeExternalUrl(url: string | null | undefined) {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    return u.toString();
  } catch {
    return null;
  }
}

export default async function AdminReviewEnquiryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireAdminUser("view_enquiries");
  const { id } = await params;
  const enquiry = await getEnquiryById(id);
  if (!enquiry || enquiry.type !== "WEBSITE_REVIEW") notFound();

  const activity = await listAuditLogs({
    entityType: "Enquiry",
    entityId: enquiry.id,
    limit: 30,
  });
  const events = activity.items;

  const mailto = enquiry.email
    ? `mailto:${encodeURIComponent(enquiry.email)}?subject=${encodeURIComponent(`Re: ${enquiry.reference}`)}`
    : null;
  const website = safeExternalUrl(enquiry.websiteUrl);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        title={enquiry.reference}
        breadcrumbs={
          <Link
            href="/admin/enquiries/reviews"
            className="text-accent-text hover:underline"
          >
            ← Website review requests
          </Link>
        }
        description={`Submitted ${enquiry.submittedAt.toISOString().slice(0, 16).replace("T", " ")} UTC${enquiry.isAnonymized ? " · Anonymized" : ""}`}
        action={
          <>
            <EnquiryStatusBadge status={enquiry.status} />
            <DeliveryBadge status={enquiry.notificationStatus} />
          </>
        }
      />

      <AdminPanel className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
          Submission
        </h2>
        <dl className="grid gap-3 sm:grid-cols-2 text-sm">
          <Item label="Name" value={enquiry.name} />
          <Item label="Email" value={enquiry.email} />
          <Item label="Website" value={enquiry.websiteUrl} />
          <Item label="Main concern" value={enquiry.mainConcern} />
          <Item label="Source path" value={enquiry.sourcePath} />
        </dl>
        <div className="flex flex-wrap gap-3 text-sm">
          {mailto ? (
            <a href={mailto} className="font-medium text-[#F47A48] hover:underline">
              Reply by Email
            </a>
          ) : null}
          {website ? (
            <a
              href={website}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-[#F47A48] hover:underline"
            >
              Open Website
            </a>
          ) : null}
        </div>
      </AdminPanel>

      <AdminPanel className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
          Delivery
        </h2>
        <p className="text-sm">
          Status: <DeliveryBadge status={enquiry.notificationStatus} />
        </p>
        {enquiry.lastNotificationError ? (
          <p className="text-sm text-red-700">{enquiry.lastNotificationError}</p>
        ) : null}
      </AdminPanel>

      <EnquiryDetailActions
        enquiry={{
          id: enquiry.id,
          type: enquiry.type,
          status: enquiry.status,
          notificationStatus: enquiry.notificationStatus,
          isAnonymized: enquiry.isAnonymized,
        }}
        canManage={can(user.role, "manage_enquiries")}
        canDestroy={can(user.role, "enquiry_destructive")}
        notes={enquiry.notes.map((n) => ({
          id: n.id,
          body: n.body,
          createdAt: n.createdAt.toISOString(),
          authorName: n.author?.name || "Admin",
        }))}
      />

      <AdminPanel>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
          Activity
        </h2>
        <ul className="mt-3 space-y-2 text-sm">
          {events.map((e) => (
            <li key={e.id} className="border-b border-neutral-100 pb-2">
              <span className="font-medium">{e.action}</span>
              <span className="text-xs text-neutral-500">
                {" "}
                · {e.createdAt.toISOString().slice(0, 16).replace("T", " ")}
              </span>
            </li>
          ))}
          {!events.length ? (
            <li className="text-neutral-500">No activity events yet.</li>
          ) : null}
        </ul>
      </AdminPanel>
    </div>
  );
}

function Item({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <dt className="text-xs text-neutral-500">{label}</dt>
      <dd className="break-words">{value || "—"}</dd>
    </div>
  );
}
