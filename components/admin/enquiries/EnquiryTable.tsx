import Link from "next/link";
import type { EnquiryStatus, EnquiryType } from "@prisma/client";
import { EnquiryStatusBadge } from "@/components/admin/enquiries/EnquiryBadges";

export function EnquiryTable({
  items,
  empty,
}: {
  items: Array<{
    id: string;
    reference: string;
    type: EnquiryType;
    status: EnquiryStatus;
    name: string | null;
    email: string | null;
    websiteUrl: string | null;
    service: string | null;
    mainConcern: string | null;
    submittedAt: Date;
    notificationStatus: string;
  }>;
  empty: string;
}) {
  if (!items.length) {
    return (
      <p className="rounded-lg border bg-white px-4 py-8 text-center text-sm text-neutral-500">
        {empty}
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border bg-white">
      <table className="min-w-full text-left text-sm">
        <thead className="border-b bg-neutral-50 text-xs uppercase text-neutral-500">
          <tr>
            <th className="px-3 py-2">Type</th>
            <th className="px-3 py-2">Person</th>
            <th className="px-3 py-2">Focus</th>
            <th className="px-3 py-2">Status</th>
            <th className="px-3 py-2">Delivery</th>
            <th className="px-3 py-2">Submitted</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const href =
              item.type === "CONTACT"
                ? `/admin/enquiries/contact/${item.id}`
                : `/admin/enquiries/reviews/${item.id}`;
            return (
              <tr
                key={item.id}
                className={`border-b align-top ${item.status === "NEW" ? "bg-amber-50/40" : ""}`}
              >
                <td className="px-3 py-2">
                  <Link
                    href={href}
                    className="font-medium text-[#F47A48] hover:underline"
                  >
                    {item.type === "CONTACT" ? "Contact" : "Review"}
                  </Link>
                  <div className="font-mono text-xs text-neutral-500">
                    {item.reference}
                  </div>
                </td>
                <td className="px-3 py-2">
                  <div className="font-medium break-words">{item.name || "—"}</div>
                  <div className="break-all text-xs text-neutral-500">
                    {item.email || "—"}
                  </div>
                </td>
                <td className="px-3 py-2 max-w-[14rem]">
                  <div className="truncate">
                    {item.service || item.mainConcern || item.websiteUrl || "—"}
                  </div>
                </td>
                <td className="px-3 py-2">
                  <EnquiryStatusBadge status={item.status} />
                </td>
                <td className="px-3 py-2 text-xs">
                  {item.notificationStatus.replace("_", " ")}
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-xs text-neutral-600">
                  {item.submittedAt.toISOString().slice(0, 16).replace("T", " ")}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
