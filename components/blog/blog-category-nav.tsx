import Link from "next/link";
import { cn } from "@/lib/utils";
import { BlogCategoryMore } from "@/components/blog/blog-category-more";
import { BlogSearch } from "@/components/blog/blog-search";
import type { BlogPostMeta } from "@/types";

const PRIMARY_CATEGORIES = [
  "Website Design",
  "SEO",
  "Conversion",
  "Vacation Rentals",
  "Performance",
  "Digital Marketing",
] as const;

type BlogCategoryNavProps = {
  categories: string[];
  active?: string;
  posts: Pick<BlogPostMeta, "slug" | "title" | "description" | "category">[];
};

export function BlogCategoryNav({
  categories,
  active,
  posts,
}: BlogCategoryNavProps) {
  const primary = PRIMARY_CATEGORIES.filter((category) =>
    categories.includes(category),
  );
  const more = categories.filter(
    (category) =>
      !PRIMARY_CATEGORIES.includes(
        category as (typeof PRIMARY_CATEGORIES)[number],
      ),
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <nav aria-label="Blog categories" className="min-w-0 flex-1">
          <ul className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1 sm:flex-wrap sm:overflow-visible">
            <li className="shrink-0">
              <CategoryTab href="/blog" label="All" active={!active} />
            </li>
            {primary.map((category) => (
              <li key={category} className="shrink-0">
                <CategoryTab
                  href={`/blog?category=${encodeURIComponent(category)}`}
                  label={category}
                  active={active === category}
                />
              </li>
            ))}
            {more.length > 0 ? (
              <li className="shrink-0">
                <BlogCategoryMore categories={more} active={active} />
              </li>
            ) : null}
          </ul>
        </nav>
        <div className="w-full shrink-0 lg:max-w-xs">
          <BlogSearch posts={posts} />
        </div>
      </div>
    </div>
  );
}

function CategoryTab({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "inline-flex h-10 items-center rounded-full border px-4 text-[0.9375rem] font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
        active
          ? "border-accent bg-orange-50 text-accent-text"
          : "border-border bg-surface text-muted hover:border-foreground/20 hover:text-foreground",
      )}
    >
      {label}
    </Link>
  );
}
