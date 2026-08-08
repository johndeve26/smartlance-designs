import type { EnquiryStatus, NotificationStatus } from "@prisma/client";

export function EnquiryStatusBadge({ status }: { status: EnquiryStatus }) {
  const styles: Record<EnquiryStatus, string> = {
    NEW: "bg-amber-100 text-amber-900",
    REVIEWING: "bg-sky-100 text-sky-900",
    REPLIED: "bg-emerald-100 text-emerald-900",
    QUALIFIED: "bg-violet-100 text-violet-900",
    CLOSED: "bg-neutral-100 text-neutral-700",
    SPAM: "bg-red-100 text-red-800",
  };
  return (
    <span
      className={`inline-flex rounded px-2 py-0.5 text-xs font-semibold ${styles[status]}`}
    >
      {status}
    </span>
  );
}

export function DeliveryBadge({ status }: { status: NotificationStatus }) {
  const label = status.replace(/_/g, " ");
  const styles: Record<NotificationStatus, string> = {
    SENT: "bg-emerald-100 text-emerald-900",
    FAILED: "bg-red-100 text-red-800",
    NOT_ATTEMPTED: "bg-neutral-100 text-neutral-700",
  };
  return (
    <span
      className={`inline-flex rounded px-2 py-0.5 text-xs font-semibold ${styles[status]}`}
    >
      {label}
    </span>
  );
}
