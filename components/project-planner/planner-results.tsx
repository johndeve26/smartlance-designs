"use client";

import Link from "next/link";
import { Check, Copy, Pencil, RotateCcw } from "lucide-react";
import type { RefObject } from "react";
import { PLANNER_PATH_META } from "@/data/project-planner";
import type { ProjectPlannerResult } from "@/lib/project-planner";
import { cn } from "@/lib/utils";

type Props = {
  result: ProjectPlannerResult;
  headingRef: RefObject<HTMLHeadingElement | null>;
  copied: boolean;
  onCopy: () => void;
  onEditAnswers: () => void;
  onStartOver: () => void;
};

export function PlannerResults({
  result,
  headingRef,
  copied,
  onCopy,
  onEditAnswers,
  onStartOver,
}: Props) {
  return (
    <div className="space-y-10">
      <div>
        <p className="text-[0.8125rem] font-semibold uppercase tracking-[0.12em] text-accent-text">
          Your likely project path
        </p>
        <h2
          ref={headingRef}
          tabIndex={-1}
          className="mt-3 font-display text-[clamp(2.25rem,6vw,3.75rem)] font-semibold leading-[0.95] tracking-tight text-foreground outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          {result.pathTitle}
        </h2>
        <p className="mt-4 text-[1.0625rem] leading-relaxed text-muted sm:text-lg">
          {result.pathExplanation}
        </p>
        <p className="mt-4 text-[0.8125rem] leading-relaxed text-subtle">
          {result.disclaimer}
        </p>
        {result.lowConfidence ? (
          <aside
            className="mt-5 rounded-lg border border-border bg-surface-muted px-4 py-4 text-[0.9375rem] leading-relaxed text-muted"
            role="status"
          >
            Several answers were uncertain, so this path is a starting point
            rather than a firm recommendation. Clarifying goals and constraints
            usually sharpens the next step.
          </aside>
        ) : null}
      </div>

      {result.why.length > 0 ? (
        <section aria-labelledby="planner-why-heading">
          <h3
            id="planner-why-heading"
            className="text-[0.8125rem] font-semibold uppercase tracking-[0.12em] text-subtle"
          >
            Why this path fits your answers
          </h3>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-[0.9375rem] leading-relaxed text-foreground sm:text-base">
            {result.why.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {result.priorities.length > 0 ? (
        <section aria-labelledby="planner-priorities-heading">
          <h3
            id="planner-priorities-heading"
            className="text-[0.8125rem] font-semibold uppercase tracking-[0.12em] text-subtle"
          >
            What deserves attention first
          </h3>
          <ul className="mt-4 space-y-4">
            {result.priorities.map((priority) => (
              <li key={priority.id} className="border-b border-border pb-4">
                <p className="text-[1rem] font-semibold text-foreground">
                  {priority.label}
                </p>
                <p className="mt-1 text-[0.9375rem] leading-relaxed text-muted">
                  {priority.reason}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {result.secondaryPaths.length > 0 ? (
        <section aria-labelledby="planner-secondary-paths-heading">
          <h3
            id="planner-secondary-paths-heading"
            className="text-[0.8125rem] font-semibold uppercase tracking-[0.12em] text-subtle"
          >
            Also part of the project
          </h3>
          <ul className="mt-4 space-y-3">
            {result.secondaryPaths.map((path) => (
              <li key={path}>
                <p className="font-display text-lg font-semibold tracking-tight text-foreground">
                  {PLANNER_PATH_META[path].title}
                </p>
                <p className="mt-1 text-[0.9375rem] leading-relaxed text-muted">
                  {PLANNER_PATH_META[path].explanation}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {result.relevantSolutions.length > 0 ? (
        <section aria-labelledby="planner-solutions-heading">
          <h3
            id="planner-solutions-heading"
            className="text-[0.8125rem] font-semibold uppercase tracking-[0.12em] text-subtle"
          >
            Relevant solutions
          </h3>
          <ul className="mt-4 space-y-2">
            {result.relevantSolutions.map((solution) => (
              <li key={solution.slug}>
                <Link
                  href={solution.href}
                  className="text-[0.9375rem] font-medium text-accent-text hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  {solution.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {result.relevantServices.length > 0 ? (
        <section aria-labelledby="planner-services-heading">
          <h3
            id="planner-services-heading"
            className="text-[0.8125rem] font-semibold uppercase tracking-[0.12em] text-subtle"
          >
            Services that may help
          </h3>
          <ul className="mt-4 space-y-2">
            {result.relevantServices.map((service) => (
              <li key={service.href}>
                <Link
                  href={service.href}
                  className="text-[0.9375rem] font-medium text-accent-text hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  {service.label}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {result.primaryResource ? (
        <section aria-labelledby="planner-primary-resource-heading">
          <h3
            id="planner-primary-resource-heading"
            className="text-[0.8125rem] font-semibold uppercase tracking-[0.12em] text-subtle"
          >
            Best next resource
          </h3>
          <div className="mt-4">
            <Link
              href={result.primaryResource.href}
              className="font-display text-xl font-semibold tracking-tight text-accent-text hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:text-2xl"
            >
              {result.primaryResource.label}
            </Link>
            <p className="mt-2 text-[0.9375rem] leading-relaxed text-muted">
              {result.primaryResource.reason}
            </p>
          </div>
        </section>
      ) : null}

      {result.secondaryResources.length > 0 ? (
        <section aria-labelledby="planner-secondary-resources-heading">
          <h3
            id="planner-secondary-resources-heading"
            className="text-[0.8125rem] font-semibold uppercase tracking-[0.12em] text-subtle"
          >
            Also useful
          </h3>
          <ul className="mt-4 space-y-2">
            {result.secondaryResources.map((resource) => (
              <li key={resource.href}>
                <Link
                  href={resource.href}
                  className="text-[0.9375rem] font-medium text-accent-text hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  {resource.label}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {result.cautions.length > 0 ? (
        <section aria-labelledby="planner-cautions-heading">
          <h3
            id="planner-cautions-heading"
            className="text-[0.8125rem] font-semibold uppercase tracking-[0.12em] text-subtle"
          >
            Things to keep in mind
          </h3>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-[0.9375rem] leading-relaxed text-muted sm:text-base">
            {result.cautions.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {result.showPricingLink ? (
        <p className="text-[0.9375rem] leading-relaxed text-muted">
          Want to understand what may affect the scope?{" "}
          <Link
            href="/pricing"
            className="font-semibold text-accent-text hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            Pricing &amp; Project Scope
          </Link>
        </p>
      ) : null}

      <section aria-labelledby="planner-answers-heading">
        <h3
          id="planner-answers-heading"
          className="text-[0.8125rem] font-semibold uppercase tracking-[0.12em] text-subtle"
        >
          Your Project Context
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
              Copy My Project Path
            </>
          )}
        </button>
        <button
          type="button"
          onClick={onEditAnswers}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-border bg-surface px-4 text-[0.9375rem] font-semibold text-foreground hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <Pencil className="h-4 w-4" aria-hidden />
          Edit Answers
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
          Ready to talk through the next step?
        </h3>
        <p className="mt-2 max-w-xl text-[0.9375rem] leading-relaxed text-muted">
          This planner is a starting point. A short conversation can confirm
          whether the path still holds once your site, content and constraints
          are in view.
        </p>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Link
            href={result.primaryCta.href}
            className={cn(
              "inline-flex h-11 items-center justify-center rounded-lg bg-cta px-5 text-[0.9375rem] font-semibold text-cta-foreground",
              "hover:bg-cta-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
            )}
          >
            {result.primaryCta.label}
          </Link>
          {result.secondaryCta ? (
            <Link
              href={result.secondaryCta.href}
              className={cn(
                "inline-flex h-11 items-center justify-center rounded-lg border border-border bg-surface px-5 text-[0.9375rem] font-semibold text-foreground",
                "hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
              )}
            >
              {result.secondaryCta.label}
            </Link>
          ) : null}
        </div>
      </section>
    </div>
  );
}
