import Link from "next/link";
import { requireAdminUser } from "@/lib/admin/session";
import { can } from "@/lib/admin/rbac";
import { CrmSubNavBar } from "@/components/admin/crm/CrmSubNavBar";
import { ContactCsvImportWizard } from "@/components/admin/crm/ContactCsvImportWizard";

export const dynamic = "force-dynamic";

export default async function ContactImportPage() {
  const user = await requireAdminUser("view_crm");
  if (!can(user.role, "manage_crm")) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-neutral-600">You do not have permission to import contacts.</p>
        <Link href="/admin/crm/contacts" className="text-sm hover:underline">
          ← Back to contacts
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/crm/contacts" className="text-sm text-neutral-600 hover:underline">
          ← Contacts
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">Import contacts</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Upload a CSV, map columns, preview validation, then import. Suppressed contacts remain suppressed.
        </p>
      </div>
      <CrmSubNavBar />
      <ContactCsvImportWizard />
      <p className="text-sm">
        <Link href="/admin/crm/imports" className="text-neutral-600 hover:underline">
          View import history
        </Link>
      </p>
    </div>
  );
}
