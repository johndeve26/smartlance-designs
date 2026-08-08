import type { Metadata } from "next";
import Link from "next/link";
import { requireAdminUser, userCan } from "@/lib/admin/session";
import { listAllServicesAdmin } from "@/lib/repositories/servicesRepository";
import { ContentBulkTable } from "@/components/admin/ContentBulkTable";

export const metadata: Metadata = {
  title: "Services",
};

export default async function AdminServicesPage() {
  const user = await requireAdminUser();
  const canEdit = userCan(user, "edit_draft");
  const canPublish = userCan(user, "publish");
  const services = await listAllServicesAdmin();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="admin-page-title">Services</h1>
          <p className="mt-1 text-sm text-neutral-500">
            {services.length} service{services.length === 1 ? "" : "s"}
          </p>
        </div>
        {canEdit ? (
          <Link href="/admin/services/new" className="admin-btn-primary">
            New service
          </Link>
        ) : null}
      </div>

      <ContentBulkTable
        family="service"
        canPublish={canPublish}
        emptyMessage="No services in the database yet."
        columns={[
          { key: "title", header: "Title", isTitle: true },
          { key: "slug", header: "Slug", mono: true },
          { key: "group", header: "Group" },
          { key: "status", header: "Status" },
          { key: "order", header: "Order" },
        ]}
        rows={services.map((s) => ({
          id: s.id,
          href: `/admin/services/${s.id}`,
          title: s.title,
          status: s.status,
          fields: {
            slug: s.slug,
            group: s.group,
            order: String(s.displayOrder),
          },
        }))}
      />
    </div>
  );
}
