import Link from "next/link";
import { requireAdminUser } from "@/lib/admin/session";
import { can } from "@/lib/admin/rbac";
import { listContactPropertiesAction } from "@/lib/admin/crm-property-actions";
import { PropertyDefinitionsPanel } from "@/components/admin/crm/PropertyDefinitionsPanel";
import { PageHeader } from "@/components/ui/page-header";

export const dynamic = "force-dynamic";

export default async function CrmPropertiesSettingsPage() {
  const user = await requireAdminUser("view_crm");
  if (!can(user.role, "manage_crm")) {
    return (
      <p className="text-sm text-neutral-600">You do not have permission to manage CRM properties.</p>
    );
  }

  const definitions = await listContactPropertiesAction();

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={
          <Link href="/admin/crm/contacts" className="text-sm text-muted hover:underline">
            ← Contacts
          </Link>
        }
        title="Contact properties"
        description="Define typed custom fields for Contacts. Archived properties keep existing values."
      />
      <PropertyDefinitionsPanel definitions={definitions} />
    </div>
  );
}
