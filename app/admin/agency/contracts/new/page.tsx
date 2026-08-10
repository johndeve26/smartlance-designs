import Link from "next/link";
import { requireAdminUser } from "@/lib/admin/session";
import { can } from "@/lib/admin/rbac";
import { listTemplates } from "@/lib/contracts/templates";
import { ContractCreateForm } from "@/components/admin/agency/ContractCreateForm";
import { AdminDetailHeader } from "@/components/admin/patterns/AdminDetailHeader";

export const dynamic = "force-dynamic";

export default async function NewContractPage() {
  await requireAdminUser("manage_contracts");
  const templates = await listTemplates();

  return (
    <div className="space-y-6">
      <Link href="/admin/agency/contracts" className="text-sm text-muted hover:underline">
        ← Contracts
      </Link>

      <AdminDetailHeader title="New contract" />

      <ContractCreateForm
        templateOptions={templates.flatMap((t) =>
          t.versions[0]
            ? [{ id: t.id, name: t.name, versionId: t.versions[0].id }]
            : [],
        )}
      />
    </div>
  );
}
