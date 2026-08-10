import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminUser } from "@/lib/admin/session";
import { can } from "@/lib/admin/rbac";
import { getContactById } from "@/lib/crm/contacts";
import { listContactPropertyDefinitions } from "@/lib/crm/properties/definitions";
import { CrmSubNavBar } from "@/components/admin/crm/CrmSubNavBar";
import { ContactEditForm } from "@/components/admin/crm/ContactEditForm";
import { contactDisplayName } from "@/lib/crm/normalize";

export const dynamic = "force-dynamic";

export default async function EditContactPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdminUser("manage_crm");
  const { id } = await params;
  const contact = await getContactById(id);
  if (!contact) notFound();

  const propertyDefinitions = await listContactPropertyDefinitions();

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/admin/crm/contacts/${id}`} className="text-sm text-neutral-600 hover:underline">
          ← {contactDisplayName(contact)}
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">Edit contact</h1>
      </div>
      <CrmSubNavBar />
      <ContactEditForm contact={contact} propertyDefinitions={propertyDefinitions} />
    </div>
  );
}
