import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import type { ComparisonContent } from "@/data/resource-content-types";
import { cn } from "@/lib/utils";

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function ComparisonHero({
  comparison,
}: {
  comparison: ComparisonContent;
}) {
  return (
    <header className="border-b border-border bg-surface">
      <Container className="pt-8 pb-10 sm:pb-12">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Resources", href: "/resources" },
            { label: "Comparisons", href: "/compare" },
            { label: `${comparison.optionA} vs ${comparison.optionB}` },
          ]}
        />

        <div className="mt-7">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent-text">
            Comparison
          </p>
          <h1 className="mt-3.5 max-w-[44rem] font-display text-[clamp(2.25rem,4vw,3.75rem)] font-semibold leading-[1.06] tracking-tight text-foreground">
            {comparison.title}
          </h1>
          {comparison.deck ? (
            <p className="mt-5 max-w-2xl text-[1.0625rem] leading-relaxed text-muted sm:text-lg sm:leading-[1.65]">
              {comparison.deck}
            </p>
          ) : null}

          <div className="mt-5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted">
            <span className="font-medium text-foreground">
              {comparison.author?.trim() || "Smartlance Designs"}
            </span>
            <span aria-hidden className="text-subtle">
              ·
            </span>
            <time dateTime={comparison.publishedAt}>
              {formatDate(comparison.publishedAt)}
            </time>
            {comparison.updatedAt ? (
              <>
                <span aria-hidden className="text-subtle">
                  ·
                </span>
                <span>Updated {formatDate(comparison.updatedAt)}</span>
              </>
            ) : null}
            {comparison.readingTime ? (
              <>
                <span aria-hidden className="text-subtle">
                  ·
                </span>
                <span>{comparison.readingTime}</span>
              </>
            ) : null}
          </div>
        </div>

        <div className="mt-9 max-w-5xl">
          <ComparisonVsVisual
            optionA={comparison.optionA}
            optionB={comparison.optionB}
          />
        </div>
      </Container>
    </header>
  );
}

export function ComparisonVsVisual({
  optionA,
  optionB,
  className,
}: {
  optionA: string;
  optionB: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-border bg-surface-muted",
        className,
      )}
      aria-hidden
    >
      <div className="grid sm:grid-cols-[1fr_auto_1fr]">
        <div className="border-b border-border p-6 sm:border-b-0 sm:border-r sm:p-8">
          <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-accent-text">
            Option A
          </p>
          <p className="mt-3 font-display text-2xl font-semibold text-foreground sm:text-3xl">
            {optionA}
          </p>
          <div className="mt-5 space-y-2">
            <div className="h-1.5 w-[78%] rounded-full bg-border" />
            <div className="h-1.5 w-[58%] rounded-full bg-border/80" />
            <div className="h-1.5 w-[66%] rounded-full bg-border/70" />
          </div>
        </div>
        <div className="flex items-center justify-center bg-surface px-4 py-3 sm:px-5">
          <span className="font-display text-sm font-semibold uppercase tracking-[0.16em] text-accent-text">
            vs
          </span>
        </div>
        <div className="border-t border-border p-6 sm:border-t-0 sm:border-l-0 sm:p-8">
          <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-accent-text">
            Option B
          </p>
          <p className="mt-3 font-display text-2xl font-semibold text-foreground sm:text-3xl">
            {optionB}
          </p>
          <div className="mt-5 space-y-2">
            <div className="h-1.5 w-[72%] rounded-full bg-border" />
            <div className="h-1.5 w-[84%] rounded-full bg-border/80" />
            <div className="h-1.5 w-[52%] rounded-full bg-border/70" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function ComparisonCard({
  comparison,
  variant = "featured",
  className,
}: {
  comparison: ComparisonContent;
  variant?: "featured" | "compact";
  className?: string;
}) {
  const featured = variant === "featured";
  const categories = comparison.keyCategories?.slice(0, 6) ?? [];

  return (
    <article className={cn("group flex flex-col", className)}>
      <Link
        href={`/compare/${comparison.slug}`}
        aria-label={`Compare ${comparison.optionA} and ${comparison.optionB}`}
        className="relative block overflow-hidden rounded-xl border border-border focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <ComparisonVsVisual
          optionA={comparison.optionA}
          optionB={comparison.optionB}
          className="!rounded-none border-0"
        />
      </Link>

      <div className={cn("flex flex-1 flex-col", featured ? "pt-6 sm:pt-7" : "pt-5")}>
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-accent-text">
          Comparison
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
            href={`/compare/${comparison.slug}`}
            className="transition-colors hover:text-accent-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            {comparison.title}
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
          {comparison.description}
        </p>
        {categories.length > 0 ? (
          <ul className="mt-4 flex flex-wrap gap-2">
            {categories.map((category) => (
              <li
                key={category}
                className="rounded-md border border-border bg-surface-muted px-2.5 py-1 text-[0.75rem] font-medium text-muted"
              >
                {category}
              </li>
            ))}
          </ul>
        ) : null}
        <Link
          href={`/compare/${comparison.slug}`}
          className="group/link mt-5 inline-flex items-center gap-1.5 text-base font-semibold text-accent-text hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          Compare Platforms
          <ArrowRight className="h-4 w-4 transition-transform group-hover/link:translate-x-[3px] motion-reduce:transition-none" />
        </Link>
      </div>
    </article>
  );
}
