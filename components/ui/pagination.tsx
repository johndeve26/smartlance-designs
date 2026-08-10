import Link from "next/link";
import { cn } from "@/lib/utils";

type PaginationProps = {
  page: number;
  pageSize: number;
  total: number;
  hrefForPage: (page: number) => string;
  className?: string;
};

export function Pagination({
  page,
  pageSize,
  total,
  hrefForPage,
  className,
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (totalPages <= 1) return null;

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  return (
    <nav
      aria-label="Pagination"
      className={cn("flex items-center justify-between gap-4 text-sm", className)}
    >
      <p className="text-subtle">
        {start}–{end} of {total}
      </p>
      <div className="flex items-center gap-2">
        {page > 1 ? (
          <Link
            href={hrefForPage(page - 1)}
            className="rounded-md border border-border px-3 py-1.5 font-medium hover:bg-surface-muted"
          >
            Previous
          </Link>
        ) : (
          <span className="rounded-md border border-border px-3 py-1.5 text-subtle opacity-50">
            Previous
          </span>
        )}
        <span className="tabular-nums text-subtle">
          {page} / {totalPages}
        </span>
        {page < totalPages ? (
          <Link
            href={hrefForPage(page + 1)}
            className="rounded-md border border-border px-3 py-1.5 font-medium hover:bg-surface-muted"
          >
            Next
          </Link>
        ) : (
          <span className="rounded-md border border-border px-3 py-1.5 text-subtle opacity-50">
            Next
          </span>
        )}
      </div>
    </nav>
  );
}
