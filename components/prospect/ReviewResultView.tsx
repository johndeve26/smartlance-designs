"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import type { ProspectReviewDetailDto, ProspectReviewFindingDto } from "@/lib/prospect/dto";
import { REVIEW_CATEGORIES } from "@/lib/prospect/constants";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Skeleton, SkeletonCard } from "@/components/ui/skeleton";
import { SemanticBadge } from "@/components/ui/status-badge";
import { formatDateTime } from "@/lib/ui/format";
import { cn } from "@/lib/utils";

const STAGE_LABELS: Record<string, string> = {
  PENDING: "Checking your website",
  FETCHING: "Reviewing key pages",
  ANALYZING: "Looking at structure and messaging",
  COMPLETED: "Ready",
  FAILED: "Could not complete",
};

const STAGE_ORDER = ["PENDING", "FETCHING", "ANALYZING"] as const;

function CheckAnotherWebsiteLink({ className }: { className?: string }) {
  return (
    <Link
      href="/free-website-review"
      className={cn("link-action text-[0.9375rem]", className)}
    >
      Check another website →
    </Link>
  );
}

function ReviewGenerationState({ review }: { review: ProspectReviewDetailDto }) {
  const stageIndex = STAGE_ORDER.indexOf(review.status as (typeof STAGE_ORDER)[number]);

  return (
    <div className="rounded-lg border border-border bg-surface p-6 sm:p-8">
      <p className="text-section-heading">{STAGE_LABELS[review.status] ?? "Working…"}</p>
      <p className="mt-1 text-body-sm">{review.normalizedDomain}</p>

      <ol className="mt-6 space-y-2">
        {STAGE_ORDER.map((stage, i) => {
          const done = stageIndex > i;
          const active = review.status === stage;
          return (
            <li
              key={stage}
              className={cn(
                "flex items-center gap-3 text-sm",
                done ? "text-muted" : active ? "font-medium text-foreground" : "text-subtle",
              )}
            >
              <span
                className={cn(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs",
                  done
                    ? "bg-success-soft text-success"
                    : active
                      ? "bg-brand-soft text-accent-text"
                      : "bg-surface-muted text-subtle",
                )}
                aria-hidden
              >
                {done ? "✓" : i + 1}
              </span>
              {STAGE_LABELS[stage]}
            </li>
          );
        })}
      </ol>

      <div className="mt-8 space-y-3">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>
    </div>
  );
}

function PriorityCard({ finding }: { finding: ProspectReviewFindingDto }) {
  return (
    <article className="rounded-lg border border-border bg-surface p-4 sm:p-5">
      <div className="flex flex-wrap items-center gap-2">
        <SemanticBadge tone="warning">{finding.severity.replace(/_/g, " ")}</SemanticBadge>
        <span className="text-xs text-subtle">{finding.category}</span>
      </div>
      <h3 className="mt-3 text-card-title">{finding.title}</h3>
      <p className="mt-2 text-body-sm">{finding.explanation}</p>
      {finding.recommendation ? (
        <div className="mt-3 rounded-md bg-surface-muted px-3 py-2 text-sm">
          <span className="font-medium text-foreground">What to consider: </span>
          <span className="text-muted">{finding.recommendation}</span>
        </div>
      ) : null}
    </article>
  );
}

function FindingRow({
  finding,
  defaultOpen,
}: {
  finding: ProspectReviewFindingDto;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen ?? false);

  return (
    <div className="border-b border-border last:border-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-start justify-between gap-3 py-3 text-left"
        aria-expanded={open}
      >
        <div className="min-w-0">
          <p className="font-medium text-foreground">{finding.title}</p>
          <p className="mt-0.5 text-xs text-subtle">{finding.severity.replace(/_/g, " ")}</p>
        </div>
        <ChevronDown
          className={cn("mt-1 h-4 w-4 shrink-0 text-subtle transition-transform", open && "rotate-180")}
          aria-hidden
        />
      </button>
      {open ? (
        <div className="pb-4 pl-0 text-sm text-muted">
          <p>{finding.explanation}</p>
          {finding.recommendation ? (
            <p className="mt-2">
              <span className="font-medium text-foreground">Consider: </span>
              {finding.recommendation}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function ReviewCtaBlock({ reviewId }: { reviewId: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface-muted p-5 sm:p-6">
      <h2 className="text-section-heading">Planning a redesign?</h2>
      <p className="mt-1 text-body-sm">
        Turn these priorities into a structured project brief or tell Smartlance about your project.
      </p>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <Button asChild>
          <Link href={`/website-brief?reviewId=${reviewId}`}>Build a website brief</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href={`/workspace/login?saveReview=${reviewId}`}>Save this review</Link>
        </Button>
      </div>
      <p className="mt-4 text-xs text-subtle">
        <Link href="/contact" className="font-medium text-accent-text hover:underline">
          Tell us about your project
        </Link>{" "}
        if you would like Smartlance to help directly.
      </p>
    </div>
  );
}

export function ReviewResultView({ reviewId }: { reviewId: string }) {
  const [review, setReview] = useState<ProspectReviewDetailDto | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function poll() {
      try {
        const res = await fetch(`/api/prospect/reviews/${reviewId}`);
        if (!res.ok) {
          if (active) setError("Review not found.");
          return;
        }
        const data = (await res.json()) as ProspectReviewDetailDto;
        if (active) {
          setReview(data);
          if (data.status !== "COMPLETED" && data.status !== "FAILED") {
            setTimeout(poll, 2000);
          }
        }
      } catch {
        if (active) setError("Could not load review.");
      }
    }
    void poll();
    return () => {
      active = false;
    };
  }, [reviewId]);

  const findingsByCategory = useMemo(() => {
    if (!review) return new Map<string, ProspectReviewFindingDto[]>();
    const nonStrength = review.findings.filter((f) => !f.isStrength && !f.isPriority);
    const map = new Map<string, ProspectReviewFindingDto[]>();
    for (const cat of REVIEW_CATEGORIES) {
      const items = nonStrength.filter((f) => f.category === cat);
      if (items.length) map.set(cat, items);
    }
    const other = nonStrength.filter(
      (f) => !REVIEW_CATEGORIES.includes(f.category as (typeof REVIEW_CATEGORIES)[number]),
    );
    if (other.length) map.set("Other", other);
    return map;
  }, [review]);

  if (error) {
    return (
      <Alert tone="error">
        {error}{" "}
        <CheckAnotherWebsiteLink className="font-medium underline" />
      </Alert>
    );
  }

  if (!review) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-1/2" />
        <SkeletonCard />
      </div>
    );
  }

  if (review.status !== "COMPLETED" && review.status !== "FAILED") {
    return <ReviewGenerationState review={review} />;
  }

  if (review.status === "FAILED") {
    return (
      <div className="space-y-6">
        <header>
          <p className="text-xs font-semibold uppercase tracking-wide text-accent-text">
            Website review
          </p>
          <h1 className="mt-2 text-page-title">{review.normalizedDomain}</h1>
        </header>
        <Alert tone="warning" title="We couldn't complete the full review">
          {review.aiFailedMessage ??
            "Something prevented us from finishing the analysis. You can try again with a different URL."}
        </Alert>
        {review.findings.length > 0 ? (
          <section>
            <h2 className="text-section-heading">What we could determine</h2>
            <div className="mt-3 rounded-lg border border-border bg-surface px-4">
              {review.findings.slice(0, 8).map((f) => (
                <FindingRow key={f.id} finding={f} defaultOpen />
              ))}
            </div>
          </section>
        ) : null}
        <Button asChild variant="outline">
          <Link href="/free-website-review">Check another website</Link>
        </Button>
      </div>
    );
  }

  const topPriorities = review.priorities.slice(0, 5);
  const reviewedOn = review.reviewedOn ?? review.createdAt;
  const reviewedAt = formatDateTime(reviewedOn);
  const evidenceOnly =
    Boolean(review.aiFailedMessage) &&
    !review.summary &&
    topPriorities.length === 0 &&
    review.findings.length === 0;

  return (
    <div className="space-y-10">
      <header>
        <p className="text-xs font-semibold uppercase tracking-wide text-accent-text">
          Website review
        </p>
        <h1 className="mt-2 text-page-title">{review.normalizedDomain}</h1>
        {review.overallDirectionLabel && !review.aiFailedMessage ? (
          <p className="mt-2 text-lg font-medium text-foreground">
            {review.overallDirectionLabel}
          </p>
        ) : evidenceOnly ? (
          <p className="mt-2 text-lg font-medium text-foreground">
            Automated website checks
          </p>
        ) : null}
        <p className="mt-1 text-sm text-subtle">
          Reviewed{" "}
          <time dateTime={reviewedOn}>{reviewedAt}</time>
        </p>
        <p className="mt-3">
          <CheckAnotherWebsiteLink />
        </p>
      </header>

      {review.aiFailedMessage ? (
        <Alert tone="warning">{review.aiFailedMessage}</Alert>
      ) : null}

      {review.summary ? (
        <section>
          <h2 className="sr-only">Summary</h2>
          <p className="text-body-sm leading-relaxed">{review.summary}</p>
        </section>
      ) : null}

      {topPriorities.length > 0 ? (
        <section>
          <h2 className="text-section-heading">Top priorities</h2>
          <p className="mt-1 text-body-sm">Start here for the biggest impact.</p>
          <ul className="mt-4 space-y-3">
            {topPriorities.map((f) => (
              <li key={f.id}>
                <PriorityCard finding={f} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {review.strengths.length > 0 ? (
        <section>
          <h2 className="text-section-heading">What&apos;s working</h2>
          <ul className="mt-4 space-y-3">
            {review.strengths.map((s) => (
              <li
                key={s.id}
                className="rounded-lg border border-success/20 bg-success-soft/30 p-4"
              >
                <p className="font-medium text-foreground">{s.title}</p>
                <p className="mt-1 text-body-sm">{s.explanation}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {findingsByCategory.size > 0 ? (
        <section>
          <h2 className="text-section-heading">Detailed findings</h2>
          <div className="mt-4 space-y-6">
            {[...findingsByCategory.entries()].map(([category, items]) => (
              <div key={category}>
                <h3 className="text-sm font-semibold text-foreground">{category}</h3>
                <div className="mt-2 rounded-lg border border-border bg-surface px-4">
                  {items.map((f) => (
                    <FindingRow key={f.id} finding={f} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {review.evidence.length > 0 ? (
        evidenceOnly ? (
          <section>
            <h2 className="text-section-heading">What we checked</h2>
            <p className="mt-1 text-body-sm">
              These observations come from automated checks on the pages we reviewed.
            </p>
            <ul className="mt-4 divide-y divide-border rounded-lg border border-border bg-surface px-4">
              {review.evidence.map((ev) => (
                <li key={ev.id} className="py-3 text-sm">
                  <span className="font-medium text-foreground">{ev.label}</span>
                  {ev.valueText ? (
                    <span className="text-muted"> — {ev.valueText}</span>
                  ) : null}
                  {ev.sourceUrl ? (
                    <span className="mt-0.5 block text-xs text-subtle">{ev.sourceUrl}</span>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>
        ) : (
          <details className="rounded-lg border border-border bg-surface px-4 py-3">
            <summary className="cursor-pointer text-sm font-medium text-foreground">
              View evidence ({review.evidence.length} observations)
            </summary>
            <ul className="mt-3 space-y-2 border-t border-border pt-3">
              {review.evidence.map((ev) => (
                <li key={ev.id} className="text-sm">
                  <span className="font-medium text-foreground">{ev.label}</span>
                  {ev.valueText ? (
                    <span className="text-muted"> — {ev.valueText}</span>
                  ) : null}
                  {ev.sourceUrl ? (
                    <span className="block text-xs text-subtle">{ev.sourceUrl}</span>
                  ) : null}
                </li>
              ))}
            </ul>
          </details>
        )
      ) : null}

      {topPriorities.length > 0 ? (
        <section>
          <h2 className="text-section-heading">What to work on first</h2>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-body-sm">
            {topPriorities.map((f) => (
              <li key={f.id}>{f.title}</li>
            ))}
          </ol>
        </section>
      ) : null}

      <ReviewCtaBlock reviewId={reviewId} />

      <p className="text-xs leading-relaxed text-subtle">
        This review combines automated checks with evidence-grounded AI analysis of
        the pages reviewed. It is not a manual audit by Smartlance staff unless
        separately arranged.
      </p>
    </div>
  );
}
