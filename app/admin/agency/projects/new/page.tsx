import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminUser } from "@/lib/admin/session";
import { getDealPrefill } from "@/lib/agency/deal-conversion";
import { listAdminUsersForSelect } from "@/lib/agency/projects";
import { listTemplates } from "@/lib/agency/templates";
import { AgencySubNavBar } from "@/components/admin/agency/AgencySubNavBar";
import { ProjectCreateForm } from "@/components/admin/agency/ProjectCreateForm";
import { contactDisplayName } from "@/lib/crm/normalize";

export const dynamic = "force-dynamic";

export default async function NewAgencyProjectPage({
  searchParams,
}: {
  searchParams: Promise<{ dealId?: string }>;
}) {
  await requireAdminUser("manage_projects");
  const sp = await searchParams;
  const [owners, templates, dealPrefill] = await Promise.all([
    listAdminUsersForSelect(),
    listTemplates(),
    sp.dealId ? getDealPrefill(sp.dealId) : Promise.resolve(null),
  ]);

  if (sp.dealId && !dealPrefill) notFound();

  const prefill = dealPrefill
    ? {
        dealId: dealPrefill.deal.id,
        name: `${dealPrefill.deal.title} — Project`,
        primaryContactId: dealPrefill.deal.contactId,
        clientCompanyId: dealPrefill.deal.companyId ?? dealPrefill.deal.contact.companyId ?? undefined,
        ownerId: dealPrefill.deal.ownerId ?? undefined,
        serviceType: undefined,
        budgetSnapshot:
          dealPrefill.deal.amount != null ? String(Number(dealPrefill.deal.amount)) : undefined,
        currency: dealPrefill.deal.currency ?? "USD",
        summary: dealPrefill.deal.lostNote ?? undefined,
        targetDueDate: dealPrefill.deal.expectedCloseAt?.toISOString(),
      }
    : undefined;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/agency/projects" className="text-sm text-neutral-600 hover:underline">
          ← Projects
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">New Project</h1>
        {dealPrefill ? (
          <p className="mt-1 text-sm text-neutral-600">
            Prefilled from deal: {dealPrefill.deal.title} ·{" "}
            {contactDisplayName(dealPrefill.deal.contact)}
          </p>
        ) : null}
      </div>
      <AgencySubNavBar />
      <div className="admin-card max-w-2xl p-4">
        <ProjectCreateForm
          owners={owners}
          templates={templates.map((t) => ({
            id: t.id,
            name: t.name,
            serviceType: t.serviceType,
          }))}
          prefill={prefill}
        />
      </div>
    </div>
  );
}
