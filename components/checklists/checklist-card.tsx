import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { ChecklistContent } from "@/data/resource-content-types";
import { getChecklistItemCount } from "@/data/checklists";
import type { ChecklistListingContent } from "@/lib/resources/discovery";
import { cn } from "@/lib/utils";

function checklistCounts(checklist: ChecklistContent | ChecklistListingContent) {
  if ("listingSectionCount" in checklist) {
    return {
      sectionCount: checklist.listingSectionCount,
      itemCount: checklist.listingItemCount,
    };
  }
  return {
    sectionCount: checklist.sections.length,
    itemCount: getChecklistItemCount(checklist),
  };
}

export function ChecklistCard({
  checklist,
  variant = "featured",
  className,
}: {
  checklist: ChecklistContent | ChecklistListingContent;
  variant?: "featured" | "compact";
  className?: string;
}) {
  const featured = variant === "featured";
  const { sectionCount, itemCount } = checklistCounts(checklist);

  return (
    <article className={cn("group flex flex-col", className)}>
      <Link
        href={`/checklists/${checklist.slug}`}
        aria-label={`Open checklist: ${checklist.title}`}
        className="relative block overflow-hidden rounded-xl border border-border bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <div className="aspect-[16/10] p-5 sm:p-6" aria-hidden>
          <p className="text-[0.625rem] font-semibold uppercase tracking-[0.14em] text-accent-text">
            Checklist
          </p>
          <div className="mt-5 space-y-2.5">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-2.5">
                <span className="h-4 w-4 rounded-[3px] border border-[#D4C8BC] bg-white/80" />
                <span
                  className={cn(
                    "h-1.5 rounded-full bg-[#D9CFC5]",
                    i === 0 ? "w-[72%]" : i === 1 ? "w-[58%]" : i === 2 ? "w-[66%]" : "w-[44%]",
                  )}
                />
              </div>
            ))}
          </div>
          <div className="mt-6 flex gap-2">
            <span className="rounded border border-[#D4C8BC] bg-white/70 px-2 py-1 text-[0.625rem] font-semibold uppercase tracking-wider text-[#57534E]">
              {sectionCount} sections
            </span>
            <span className="rounded border border-[#D4C8BC] bg-white/70 px-2 py-1 text-[0.625rem] font-semibold uppercase tracking-wider text-[#57534E]">
              {itemCount} items
            </span>
          </div>
        </div>
      </Link>

      <div className={cn("flex flex-1 flex-col", featured ? "pt-6 sm:pt-7" : "pt-5")}>
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-accent-text">
          Checklist
        </p>
        <h3
          className={cn(
            "mt-2.5 font-display font-semibold leading-snug text-foreground",
            featured
              ? "text-[1.5rem] sm:text-3xl lg:text-[2rem]"
              : "text-[1.25rem] sm:text-[1.375rem]",
          )}
        >
          <Link
            href={`/checklists/${checklist.slug}`}
            className="transition-colors hover:text-accent-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            {checklist.title}
          </Link>
        </h3>
        <p
          className={cn(
            "mt-3 leading-relaxed text-muted",
            featured
              ? "text-base sm:text-[1.0625rem]"
              : "line-clamp-2 text-[0.9375rem] sm:text-base",
          )}
        >
          {checklist.description}
        </p>
        <p className="mt-3 text-sm text-subtle">
          {sectionCount} sections · {itemCount} items
        </p>
        <Link
          href={`/checklists/${checklist.slug}`}
          className="group/link mt-5 inline-flex items-center gap-1.5 text-base font-semibold text-accent-text hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          Open Checklist
          <ArrowRight className="h-4 w-4 transition-transform group-hover/link:translate-x-[3px] motion-reduce:transition-none" />
        </Link>
      </div>
    </article>
  );
}
