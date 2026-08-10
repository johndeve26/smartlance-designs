import Link from "next/link";
import { requireAdminUser } from "@/lib/admin/session";
import { CreateContactForm } from "@/components/admin/crm/CreateContactForm";
import { AdminDetailHeader } from "@/components/admin/patterns/AdminDetailHeader";
import { AdminPanel } from "@/components/admin/patterns/AdminPanel";

export const dynamic = "force-dynamic";

export default async function NewContactPage() {
  await requireAdminUser("manage_crm");

  return (
    <div className="space-y-6">
      <Link href="/admin/crm/contacts" className="text-sm text-accent-text hover:underline">
        ← Contacts
      </Link>

      <AdminDetailHeader title="New Contact" />

      <AdminPanel className="max-w-xl">
        <CreateContactForm />
      </AdminPanel>
    </div>
  );
}
