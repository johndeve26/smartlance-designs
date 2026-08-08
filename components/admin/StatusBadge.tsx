import type { AdminUserStatus, PublishStatus } from "@prisma/client";

const publishStyles: Record<PublishStatus, string> = {
  DRAFT: "bg-neutral-100 text-neutral-700",
  PUBLISHED: "bg-emerald-50 text-emerald-800",
  ARCHIVED: "bg-amber-50 text-amber-900",
};

const userStyles: Record<AdminUserStatus, string> = {
  ACTIVE: "bg-emerald-50 text-emerald-800",
  DISABLED: "bg-red-50 text-red-800",
};

export function StatusBadge({
  status,
}: {
  status: PublishStatus | AdminUserStatus | string;
}) {
  const style =
    publishStyles[status as PublishStatus] ??
    userStyles[status as AdminUserStatus] ??
    "bg-neutral-100 text-neutral-700";

  return (
    <span
      className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium uppercase tracking-wide ${style}`}
    >
      {status}
    </span>
  );
}
