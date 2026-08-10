import Link from "next/link";
import { requireAdminUser } from "@/lib/admin/session";
import { CrmSubNavBar } from "@/components/admin/crm/CrmSubNavBar";
import { CreateCompanyForm } from "@/components/admin/crm/CreateCompanyForm";

export const dynamic = "force-dynamic";

export default async function NewCompanyPage() {
  await requireAdminUser("manage_crm");

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/crm/companies" className="text-sm text-neutral-600 hover:underline">
          ← Companies
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">New Company</h1>
      </div>
      <CrmSubNavBar />
      <CreateCompanyForm />
    </div>
  );
}
