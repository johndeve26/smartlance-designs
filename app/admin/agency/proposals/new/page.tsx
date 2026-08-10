import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminUser } from "@/lib/admin/session";
import { listAdminUsersForSelect } from "@/lib/admin/proposal-actions";
import { getDealProposalPrefill } from "@/lib/proposals/deal-prefill";
import { ProposalCreateForm } from "@/components/admin/agency/ProposalCreateForm";
import { contactDisplayName } from "@/lib/crm/normalize";
import { AdminDetailHeader } from "@/components/admin/patterns/AdminDetailHeader";
import { AdminPanel } from "@/components/admin/patterns/AdminPanel";

export const dynamic = "force-dynamic";

export default async function NewProposalPage({
  searchParams,
}: {
  searchParams: Promise<{ dealId?: string }>;
}) {
  await requireAdminUser("manage_proposals");
  const sp = await searchParams;
  const [owners, dealPrefill] = await Promise.all([
    listAdminUsersForSelect(),
    sp.dealId ? getDealProposalPrefill(sp.dealId) : Promise.resolve(null),
  ]);

  if (sp.dealId && !dealPrefill) notFound();

  const prefill = dealPrefill
    ? {
        dealId: dealPrefill.deal.id,
        title: dealPrefill.deal.title,
        primaryContactId: dealPrefill.prefill.primaryContactId,
        companyId: dealPrefill.prefill.companyId ?? undefined,
        ownerId: dealPrefill.prefill.ownerId ?? undefined,
        currency: dealPrefill.prefill.currency,
        summary: dealPrefill.prefill.summary ?? undefined,
      }
    : undefined;

  return (
    <div className="space-y-6">
      <Link href="/admin/agency/proposals" className="text-sm text-muted hover:underline">
        ← Proposals
      </Link>

      <AdminDetailHeader
        title="New Proposal"
        subtitle={
          dealPrefill
            ? `Prefilled from deal: ${dealPrefill.deal.title} · ${contactDisplayName(dealPrefill.deal.contact)}`
            : undefined
        }
      />

      <AdminPanel className="max-w-2xl">
        <ProposalCreateForm owners={owners} prefill={prefill} />
      </AdminPanel>
    </div>
  );
}
