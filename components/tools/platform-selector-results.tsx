"use client";

import Link from "next/link";
import { Check, Copy, RotateCcw } from "lucide-react";
import type { RefObject } from "react";
import type {
  PlatformRecommendation,
  PlatformSelectorResult,
} from "@/lib/platform-selector";
import { getSolutionBySlug } from "@/data/solutions";
import { services } from "@/data/services";
import { seoServices } from "@/data/seo";
import { cn } from "@/lib/utils";

type Props = {
  result: PlatformSelectorResult;
  tool: {
    relatedTemplateSlugs?: string[];
    relatedGuideSlugs?: string[];
    relatedChecklistSlugs?: string[];
    relatedComparisonSlugs?: string[];
  };
  headingRef: RefObject<HTMLHeadingElement | null>;
  copied: boolean;
  onCopy: () => void;
  onStartOver: () => void;
};

export function PlatformSelectorResults({
  result,
  tool,
  headingRef,
  copied,
  onCopy,
  onStartOver,
}: Props) {
  const primary = result.recommendations.filter((r) => r.tier === "primary");
  const also = result.recommendations.filter(
    (r) => r.tier === "also" || r.tier === "special",
  );

  const templateSlug =
    tool.relatedTemplateSlugs?.[0] ?? "website-project-brief-template";
  const guideSlug = tool.relatedGuideSlugs?.[0] ?? "website-redesign-guide";
  const checklistSlug =
    tool.relatedChecklistSlugs?.[0] ?? "website-redesign-checklist";
  const comparisonSlug =
    tool.relatedComparisonSlugs?.[0] ?? "wordpress-vs-webflow";

  const solutionLinks = result.related.solutionSlugs
    .slice(0, 2)
    .map((slug) => {
      const solution = getSolutionBySlug(slug);
      return {
        slug,
        title: solution?.title ?? slug.replace(/-/g, " "),
      };
    });

  const serviceLinks = (result.related.serviceHrefs ?? [])
    .slice(0, 4)
    .map((href) => {
      const service =
        services.find((item) => item.href === href) ||
        seoServices.find((item) => item.href === href);
      return {
        href,
        title: service?.title ?? href.split("/").filter(Boolean).pop()?.replace(/-/g, " ") ?? href,
      };
    });

  return (
    <div className="space-y-10">
      <div>
        <h2
          ref={headingRef}
          tabIndex={-1}
          className="font-display text-[clamp(1.75rem,3.5vw,2.25rem)] font-semibold leading-tight tracking-tight text-foreground outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          Your Platform Shortlist
        </h2>
        <p className="mt-3 text-[0.8125rem] leading-relaxed text-subtle">
          {result.disclaimer ||
            "This is a planning aid, not a guarantee that a platform will fit every technical or operational requirement."}
        </p>
      </div>

      <section aria-labelledby="requirements-summary-heading">
        <h3
          id="requirements-summary-heading"
          className="text-[0.8125rem] font-semibold uppercase tracking-[0.12em] text-subtle"
        >
          Your Requirements
        </h3>
        <dl className="mt-4 grid gap-3 sm:grid-cols-2">
          {result.answerSummary.map((item) => (
            <div
              key={`${item.label}-${item.value}`}
              className="border-b border-border pb-3"
            >
              <dt className="text-[0.8125rem] text-muted">{item.label}</dt>
              <dd className="mt-0.5 text-[0.9375rem] font-medium text-foreground">
                {item.value}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      {result.lowConfidence ? (
        <aside
          className="rounded-lg border border-border bg-surface-muted px-4 py-4 text-[0.9375rem] leading-relaxed text-muted"
          role="status"
        >
          <p>
            Several answers were uncertain, so these suggestions are broad.
            Clarifying requirements first usually leads to a sharper shortlist.
          </p>
          <p className="mt-2">
            <Link
              href={`/templates/${templateSlug}`}
              className="font-medium text-accent-text hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              Use the Website Project Brief Template
            </Link>{" "}
            to capture what the site needs to do.
          </p>
        </aside>
      ) : null}

      {result.needsCustomArchitecture ? (
        <aside
          className="rounded-lg border border-warning/30 bg-warning-soft px-4 py-4 text-[0.9375rem] leading-relaxed text-foreground"
          role="status"
        >
          <p className="font-medium">Custom or hybrid architecture may fit better</p>
          <p className="mt-2 text-muted">
            Your answers point to substantial custom workflows or deep system
            dependencies. A single off-the-shelf platform may not be enough on
            its own — strategy and development planning matter before you
            commit.
          </p>
          <p className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[0.875rem]">
            <Link
              href="/services/website-strategy"
              className="font-medium text-accent-text hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              Website Strategy
            </Link>
            <Link
              href="/services/website-development"
              className="font-medium text-accent-text hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              Website Development
            </Link>
            <Link
              href="/contact"
              className="font-medium text-accent-text hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              Contact
            </Link>
          </p>
        </aside>
      ) : null}

      {result.conflictingRequirements && result.conflictSummary ? (
        <aside
          className="rounded-lg border border-border bg-surface px-4 py-4 text-[0.9375rem] leading-relaxed text-muted"
          role="status"
        >
          <p className="font-medium text-foreground">Trade-offs to resolve</p>
          <p className="mt-2">{result.conflictSummary}</p>
        </aside>
      ) : null}

      <section aria-labelledby="primary-fit-heading" className="space-y-6">
        <div>
          <h3
            id="primary-fit-heading"
            className="text-[0.8125rem] font-semibold uppercase tracking-[0.12em] text-accent-text"
          >
            Strong fit to consider
          </h3>
          {result.tiedPrimary ? (
            <p className="mt-2 text-[0.9375rem] leading-relaxed text-muted">
              Two platforms deserve a closer look based on your answers.
            </p>
          ) : null}
          {result.tiedPrimary && result.whatSeparatesThem?.length ? (
            <ul className="mt-3 list-disc space-y-1.5 pl-5 text-[0.9375rem] leading-relaxed text-muted">
              {result.whatSeparatesThem.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : null}
        </div>

        <div className="space-y-8">
          {primary.map((rec) => (
            <RecommendationBlock key={rec.slug} recommendation={rec} />
          ))}
        </div>
      </section>

      {also.length > 0 ? (
        <section aria-labelledby="also-consider-heading" className="space-y-6">
          <h3
            id="also-consider-heading"
            className="text-[0.8125rem] font-semibold uppercase tracking-[0.12em] text-subtle"
          >
            Also worth considering
          </h3>
          <div className="space-y-8">
            {also.map((rec) => (
              <RecommendationBlock key={rec.slug} recommendation={rec} />
            ))}
          </div>
        </section>
      ) : null}

      <nav
        aria-label="Related resources"
        className="space-y-3 border-t border-border pt-8"
      >
        {result.related.showWordpressVsWebflow ? (
          <p className="text-[0.9375rem] text-muted">
            <Link
              href={`/compare/${comparisonSlug}`}
              className="font-medium text-accent-text hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              Compare WordPress vs Webflow
            </Link>
          </p>
        ) : null}

        {result.related.showProjectBrief ? (
          <p className="text-[0.9375rem] text-muted">
            Template:{" "}
            <Link
              href={`/templates/${templateSlug}`}
              className="font-medium text-accent-text hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              Website Project Brief Template
            </Link>
          </p>
        ) : null}

        {result.related.showRedesignGuide ? (
          <p className="text-[0.9375rem] text-muted">
            Guide:{" "}
            <Link
              href={`/guides/${guideSlug}`}
              className="font-medium text-accent-text hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              The Complete Website Redesign Guide
            </Link>
          </p>
        ) : null}

        {result.related.showRedesignChecklist ? (
          <p className="text-[0.9375rem] text-muted">
            Checklist:{" "}
            <Link
              href={`/checklists/${checklistSlug}`}
              className="font-medium text-accent-text hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              Website Redesign Checklist
            </Link>
          </p>
        ) : null}

        {solutionLinks.length > 0 ? (
          <div className="pt-2">
            <p className="text-[0.8125rem] font-semibold uppercase tracking-[0.12em] text-subtle">
              Related solutions
            </p>
            <ul className="mt-2 space-y-1.5">
              {solutionLinks.map((item) => (
                <li key={item.slug}>
                  <Link
                    href={`/solutions/${item.slug}`}
                    className="text-[0.9375rem] font-medium text-accent-text hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  >
                    {item.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {serviceLinks.length > 0 ? (
          <div className="pt-2">
            <p className="text-[0.8125rem] font-semibold uppercase tracking-[0.12em] text-subtle">
              Related services
            </p>
            <ul className="mt-2 space-y-1.5">
              {serviceLinks.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-[0.9375rem] font-medium text-accent-text hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  >
                    {item.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </nav>

      <div className="flex flex-wrap gap-3 border-t border-border pt-8">
        <button
          type="button"
          onClick={onCopy}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-border bg-surface px-4 text-[0.9375rem] font-semibold text-foreground hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          aria-live="polite"
        >
          {copied ? (
            <>
              <Check className="h-4 w-4" aria-hidden />
              Copied
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" aria-hidden />
              Copy Results
            </>
          )}
        </button>
        <button
          type="button"
          onClick={onStartOver}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg px-3 text-[0.9375rem] font-medium text-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <RotateCcw className="h-4 w-4" aria-hidden />
          Start Over
        </button>
      </div>

      <section className="rounded-xl border border-border bg-surface-muted px-5 py-8 sm:px-8">
        <h3 className="font-display text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
          Want a Second Opinion Before You Commit?
        </h3>
        <p className="mt-2 max-w-xl text-[0.9375rem] leading-relaxed text-muted">
          The selector can narrow the options, but the final choice should
          account for your content, integrations, workflow and future
          requirements.
        </p>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Link
            href="/contact"
            className="inline-flex h-11 items-center justify-center rounded-lg bg-cta px-5 text-[0.9375rem] font-semibold text-cta-foreground hover:bg-cta-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            Tell Us About Your Project
          </Link>
          <Link
            href="/platforms"
            className="inline-flex h-11 items-center justify-center rounded-lg border border-border bg-surface px-5 text-[0.9375rem] font-semibold text-foreground hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            Explore All Platforms
          </Link>
        </div>
        <p className="mt-4 text-sm text-muted">
          Curious how project scope affects investment?{" "}
          <Link
            href="/pricing"
            className="font-semibold text-accent-text hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            View Pricing &amp; Project Scope
          </Link>
        </p>
      </section>
    </div>
  );
}

function RecommendationBlock({
  recommendation,
}: {
  recommendation: PlatformRecommendation;
}) {
  return (
    <article className="border-t border-border pt-6 first:border-t-0 first:pt-0">
      <h4 className="font-display text-[1.5rem] font-semibold tracking-tight text-foreground sm:text-[1.75rem]">
        {recommendation.name}
      </h4>

      {recommendation.why.length > 0 ? (
        <div className="mt-4">
          <p className="text-[0.8125rem] font-semibold uppercase tracking-[0.1em] text-subtle">
            Why it appears here
          </p>
          <ul className="mt-2 list-disc space-y-1.5 pl-5 text-[0.9375rem] leading-relaxed text-foreground sm:text-base">
            {recommendation.why.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {recommendation.watchFor.length > 0 ? (
        <div className="mt-4">
          <p className="text-[0.8125rem] font-semibold uppercase tracking-[0.1em] text-subtle">
            Watch for
          </p>
          <ul className="mt-2 list-disc space-y-1.5 pl-5 text-[0.9375rem] leading-relaxed text-muted sm:text-base">
            {recommendation.watchFor.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <p className="mt-5">
        <Link
          href={recommendation.route}
          className={cn(
            "inline-flex items-center text-[0.9375rem] font-semibold text-accent-text",
            "hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
          )}
        >
          Explore {recommendation.name}
          <span aria-hidden className="ml-1">
            →
          </span>
        </Link>
      </p>
    </article>
  );
}
