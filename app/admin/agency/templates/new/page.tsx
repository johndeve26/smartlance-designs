import Link from "next/link";
import { requireAdminUser } from "@/lib/admin/session";
import { AgencySubNavBar } from "@/components/admin/agency/AgencySubNavBar";
import { TemplateEditor } from "@/components/admin/agency/TemplateEditor";

export const dynamic = "force-dynamic";

export default async function NewAgencyTemplatePage() {
  await requireAdminUser("manage_project_templates");

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/agency/templates" className="text-sm text-neutral-600 hover:underline">
          ← Templates
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">New Template</h1>
      </div>
      <AgencySubNavBar />
      <TemplateEditor />
    </div>
  );
}
