import Link from "next/link";
import { requireAdminUser } from "@/lib/admin/session";
import {
  countNewEnquiries,
  countNotificationFailures,
  listEnquiries,
} from "@/lib/enquiries/service";
import { EnquiryFilters } from "@/components/admin/enquiries/EnquiryFilters";
import { EnquiryTable } from "@/components/admin/enquiries/EnquiryTable";
import type { EnquiryStatus, EnquiryType } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function AdminEnquiriesPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    type?: string;
    status?: string;
    delivery?: string;
    range?: string;
    page?: string;
  }>;
}) {
  await requireAdminUser("view_enquiries");
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page || "1") || 1);
  const type =
    sp.type === "CONTACT" || sp.type === "WEBSITE_REVIEW"
      ? (sp.type as EnquiryType)
      : undefined;
  const status = parseStatus(sp.status);
  const includeSpam = sp.status === "SPAM" || sp.status === "all";
  const { from, to } = parseRange(sp.range);

  const [{ items, total, pageSize }, counts, failures] = await Promise.all([
    listEnquiries({
      q: sp.q,
      type,
      status: status === "all" ? undefined : status,
      includeSpam: includeSpam || status === "SPAM",
      notificationStatus:
        sp.delivery === "SENT" ||
        sp.delivery === "FAILED" ||
        sp.delivery === "NOT_ATTEMPTED"
          ? sp.delivery
          : undefined,
      from,
      to,
      page,
      pageSize: 25,
    }),
    countNewEnquiries(),
    countNotificationFailures(24),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Enquiries</h1>
          <p className="mt-1 text-sm text-neutral-600">
            {counts.total} new · {failures} delivery failure
            {failures === 1 ? "" : "s"} (24h)
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-sm">
          <Link
            href="/admin/enquiries/contact"
            className="rounded border px-3 py-1.5 hover:bg-white"
          >
            Contact ({counts.contact} new)
          </Link>
          <Link
            href="/admin/enquiries/reviews"
            className="rounded border px-3 py-1.5 hover:bg-white"
          >
            Reviews ({counts.review} new)
          </Link>
        </div>
      </div>

      <EnquiryFilters
        basePath="/admin/enquiries"
        defaults={{
          q: sp.q || "",
          type: sp.type || "",
          status: sp.status || "",
          delivery: sp.delivery || "",
          range: sp.range || "",
        }}
        showType
      />

      <EnquiryTable items={items} empty="No enquiries match these filters." />

      {total > pageSize ? (
        <div className="flex gap-2 text-sm">
          {page > 1 ? (
            <Link
              href={`/admin/enquiries?q=${encodeURIComponent(sp.q || "")}&type=${sp.type || ""}&status=${sp.status || ""}&delivery=${sp.delivery || ""}&range=${sp.range || ""}&page=${page - 1}`}
              className="rounded border px-3 py-1"
            >
              Previous
            </Link>
          ) : null}
          <span className="px-2 py-1 text-neutral-500">
            Page {page} of {Math.ceil(total / pageSize)}
          </span>
          {page * pageSize < total ? (
            <Link
              href={`/admin/enquiries?q=${encodeURIComponent(sp.q || "")}&type=${sp.type || ""}&status=${sp.status || ""}&delivery=${sp.delivery || ""}&range=${sp.range || ""}&page=${page + 1}`}
              className="rounded border px-3 py-1"
            >
              Next
            </Link>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function parseStatus(raw?: string): EnquiryStatus | "all" | undefined {
  if (!raw) return undefined;
  if (raw === "all") return "all";
  const allowed: EnquiryStatus[] = [
    "NEW",
    "REVIEWING",
    "REPLIED",
    "QUALIFIED",
    "CLOSED",
    "SPAM",
  ];
  return allowed.includes(raw as EnquiryStatus)
    ? (raw as EnquiryStatus)
    : undefined;
}

function parseRange(range?: string): { from?: Date; to?: Date } {
  const now = new Date();
  if (range === "today") {
    const from = new Date(now);
    from.setHours(0, 0, 0, 0);
    return { from };
  }
  if (range === "7d") {
    return { from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) };
  }
  if (range === "30d") {
    return { from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) };
  }
  return {};
}
