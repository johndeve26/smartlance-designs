import Link from "next/link";
import { requireAdminUser } from "@/lib/admin/session";
import { can } from "@/lib/admin/rbac";
import {
  countSubscribersByStatus,
  listSubscribers,
} from "@/lib/audience/service";
import { SubscriberFilters } from "@/components/admin/audience/SubscriberFilters";
import { SubscriberTable } from "@/components/admin/audience/SubscriberTable";
import { SubscriberExportButton } from "@/components/admin/audience/SubscriberExportButton";
import { AdminListPage } from "@/components/admin/patterns/AdminListPage";
import { AdminStatGrid } from "@/components/admin/patterns/AdminDashboardPanels";
import { Pagination } from "@/components/ui/pagination";
import type { SubscriberSource, SubscriberStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function AdminAudiencePage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    status?: string;
    source?: string;
    page?: string;
  }>;
}) {
  const user = await requireAdminUser("view_audience");
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page || "1") || 1);
  const status = parseStatus(sp.status);
  const source = parseSource(sp.source);

  const [counts, list] = await Promise.all([
    countSubscribersByStatus(),
    listSubscribers({
      q: sp.q,
      status,
      source,
      page,
      pageSize: 25,
    }),
  ]);

  return (
    <AdminListPage
      title="Audience"
      description="Voluntary subscribers who asked to hear from Smartlance."
      action={
        can(user.role, "export_audience") ? <SubscriberExportButton /> : undefined
      }
      filters={<SubscriberFilters />}
      isEmpty={list.items.length === 0}
      empty={{
        title: "No subscribers match these filters",
        description: "Adjust filters or wait for new sign-ups.",
      }}
      pagination={
        list.total > list.pageSize ? (
          <Pagination
            page={list.page}
            pageSize={list.pageSize}
            total={list.total}
            hrefForPage={(p) => pageHref(sp, p)}
          />
        ) : undefined
      }
    >
      <AdminStatGrid
        stats={[
          { label: "Total", value: counts.total },
          { label: "Active", value: counts.active },
          { label: "Pending", value: counts.pending },
          { label: "Unsubscribed", value: counts.unsubscribed },
          { label: "New (30d)", value: counts.new30d },
        ]}
      />
      <SubscriberTable items={list.items} />
    </AdminListPage>
  );
}

function parseStatus(raw?: string): SubscriberStatus | "all" | undefined {
  if (!raw || raw === "all") return "all";
  if (
    raw === "ACTIVE" ||
    raw === "PENDING" ||
    raw === "UNSUBSCRIBED" ||
    raw === "BOUNCED" ||
    raw === "COMPLAINED"
  ) {
    return raw;
  }
  return undefined;
}

function parseSource(raw?: string): SubscriberSource | undefined {
  const allowed: SubscriberSource[] = [
    "FOOTER",
    "INSIGHT",
    "RESOURCE",
    "GUIDE",
    "CHECKLIST",
    "TEMPLATE",
    "CONTACT",
    "WEBSITE_REVIEW",
    "PROJECT_PLANNER",
    "OTHER",
  ];
  return allowed.includes(raw as SubscriberSource)
    ? (raw as SubscriberSource)
    : undefined;
}

function pageHref(
  sp: { q?: string; status?: string; source?: string },
  page: number,
) {
  const params = new URLSearchParams();
  if (sp.q) params.set("q", sp.q);
  if (sp.status) params.set("status", sp.status);
  if (sp.source) params.set("source", sp.source);
  params.set("page", String(page));
  return `/admin/audience?${params.toString()}`;
}
