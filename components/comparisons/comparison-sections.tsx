import Link from "next/link";
import { BlogMarkdown } from "@/components/blog/blog-markdown";
import { Container } from "@/components/ui/container";
import { FAQ } from "@/components/ui/faq";
import type { ComparisonContent } from "@/data/resource-content-types";
import { cn } from "@/lib/utils";

export function ComparisonQuickAnswer({
  comparison,
}: {
  comparison: ComparisonContent;
}) {
  return (
    <section className="border-b border-border bg-surface-muted">
      <Container className="py-10 sm:py-12">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-accent-text">
          Quick answer
        </p>
        <div className="prose-smartlance mt-4">
          <BlogMarkdown content={comparison.summary} />
        </div>
      </Container>
    </section>
  );
}

export function ComparisonQuickFit({
  comparison,
}: {
  comparison: ComparisonContent;
}) {
  return (
    <section>
      <h2
        id="quick-fit"
        className="scroll-mt-28 font-display text-[1.875rem] font-semibold leading-tight tracking-tight text-foreground sm:text-[2.125rem]"
      >
        {comparison.optionA} or {comparison.optionB} in 30 Seconds
      </h2>
      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        <QuickFitColumn
          label={`${comparison.optionA} may fit better when`}
          items={comparison.quickFitA}
        />
        <QuickFitColumn
          label={`${comparison.optionB} may fit better when`}
          items={comparison.quickFitB}
        />
      </div>
    </section>
  );
}

function QuickFitColumn({
  label,
  items,
}: {
  label: string;
  items: string[];
}) {
  return (
    <div className="rounded-xl border border-border bg-surface-muted p-5 sm:p-6">
      <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-accent-text">
        {label}
      </p>
      <ul className="mt-4 space-y-3">
        {items.map((item) => (
          <li
            key={item}
            className="flex gap-2.5 text-[0.9375rem] leading-relaxed text-foreground sm:text-base"
          >
            <span
              className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent"
              aria-hidden
            />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Stacked criteria on mobile; semantic table from md up */
export function ComparisonTable({
  comparison,
}: {
  comparison: ComparisonContent;
}) {
  const { optionA, optionB, comparisonCriteria } = comparison;

  return (
    <section>
      <h2
        id="quick-comparison-table"
        className="scroll-mt-28 font-display text-[1.875rem] font-semibold leading-tight tracking-tight text-foreground sm:text-[2.125rem]"
      >
        Quick Comparison
      </h2>
      <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted">
        High-level differences — not a scorecard. Requirements still decide the
        fit.
      </p>

      {/* Mobile: stacked rows */}
      <ul className="mt-8 space-y-4 md:hidden">
        {comparisonCriteria.map((row) => (
          <li
            key={row.id}
            className="rounded-xl border border-border bg-surface p-4"
          >
            <p className="text-sm font-semibold text-foreground">{row.label}</p>
            <div className="mt-3 space-y-3">
              <div>
                <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-accent-text">
                  {optionA}
                </p>
                <p className="mt-1 text-[0.9375rem] leading-relaxed text-muted">
                  {row.optionA}
                </p>
              </div>
              <div>
                <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-accent-text">
                  {optionB}
                </p>
                <p className="mt-1 text-[0.9375rem] leading-relaxed text-muted">
                  {row.optionB}
                </p>
              </div>
            </div>
          </li>
        ))}
      </ul>

      {/* Desktop/tablet table */}
      <div className="mt-8 hidden overflow-hidden rounded-xl border border-border md:block">
        <table className="w-full border-collapse text-left text-[0.9375rem] sm:text-base">
          <caption className="sr-only">
            Side-by-side comparison of {optionA} and {optionB} across platform
            criteria
          </caption>
          <thead className="bg-surface-muted">
            <tr>
              <th
                scope="col"
                className="border-b border-border px-4 py-3.5 font-semibold text-foreground sm:px-5"
              >
                Criterion
              </th>
              <th
                scope="col"
                className="border-b border-border px-4 py-3.5 font-semibold text-foreground sm:px-5"
              >
                {optionA}
              </th>
              <th
                scope="col"
                className="border-b border-border px-4 py-3.5 font-semibold text-foreground sm:px-5"
              >
                {optionB}
              </th>
            </tr>
          </thead>
          <tbody>
            {comparisonCriteria.map((row, index) => (
              <tr
                key={row.id}
                className={cn(index % 2 === 1 && "bg-surface-muted/50")}
              >
                <th
                  scope="row"
                  className="border-b border-border px-4 py-4 align-top font-semibold text-foreground sm:px-5"
                >
                  {row.label}
                </th>
                <td className="border-b border-border px-4 py-4 align-top leading-relaxed text-muted sm:px-5">
                  {row.optionA}
                </td>
                <td className="border-b border-border px-4 py-4 align-top leading-relaxed text-muted sm:px-5">
                  {row.optionB}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function ComparisonDecisionMatrix({
  comparison,
}: {
  comparison: ComparisonContent;
}) {
  return (
    <section>
      <h2
        id="decision-matrix"
        className="scroll-mt-28 font-display text-[1.875rem] font-semibold leading-tight tracking-tight text-foreground sm:text-[2.125rem]"
      >
        Detailed Decision Matrix
      </h2>
      <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted">
        Use the note on each criterion to connect the trade-off to your project
        — not as a score.
      </p>

      <ul className="mt-8 space-y-4">
        {comparison.decisionMatrix.map((row) => (
          <li
            key={row.id}
            className="rounded-xl border border-border bg-surface p-5 sm:p-6"
          >
            <p className="font-display text-lg font-semibold text-foreground sm:text-xl">
              {row.label}
            </p>
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <div>
                <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-accent-text">
                  {comparison.optionA}
                </p>
                <p className="mt-1.5 text-[0.9375rem] leading-relaxed text-muted sm:text-base">
                  {row.optionA}
                </p>
              </div>
              <div>
                <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-accent-text">
                  {comparison.optionB}
                </p>
                <p className="mt-1.5 text-[0.9375rem] leading-relaxed text-muted sm:text-base">
                  {row.optionB}
                </p>
              </div>
            </div>
            <p className="mt-4 border-t border-border pt-4 text-[0.9375rem] leading-relaxed text-foreground sm:text-base">
              <span className="font-semibold">Decision note: </span>
              {row.note}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function ComparisonBestFit({
  comparison,
}: {
  comparison: ComparisonContent;
}) {
  return (
    <section className="grid gap-8 lg:grid-cols-2">
      <div>
        <h2
          id="wordpress-may-fit"
          className="scroll-mt-28 font-display text-[1.5rem] font-semibold leading-snug tracking-tight text-foreground sm:text-[1.75rem]"
        >
          {comparison.optionA} May Be the Better Fit When…
        </h2>
        <ul className="mt-5 space-y-3">
          {comparison.bestForA.map((item) => (
            <li
              key={item}
              className="flex gap-2.5 text-[0.9375rem] leading-relaxed text-muted sm:text-base"
            >
              <span
                className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent"
                aria-hidden
              />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h2
          id="webflow-may-fit"
          className="scroll-mt-28 font-display text-[1.5rem] font-semibold leading-snug tracking-tight text-foreground sm:text-[1.75rem]"
        >
          {comparison.optionB} May Be the Better Fit When…
        </h2>
        <ul className="mt-5 space-y-3">
          {comparison.bestForB.map((item) => (
            <li
              key={item}
              className="flex gap-2.5 text-[0.9375rem] leading-relaxed text-muted sm:text-base"
            >
              <span
                className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent"
                aria-hidden
              />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function ComparisonDecisionQuestions({
  comparison,
}: {
  comparison: ComparisonContent;
}) {
  return (
    <section>
      <h2
        id="decision-questions"
        className="scroll-mt-28 font-display text-[1.875rem] font-semibold leading-tight tracking-tight text-foreground sm:text-[2.125rem]"
      >
        Ask These Questions Before Choosing
      </h2>
      <ol className="mt-8 space-y-4">
        {comparison.decisionQuestions.map((question, index) => (
          <li
            key={question}
            className="flex gap-4 border-b border-border pb-4 last:border-b-0"
          >
            <span className="font-display text-sm font-semibold tabular-nums text-accent-text">
              {String(index + 1).padStart(2, "0")}
            </span>
            <span className="text-base leading-relaxed text-foreground sm:text-[1.0625rem]">
              {question}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function ComparisonSections({
  comparison,
}: {
  comparison: ComparisonContent;
}) {
  return (
    <div className="prose-smartlance space-y-2">
      {comparison.sections.map((section) => (
        <section key={section.id}>
          <h2 id={section.id} className="scroll-mt-28">
            {section.title}
          </h2>
          <BlogMarkdown content={section.body} />
        </section>
      ))}
    </div>
  );
}

export function ComparisonPrinciple() {
  return (
    <aside className="rounded-xl bg-surface-dark px-6 py-8 text-white sm:px-8 sm:py-10">
      <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-accent">
        Principle
      </p>
      <h2 className="mt-3 font-display text-[1.5rem] font-semibold leading-snug tracking-tight sm:text-[1.75rem]">
        The Platform Sets Constraints. The Implementation Determines Much of the
        Outcome.
      </h2>
      <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/75 sm:text-[1.0625rem]">
        A capable platform with poor structure, content, performance work or
        maintenance can still produce a weak website. Choose carefully — then
        implement carefully.
      </p>
    </aside>
  );
}

export function ComparisonPlatformLinks({
  optionAHref,
  optionBHref,
  optionA,
  optionB,
}: {
  optionA: string;
  optionB: string;
  optionAHref: string;
  optionBHref: string;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Link
        href={optionAHref}
        className="rounded-xl border border-border bg-surface-muted px-5 py-4 font-semibold text-foreground transition-colors hover:border-accent/40 hover:text-accent-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        Explore {optionA} →
      </Link>
      <Link
        href={optionBHref}
        className="rounded-xl border border-border bg-surface-muted px-5 py-4 font-semibold text-foreground transition-colors hover:border-accent/40 hover:text-accent-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        Explore {optionB} →
      </Link>
    </div>
  );
}

export function ComparisonFaq({
  comparison,
}: {
  comparison: ComparisonContent;
}) {
  if (!comparison.faqs?.length) return null;
  return (
    <section>
      <h2
        id="faq"
        className="scroll-mt-28 font-display text-[1.875rem] font-semibold leading-tight tracking-tight text-foreground sm:text-[2.125rem]"
      >
        Frequently Asked Questions
      </h2>
      <div className="mt-8">
        <FAQ
          items={comparison.faqs.map((faq) => ({
            question: faq.question,
            answer: faq.answer,
          }))}
        />
      </div>
    </section>
  );
}
