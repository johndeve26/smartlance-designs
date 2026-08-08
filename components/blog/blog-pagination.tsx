import Link from "next/link";
import { cn } from "@/lib/utils";

type BlogPaginationProps = {
  current: number;
  totalPages: number;
  hrefFor: (page: number) => string;
};

export function BlogPagination({
  current,
  totalPages,
  hrefFor,
}: BlogPaginationProps) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <nav
      aria-label="Blog pagination"
      className="mt-14 flex flex-wrap items-center justify-center gap-2"
    >
      {current > 1 ? (
        <Link
          href={hrefFor(current - 1)}
          className="inline-flex h-10 items-center rounded-lg border border-border px-4 text-[0.9375rem] font-medium text-foreground transition-colors hover:border-accent hover:text-accent-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          ← Previous
        </Link>
      ) : (
        <span className="inline-flex h-10 items-center rounded-lg border border-transparent px-4 text-[0.9375rem] text-subtle">
          ← Previous
        </span>
      )}

      <ul className="flex flex-wrap items-center gap-1.5">
        {pages.map((page) => {
          const isCurrent = page === current;
          return (
            <li key={page}>
              {isCurrent ? (
                <span
                  aria-current="page"
                  className="inline-flex h-10 min-w-10 items-center justify-center rounded-lg bg-foreground px-3 text-[0.9375rem] font-semibold text-white"
                >
                  {page}
                </span>
              ) : (
                <Link
                  href={hrefFor(page)}
                  className={cn(
                    "inline-flex h-10 min-w-10 items-center justify-center rounded-lg border border-border px-3 text-[0.9375rem] font-medium text-foreground transition-colors",
                    "hover:border-accent hover:text-accent-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                  )}
                >
                  {page}
                </Link>
              )}
            </li>
          );
        })}
      </ul>

      {current < totalPages ? (
        <Link
          href={hrefFor(current + 1)}
          className="inline-flex h-10 items-center rounded-lg border border-border px-4 text-[0.9375rem] font-medium text-foreground transition-colors hover:border-accent hover:text-accent-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          Next →
        </Link>
      ) : (
        <span className="inline-flex h-10 items-center rounded-lg border border-transparent px-4 text-[0.9375rem] text-subtle">
          Next →
        </span>
      )}
    </nav>
  );
}
