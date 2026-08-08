import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireAdminUser, userCan } from "@/lib/admin/session";
import { saveServiceDraftAction } from "@/lib/admin/content-actions";
import { PublishBar } from "@/components/admin/PublishBar";
import { ServiceFormFields } from "@/components/admin/ServiceFormFields";

export const metadata: Metadata = {
  title: "New service",
};

export default async function AdminNewServicePage() {
  const user = await requireAdminUser("edit_draft");
  if (!userCan(user, "edit_draft")) redirect("/admin/services");

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4">
        <h1 className="admin-page-title">New service</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Creates a draft service record
        </p>
        <p className="mt-2 rounded border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-700">
          Service AI is available after the first save. Fill in title, slug,
          summary, and description, then click Save draft — you&apos;ll be taken
          to the editor with Service AI at the top.
        </p>
      </div>

      <form className="space-y-4">
        <PublishBar
          status="DRAFT"
          canEdit
          saveAction={saveServiceDraftAction}
        />
        <ServiceFormFields service={null} disabled={false} />
      </form>
    </div>
  );
}
