import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminUser } from "@/lib/admin/session";
import { can } from "@/lib/admin/rbac";
import { getDealById } from "@/lib/crm/deals";
import { getProjectByDealId } from "@/lib/agency/projects";
import { listProposalsByDealId } from "@/lib/proposals/proposals";
import { listTemplates } from "@/lib/agency/templates";
import { contactDisplayName } from "@/lib/crm/normalize";
import {
  CRM_DEAL_STAGE_LABELS,
  formatCurrency,
  formatDateTime,
} from "@/lib/crm/display";
import { DealDetailActions } from "@/components/admin/crm/DealDetailActions";
import { DealConvertButton } from "@/components/admin/agency/DealConvertButton";
import { PROPOSAL_STATUS_LABELS } from "@/lib/proposals/constants";
import { AdminDetailHeader } from "@/components/admin/patterns/AdminDetailHeader";
import { AdminPanel, AdminSection } from "@/components/admin/patterns/AdminPanel";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function CrmDealDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireAdminUser("view_crm");
  const { id } = await params;
  const canManageProposals = can(user.role, "manage_proposals");
  const [deal, existingProject, templates, dealProposals] = await Promise.all([
    getDealById(id),
    getProjectByDealId(id),
    can(user.role, "manage_projects") ? listTemplates() : Promise.resolve([]),
    listProposalsByDealId(id),
  ]);
  if (!deal) notFound();

  return (
    <div className="space-y-6">
      <Link href="/admin/crm/deals" className="text-sm text-accent-text hover:underline">
        ← Deals
      </Link>

      <AdminDetailHeader
        title={deal.title}
        subtitle={`${CRM_DEAL_STAGE_LABELS[deal.stage]} · ${formatCurrency(Number(deal.amount), deal.currency ?? "USD")}`}
        primaryAction={
          <div className="flex flex-wrap gap-2">
            {canManageProposals ? (
              <Button asChild variant="outline" size="sm">
                <Link href={`/admin/agency/proposals/new?dealId=${deal.id}`}>Create proposal</Link>
              </Button>
            ) : null}
            {can(user.role, "manage_projects") ? (
              <DealConvertButton
                dealId={deal.id}
                dealTitle={deal.title}
                dealStage={deal.stage}
                existingProject={existingProject}
                templates={templates.map((t) => ({ id: t.id, name: t.name }))}
              />
            ) : existingProject ? (
              <Button asChild variant="outline" size="sm">
                <Link href={`/admin/agency/projects/${existingProject.id}`}>
                  View project ({existingProject.projectNumber})
                </Link>
              </Button>
            ) : null}
            {can(user.role, "manage_crm") ? <DealDetailActions deal={deal} /> : null}
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <AdminSection title="Deal details">
          <AdminPanel>
            <dl className="space-y-2 text-sm">
              <div>
                <dt className="text-muted">Contact</dt>
                <dd>
                  <Link
                    href={`/admin/crm/contacts/${deal.contactId}`}
                    className="text-accent-text hover:underline"
                  >
                    {contactDisplayName(deal.contact)}
                  </Link>
                </dd>
              </div>
              <Row label="Company" value={deal.company?.name ?? deal.contact.company?.name} />
              <Row
                label="Probability"
                value={deal.probability != null ? `${deal.probability}%` : undefined}
              />
              <Row label="Expected close" value={formatDateTime(deal.expectedCloseAt)} />
              <Row label="Owner" value={deal.owner?.name} />
            </dl>
          </AdminPanel>
        </AdminSection>

        <AdminSection title="Open tasks">
          <AdminPanel>
            <ul className="space-y-2 text-sm">
              {deal.tasks.map((t) => (
                <li key={t.id} className="rounded-md border border-border px-3 py-2">
                  {t.title}
                </li>
              ))}
              {!deal.tasks.length ? <li className="text-muted">No open tasks.</li> : null}
            </ul>
          </AdminPanel>
        </AdminSection>

        <AdminSection
          title="Proposals"
          className="lg:col-span-2"
          action={
            canManageProposals ? (
              <Link
                href={`/admin/agency/proposals/new?dealId=${deal.id}`}
                className="text-sm text-accent-text hover:underline"
              >
                New proposal
              </Link>
            ) : undefined
          }
        >
          <AdminPanel>
            <ul className="space-y-2 text-sm">
              {dealProposals.map((p) => (
                <li
                  key={p.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border px-3 py-2"
                >
                  <div>
                    <Link
                      href={`/admin/agency/proposals/${p.id}`}
                      className="font-medium text-accent-text hover:underline"
                    >
                      {p.proposalNumber} · {p.title}
                    </Link>
                    <p className="text-muted">{PROPOSAL_STATUS_LABELS[p.status]}</p>
                  </div>
                  <span>
                    {p.versions[0]
                      ? formatCurrency(Number(p.versions[0].totalAmount), p.versions[0].currency)
                      : "—"}
                  </span>
                </li>
              ))}
              {!dealProposals.length ? (
                <li className="text-muted">No proposals linked to this deal yet.</li>
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
