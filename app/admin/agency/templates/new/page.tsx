import Link from "next/link";
import { requireAdminUser } from "@/lib/admin/session";
import { TemplateEditor } from "@/components/admin/agency/TemplateEditor";
import { AdminDetailHeader } from "@/components/admin/patterns/AdminDetailHeader";

export const dynamic = "force-dynamic";

export default async function NewAgencyTemplatePage() {
  await requireAdminUser("manage_project_templates");

  return (
    <div className="space-y-6">
      <Link href="/admin/agency/templates" className="text-sm text-muted hover:underline">
        ← Templates
      </Link>

      <AdminDetailHeader title="New Template" />

      <TemplateEditor />
    </div>
  );
}
