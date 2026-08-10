import Link from "next/link";
import type { SubscriberSource, SubscriberStatus } from "@prisma/client";

const statusStyles: Record<SubscriberStatus, string> = {
  ACTIVE: "bg-green-100 text-green-800",
  PENDING: "bg-amber-100 text-amber-900",
  UNSUBSCRIBED: "bg-neutral-200 text-neutral-700",
  BOUNCED: "bg-red-100 text-red-800",
  COMPLAINED: "bg-red-100 text-red-800",
};

export function SubscriberStatusBadge({ status }: { status: SubscriberStatus }) {
  return (
    <span
      className={`inline-flex rounded px-2 py-0.5 text-xs font-semibold uppercase tracking-wide ${statusStyles[status]}`}
    >
      {status}
    </span>
  );
}

export function SubscriberTable({
  items,
}: {
  items: Array<{
    id: string;
    email: string;
    name: string | null;
    status: SubscriberStatus;
    primarySource: SubscriberSource;
    subscribedAt: Date | null;
    confirmedAt: Date | null;
  }>;
}) {
  if (!items.length) {
    return (
      <div className="rounded-lg border bg-white p-8 text-center text-sm text-neutral-600">
        No subscribers yet. Visitors who opt in through your website will appear here.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border bg-white">
      <table className="min-w-full text-sm">
        <thead className="border-b bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500">
          <tr>
            <th className="px-4 py-3 font-semibold">Name</th>
            <th className="px-4 py-3 font-semibold">Email</th>
            <th className="px-4 py-3 font-semibold">Status</th>
            <th className="px-4 py-3 font-semibold">Source</th>
            <th className="px-4 py-3 font-semibold">Subscribed</th>
            <th className="px-4 py-3 font-semibold">Confirmed</th>
            <th className="px-4 py-3 font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className="border-b last:border-b-0">
              <td className="px-4 py-3">{item.name || "—"}</td>
              <td className="px-4 py-3 font-medium">{item.email}</td>
              <td className="px-4 py-3">
                <SubscriberStatusBadge status={item.status} />
              </td>
              <td className="px-4 py-3">{item.primarySource}</td>
              <td className="px-4 py-3 whitespace-nowrap">
                {item.subscribedAt ? item.subscribedAt.toLocaleDateString() : "—"}
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                {item.confirmedAt ? item.confirmedAt.toLocaleDateString() : "—"}
              </td>
              <td className="px-4 py-3">
                <Link
                  href={`/admin/audience/${item.id}`}
                  className="font-medium text-neutral-900 hover:underline"
                >
                  View
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
