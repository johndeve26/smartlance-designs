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

export default async function AdminContactEnquiryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireAdminUser("view_enquiries");
  const { id } = await params;
  const enquiry = await getEnquiryById(id);
  if (!enquiry || enquiry.type !== "CONTACT") notFound();

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
      <div>
        <Link
          href="/admin/enquiries/contact"
          className="text-sm text-neutral-500 hover:underline"
        >
          ← Contact enquiries
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold">{enquiry.reference}</h1>
          <EnquiryStatusBadge status={enquiry.status} />
          <DeliveryBadge status={enquiry.notificationStatus} />
        </div>
        <p className="mt-1 text-sm text-neutral-600">
          Submitted{" "}
          {enquiry.submittedAt.toISOString().slice(0, 16).replace("T", " ")} UTC
          {enquiry.isAnonymized ? " · Anonymized" : ""}
        </p>
      </div>

      <section className="space-y-3 rounded-lg border bg-white p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
          Submission
        </h2>
        <dl className="grid gap-3 sm:grid-cols-2 text-sm">
          <Item label="Name" value={enquiry.name} />
          <Item label="Email" value={enquiry.email} />
          <Item label="Company" value={enquiry.company} />
          <Item label="Website" value={enquiry.websiteUrl} />
          <Item label="Service" value={enquiry.service} />
          <Item label="Budget" value={enquiry.budget} />
          <Item label="Timeline" value={enquiry.timeline} />
          <Item label="Referral" value={enquiry.referralSource} />
          <Item label="Source path" value={enquiry.sourcePath} />
        </dl>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Project details
          </p>
          <pre className="mt-2 whitespace-pre-wrap break-words rounded bg-neutral-50 p-3 text-sm leading-relaxed text-neutral-900 font-sans">
            {enquiry.projectDetails || "—"}
          </pre>
        </div>
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
      </section>

      <section className="space-y-3 rounded-lg border bg-white p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
          Delivery
        </h2>
        <p className="text-sm">
          Status: <DeliveryBadge status={enquiry.notificationStatus} />
        </p>
        {enquiry.lastNotificationError ? (
          <p className="text-sm text-red-700">{enquiry.lastNotificationError}</p>
        ) : null}
        {enquiry.notificationAttemptedAt ? (
          <p className="text-xs text-neutral-500">
            Last attempt{" "}
            {enquiry.notificationAttemptedAt
              .toISOString()
              .slice(0, 16)
              .replace("T", " ")}{" "}
            UTC
          </p>
        ) : null}
      </section>

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

      <section className="rounded-lg border bg-white p-4">
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
      </section>
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
