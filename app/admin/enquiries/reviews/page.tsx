import Link from "next/link";
import { requireAdminUser } from "@/lib/admin/session";
import { can } from "@/lib/admin/rbac";
import { listEnquiries } from "@/lib/enquiries/service";
import { EnquiryFilters } from "@/components/admin/enquiries/EnquiryFilters";
import { EnquiryTable } from "@/components/admin/enquiries/EnquiryTable";
import { EnquiryExportButton } from "@/components/admin/enquiries/EnquiryExportButton";
import { AdminListPage } from "@/components/admin/patterns/AdminListPage";
import type { EnquiryStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function AdminReviewEnquiriesPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    status?: string;
    delivery?: string;
    range?: string;
    page?: string;
  }>;
}) {
  const user = await requireAdminUser("view_enquiries");
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page || "1") || 1);
  const status = (sp.status as EnquiryStatus | undefined) || undefined;

  const { items, total, pageSize } = await listEnquiries({
    type: "WEBSITE_REVIEW",
    q: sp.q,
    status: status === ("all" as EnquiryStatus) ? undefined : status,
    includeSpam: sp.status === "SPAM" || sp.status === "all",
    notificationStatus:
      sp.delivery === "SENT" ||
      sp.delivery === "FAILED" ||
      sp.delivery === "NOT_ATTEMPTED"
        ? sp.delivery
        : undefined,
    page,
    pageSize: 25,
  });

  return (
    <AdminListPage
      title="Website review requests"
      description={
        <>
          <Link href="/admin/enquiries" className="text-accent-text hover:underline">
            ← All enquiries
          </Link>
          <span className="mt-1 block">{total} matching</span>
        </>
      }
      action={
        can(user.role, "export_enquiries") ? (
          <EnquiryExportButton type="WEBSITE_REVIEW" />
        ) : undefined
      }
      filters={
        <EnquiryFilters
          basePath="/admin/enquiries/reviews"
          defaults={{
            q: sp.q || "",
            type: "",
            status: sp.status || "",
            delivery: sp.delivery || "",
            range: sp.range || "",
          }}
        />
      }
      isEmpty={items.length === 0}
      empty={{ title: "No website review requests yet" }}
    >
      <EnquiryTable items={items} empty="No website review requests yet." />
      {total > pageSize ? (
        <p className="text-sm text-muted">
          Showing page {page} ({pageSize} per page).
        </p>
      ) : null}
    </AdminListPage>
  );
}
