import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminUser } from "@/lib/admin/session";
import { getCompanyById } from "@/lib/crm/companies";
import { contactDisplayName } from "@/lib/crm/normalize";
import { listProjectsForCompany } from "@/lib/agency/projects";
import {
  AGENCY_PROJECT_HEALTH_LABELS,
  AGENCY_PROJECT_STATUS_LABELS,
} from "@/lib/agency/constants";
import { formatDate } from "@/lib/ui/format";
import { can } from "@/lib/admin/rbac";
import {
  CRM_DEAL_STAGE_LABELS,
  CRM_LEAD_STATUS_LABELS,
  formatCurrency,
} from "@/lib/crm/display";
import { AdminDetailHeader } from "@/components/admin/patterns/AdminDetailHeader";
import { AdminPanel, AdminSection } from "@/components/admin/patterns/AdminPanel";

export const dynamic = "force-dynamic";

export default async function CrmCompanyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireAdminUser("view_crm");
  const { id } = await params;
  const company = await getCompanyById(id);
  if (!company) notFound();
  const projects = can(user.role, "view_projects")
    ? await listProjectsForCompany(id)
    : [];

  return (
    <div className="space-y-6">
      <Link href="/admin/crm/companies" className="text-sm text-accent-text hover:underline">
        ← Companies
      </Link>

      <AdminDetailHeader
        title={company.name}
        subtitle={company.website ?? company.domain ?? undefined}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <AdminSection title="Company details">
          <AdminPanel>
            <dl className="space-y-2 text-sm">
              <Row label="Industry" value={company.industry} />
              <Row label="Location" value={company.location} />
              <Row label="Phone" value={company.phone} />
            </dl>
            {company.description ? (
              <p className="mt-3 whitespace-pre-wrap text-sm text-muted">{company.description}</p>
            ) : null}
          </AdminPanel>
        </AdminSection>

        <AdminSection title="Contacts">
          <AdminPanel flush>
            <ul className="divide-y divide-border text-sm">
              {company.contacts.map((c) => (
                <li key={c.id} className="px-4 py-2">
                  <Link
                    href={`/admin/crm/contacts/${c.id}`}
                    className="text-accent-text hover:underline"
                  >
                    {contactDisplayName(c)}
                  </Link>
                </li>
              ))}
              {!company.contacts.length ? (
                <li className="px-4 py-6 text-muted">No contacts.</li>
              ) : null}
            </ul>
          </AdminPanel>
        </AdminSection>

        <AdminSection title="Active leads">
          <AdminPanel flush>
            <ul className="divide-y divide-border text-sm">
              {company.leads.map((l) => (
                <li key={l.id} className="flex justify-between px-4 py-2">
                  <Link
                    href={`/admin/crm/leads/${l.id}`}
                    className="text-accent-text hover:underline"
                  >
                    {contactDisplayName(l.contact)}
                  </Link>
                  <span className="text-muted">{CRM_LEAD_STATUS_LABELS[l.status]}</span>
                </li>
              ))}
              {!company.leads.length ? (
                <li className="px-4 py-6 text-muted">No active leads.</li>
              ) : null}
            </ul>
          </AdminPanel>
        </AdminSection>

        <AdminSection title={`Linked projects (${projects.length})`}>
          <AdminPanel flush>
            <ul className="divide-y divide-border text-sm">
              {projects.map((p) => (
                <li key={p.id} className="flex justify-between gap-2 px-4 py-2">
                  <Link
                    href={`/admin/agency/projects/${p.id}`}
                    className="text-accent-text hover:underline"
                  >
                    {p.projectNumber} · {p.name}
                  </Link>
                  <span className="text-muted">
                    {AGENCY_PROJECT_STATUS_LABELS[p.status]} ·{" "}
                    {AGENCY_PROJECT_HEALTH_LABELS[p.health]}
                    {p.targetDueDate ? ` · due ${formatDate(p.targetDueDate)}` : ""}
                  </span>
                </li>
              ))}
              {!projects.length ? (
                <li className="px-4 py-6 text-muted">No linked projects.</li>
              ) : null}
            </ul>
          </AdminPanel>
        </AdminSection>

        <AdminSection title="Deals" className="lg:col-span-2">
          <AdminPanel flush>
            <ul className="divide-y divide-border text-sm">
              {company.deals.map((d) => (
                <li key={d.id} className="flex justify-between px-4 py-2">
                  <Link
                    href={`/admin/crm/deals/${d.id}`}
                    className="text-accent-text hover:underline"
                  >
                    {d.title}
                  </Link>
                  <span className="text-muted">
                    {CRM_DEAL_STAGE_LABELS[d.stage]} ·{" "}
                    {formatCurrency(Number(d.amount), d.currency ?? "USD")}
                  </span>
                </li>
              ))}
              {!company.deals.length ? (
                <li className="px-4 py-6 text-muted">No deals.</li>
              ) : null}
            </ul>
          </AdminPanel>
        </AdminSection>
      </div>
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
