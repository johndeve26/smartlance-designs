import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminUser } from "@/lib/admin/session";
import { can } from "@/lib/admin/rbac";
import { getTemplateById } from "@/lib/contracts/templates";
import { ContractTemplateDetailPanel } from "@/components/admin/agency/ContractTemplateDetailPanel";
import { AdminDetailHeader } from "@/components/admin/patterns/AdminDetailHeader";

export const dynamic = "force-dynamic";

export default async function ContractTemplateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireAdminUser("view_contracts");
  const { id } = await params;
  const template = await getTemplateById(id);
  if (!template) notFound();

  return (
    <div className="space-y-6">
      <Link href="/admin/agency/contract-templates" className="text-sm text-muted hover:underline">
        ← Contract templates
      </Link>

      <AdminDetailHeader title={template.name} subtitle={template.description ?? undefined} />

      <ContractTemplateDetailPanel
        template={template as never}
        canManage={can(user.role, "manage_contract_templates")}
      />
    </div>
  );
}
