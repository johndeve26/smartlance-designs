import type { Metadata } from "next";
import Link from "next/link";
import { requireAdminUser, userCan } from "@/lib/admin/session";
import { listAllServicesAdmin } from "@/lib/repositories/servicesRepository";
import { ContentBulkTable } from "@/components/admin/ContentBulkTable";
import { AdminListPage } from "@/components/admin/patterns/AdminListPage";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Services",
};

export default async function AdminServicesPage() {
  const user = await requireAdminUser();
  const canEdit = userCan(user, "edit_draft");
  const canPublish = userCan(user, "publish");
  const services = await listAllServicesAdmin();

  return (
    <AdminListPage
      title="Services"
      description="Create, review and publish Smartlance service pages."
      action={
        canEdit ? (
          <Button asChild size="sm">
            <Link href="/admin/services/new">New service</Link>
          </Button>
        ) : undefined
      }
      isEmpty={services.length === 0}
      empty={{
        title: "No services yet",
        description: "Create your first service page.",
        action: canEdit ? (
          <Button asChild>
            <Link href="/admin/services/new">Create first service</Link>
          </Button>
        ) : undefined,
      }}
    >
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
    </AdminListPage>
  );
}
