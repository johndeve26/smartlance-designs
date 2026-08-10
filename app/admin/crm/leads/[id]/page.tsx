import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminUser } from "@/lib/admin/session";
import { can } from "@/lib/admin/rbac";
import { getLeadById } from "@/lib/crm/leads";
import { contactDisplayName } from "@/lib/crm/normalize";
import {
  CRM_LEAD_STATUS_LABELS,
  CRM_LEAD_TEMPERATURE_LABELS,
  CRM_SOURCE_LABELS,
  CRM_DEAL_STAGE_LABELS,
  formatCurrency,
} from "@/lib/crm/display";
import { CrmBadge, temperatureTone } from "@/components/admin/crm/CrmShared";
import { AdminDetailHeader } from "@/components/admin/patterns/AdminDetailHeader";
import { AdminPanel, AdminSection } from "@/components/admin/patterns/AdminPanel";

export const dynamic = "force-dynamic";

export default async function CrmLeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireAdminUser("view_crm");
  const { id } = await params;
  const lead = await getLeadById(id);
  if (!lead) notFound();

  return (
    <div className="space-y-6">
      <Link href="/admin/crm/leads" className="text-sm text-accent-text hover:underline">
        ← Leads
      </Link>

      <AdminDetailHeader
        title={contactDisplayName(lead.contact)}
        secondaryActions={
          <div className="flex gap-2">
            <CrmBadge>{CRM_LEAD_STATUS_LABELS[lead.status]}</CrmBadge>
            <CrmBadge tone={temperatureTone(lead.temperature)}>
              {CRM_LEAD_TEMPERATURE_LABELS[lead.temperature]}
            </CrmBadge>
          </div>
        }
      />

      <AdminPanel>
        <dl className="space-y-2 text-sm">
          <Row label="Source" value={CRM_SOURCE_LABELS[lead.source]} />
          <Row label="Owner" value={lead.owner?.name} />
          <Row label="Interest" value={lead.interestSummary} />
          {lead.servicesInterested.length ? (
            <Row label="Services" value={lead.servicesInterested.join(", ")} />
          ) : null}
          {lead.estimatedValue ? (
            <Row
              label="Estimated value"
              value={formatCurrency(Number(lead.estimatedValue), lead.currency ?? "USD")}
            />
          ) : null}
        </dl>
        <Link
          href={`/admin/crm/contacts/${lead.contactId}`}
          className="mt-3 inline-block text-sm text-accent-text hover:underline"
        >
          View contact →
        </Link>
      </AdminPanel>

      {lead.deals.length ? (
        <AdminSection title="Deals">
          <AdminPanel flush>
            <ul className="divide-y divide-border text-sm">
              {lead.deals.map((d) => (
                <li key={d.id} className="px-4 py-2">
                  <Link
                    href={`/admin/crm/deals/${d.id}`}
                    className="text-accent-text hover:underline"
                  >
                    {d.title}
                  </Link>
                  {" · "}
                  {CRM_DEAL_STAGE_LABELS[d.stage]}
                </li>
              ))}
            </ul>
          </AdminPanel>
        </AdminSection>
      ) : null}

      {can(user.role, "manage_crm") && lead.status === "QUALIFIED" && !lead.deals.length ? (
        <p className="text-sm text-muted">Qualify complete — create a deal from the contact page.</p>
      ) : null}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <dt className="text-muted">{label}</dt>
      <dd>{value?.trim() ? value : "—"}</dd>
    </div>
  );
}
