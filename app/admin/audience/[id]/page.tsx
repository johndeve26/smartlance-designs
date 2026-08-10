import Link from "next/link";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { requireAdminUser } from "@/lib/admin/session";
import { can } from "@/lib/admin/rbac";
import {
  getSubscriberById,
  toAdminSubscriberDto,
} from "@/lib/audience/service";
import { SubscriberStatusBadge } from "@/components/admin/audience/SubscriberTable";
import { SubscriberDetailActions } from "@/components/admin/audience/SubscriberDetailActions";
import { AdminPanel } from "@/components/admin/patterns/AdminPanel";
import { PageHeader } from "@/components/ui/page-header";

export const dynamic = "force-dynamic";

export default async function AdminSubscriberDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireAdminUser("view_audience");
  const { id } = await params;
  const row = await getSubscriberById(id);
  if (!row) notFound();

  const subscriber = toAdminSubscriberDto(row);
  const canManage = can(user.role, "manage_audience");

  return (
    <div className="space-y-6">
      <PageHeader
        title={subscriber.name || subscriber.email}
        breadcrumbs={
          <Link href="/admin/audience" className="text-accent-text hover:underline">
            ← Audience
          </Link>
        }
        description={subscriber.email}
        action={<SubscriberStatusBadge status={subscriber.status} />}
      />

      <AdminPanel className="space-y-3 text-sm">
        <Row label="Status">
          <SubscriberStatusBadge status={subscriber.status} />
        </Row>
        <Row label="Primary source">{subscriber.primarySource}</Row>
        <Row label="Source page">{subscriber.primarySourceUrl || "—"}</Row>
        <Row label="Consent at">
          {subscriber.consentAt
            ? new Date(subscriber.consentAt).toLocaleString()
            : "—"}
        </Row>
        <Row label="Consent version">{subscriber.consentVersion || "—"}</Row>
        <Row label="Consent text">{subscriber.consentText || "—"}</Row>
        <Row label="Subscribed">
          {subscriber.subscribedAt
            ? new Date(subscriber.subscribedAt).toLocaleString()
            : "—"}
        </Row>
        <Row label="Confirmed">
          {subscriber.confirmedAt
            ? new Date(subscriber.confirmedAt).toLocaleString()
            : "—"}
        </Row>
        <Row label="Unsubscribed">
          {subscriber.unsubscribedAt
            ? new Date(subscriber.unsubscribedAt).toLocaleString()
            : "—"}
        </Row>
      </AdminPanel>

      {canManage ? (
        <SubscriberDetailActions id={subscriber.id} status={subscriber.status} />
      ) : null}

      {subscriber.events.length ? (
        <AdminPanel>
          <h2 className="text-section-heading">Event history</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {subscriber.events.map((event) => (
              <li key={event.id} className="border-b border-border pb-2 last:border-0">
                <span className="font-medium">{event.type}</span>
                {event.source ? (
                  <span className="text-muted"> · {event.source}</span>
                ) : null}
                {event.sourceUrl ? (
                  <span className="text-muted"> · {event.sourceUrl}</span>
                ) : null}
                <span className="block text-xs text-muted">
                  {new Date(event.createdAt).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        </AdminPanel>
      ) : null}
    </div>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-1 sm:grid-cols-[10rem_minmax(0,1fr)]">
      <dt className="font-medium text-muted">{label}</dt>
      <dd className="text-foreground">{children}</dd>
    </div>
  );
}
