"use client";

import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

type BlogCategoryMoreProps = {
  categories: string[];
  active?: string;
};

export function BlogCategoryMore({ categories, active }: BlogCategoryMoreProps) {
  const router = useRouter();
  const isActive = Boolean(active && categories.includes(active));

  return (
    <div className="relative">
      <label htmlFor="blog-category-more" className="sr-only">
        More categories
      </label>
      <select
        id="blog-category-more"
        value={isActive ? active : ""}
        onChange={(event) => {
          const value = event.target.value;
          router.push(
            value ? `/blog?category=${encodeURIComponent(value)}` : "/blog",
          );
        }}
        className={cn(
          "h-10 appearance-none rounded-full border bg-surface px-4 pr-9 text-[0.9375rem] font-medium outline-none transition-colors",
          "hover:border-foreground/20 focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/25",
          isActive
            ? "border-accent text-accent-text"
            : "border-border text-muted",
        )}
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%23F47A48' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E\")",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "right 0.75rem center",
        }}
      >
        <option value="">More</option>
        {categories.map((category) => (
          <option key={category} value={category}>
            {category}
          </option>
        ))}
      </select>
    </div>
  );
}
