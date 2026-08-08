import Link from "next/link";
import { requireAdminUser } from "@/lib/admin/session";
import { can } from "@/lib/admin/rbac";
import { listEnquiries } from "@/lib/enquiries/service";
import { EnquiryFilters } from "@/components/admin/enquiries/EnquiryFilters";
import { EnquiryTable } from "@/components/admin/enquiries/EnquiryTable";
import { EnquiryExportButton } from "@/components/admin/enquiries/EnquiryExportButton";
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
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link href="/admin/enquiries" className="text-sm text-neutral-500 hover:underline">
            ← All enquiries
          </Link>
          <h1 className="mt-1 text-2xl font-semibold">Website review requests</h1>
          <p className="mt-1 text-sm text-neutral-600">{total} matching</p>
        </div>
        {can(user.role, "export_enquiries") ? (
          <EnquiryExportButton type="WEBSITE_REVIEW" />
        ) : null}
      </div>
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
      <EnquiryTable items={items} empty="No website review requests yet." />
      {total > pageSize ? (
        <p className="text-sm text-neutral-500">
          Showing page {page} ({pageSize} per page).
        </p>
      ) : null}
    </div>
  );
}
