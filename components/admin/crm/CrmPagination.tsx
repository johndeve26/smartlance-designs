import Link from "next/link";

/** Server-safe pagination — keep out of client bundles so pages may pass href builders. */
export function CrmPagination({
  page,
  totalPages,
  total,
  hrefForPage,
}: {
  page: number;
  totalPages: number;
  total: number;
  hrefForPage: (page: number) => string;
}) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between text-sm">
      <p className="text-neutral-600">
        Page {page} of {totalPages} · {total} records
      </p>
      <div className="flex gap-2">
        {page > 1 ? (
          <Link
            href={hrefForPage(page - 1)}
            className="rounded border px-3 py-1 hover:bg-white"
          >
            Previous
          </Link>
        ) : null}
        {page < totalPages ? (
          <Link
            href={hrefForPage(page + 1)}
            className="rounded border px-3 py-1 hover:bg-white"
          >
            Next
          </Link>
        ) : null}
      </div>
    </div>
  );
}
