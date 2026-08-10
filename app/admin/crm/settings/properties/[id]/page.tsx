import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminUser } from "@/lib/admin/session";
import { can } from "@/lib/admin/rbac";
import { getContactPropertyDetailAction } from "@/lib/admin/crm-property-actions";
import { PropertyDefinitionEditor } from "@/components/admin/crm/PropertyDefinitionEditor";
import { AdminDetailHeader } from "@/components/admin/patterns/AdminDetailHeader";

export const dynamic = "force-dynamic";

export default async function PropertyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireAdminUser("view_crm");
  if (!can(user.role, "manage_crm")) {
    return <p className="text-body-sm text-muted">You do not have permission to manage CRM properties.</p>;
  }

  const { id } = await params;
  const detail = await getContactPropertyDetailAction(id);
  if (!detail) notFound();

  return (
    <div className="space-y-6">
      <Link href="/admin/crm/settings/properties" className="text-sm text-muted hover:underline">
        ← Contact properties
      </Link>
      <AdminDetailHeader title={detail.definition.label} />
      <PropertyDefinitionEditor definition={detail.definition} valueCount={detail.valueCount} />
    </div>
  );
}
