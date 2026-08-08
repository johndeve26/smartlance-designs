import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import type { RelatedHref } from "@/data/site-relationships";
import { CTA_LABELS, SITE_ROUTES } from "@/lib/site-relationships";
import { cn } from "@/lib/utils";

type ConnectionListProps = {
  eyebrow: string;
  title: string;
  description?: string;
  items: RelatedHref[];
  className?: string;
};

/** Text-forward related links — not equal-weight orange buttons */
export function ConnectionList({
  eyebrow,
  title,
  description,
  items,
  className,
}: ConnectionListProps) {
  if (items.length === 0) return null;

  return (
    <div className={cn(className)}>
      <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-accent-text">
        {eyebrow}
      </p>
      <h2 className="mt-3 font-display text-xl font-semibold tracking-tight text-foreground sm:text-[1.375rem]">
        {title}
      </h2>
      {description ? (
        <p className="mt-2 max-w-2xl text-[0.9375rem] leading-relaxed text-muted sm:text-base">
          {description}
        </p>
      ) : null}
      <ul className="mt-5 space-y-3">
        {items.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="group inline-flex items-center gap-1.5 text-base font-semibold text-accent-text hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              {item.label}
              <ArrowRight
                className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
                aria-hidden
              />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ConnectionListSection(props: ConnectionListProps) {
  if (props.items.length === 0) return null;

  return (
    <Section className="!py-10 sm:!py-12">
      <Container>
        <ConnectionList {...props} />
      </Container>
    </Section>
  );
}

type SecondaryHelpersProps = {
  heading?: string;
  items: RelatedHref[];
};

/** Compact secondary helpers under forms / commercial endpoints */
export function SecondaryHelpers({
  heading = "Other useful next steps",
  items,
}: SecondaryHelpersProps) {
  if (items.length === 0) return null;

  return (
    <aside className="mt-10 border-t border-border pt-8">
      <p className="text-[0.8125rem] font-semibold uppercase tracking-[0.12em] text-subtle">
        {heading}
      </p>
      <ul className="mt-4 space-y-2.5">
        {items.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="text-[0.9375rem] font-medium text-accent-text hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  );
}

type PlatformDecisionLinksProps = {
  platformName: string;
  showSelector?: boolean;
  comparisonHref?: string;
  comparisonLabel?: string;
  commerceSolution?: boolean;
};

export function PlatformDecisionLinks({
  platformName,
  showSelector = true,
  comparisonHref,
  comparisonLabel = "WordPress vs Webflow",
  commerceSolution,
}: PlatformDecisionLinksProps) {
  const hasAny = showSelector || comparisonHref || commerceSolution;
  if (!hasAny) return null;

  return (
    <Section tone="muted" className="!py-10 sm:!py-12">
      <Container>
        <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-accent-text">
          Still deciding
        </p>
        <h2 className="mt-3 font-display text-xl font-semibold tracking-tight sm:text-[1.375rem]">
          Choosing between {platformName} and alternatives?
        </h2>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          {showSelector ? (
            <Button asChild variant="outline">
              <Link href={SITE_ROUTES.platformSelector}>
                {CTA_LABELS.platformSelector}
              </Link>
            </Button>
          ) : null}
          {comparisonHref ? (
            <Button asChild variant="outline">
              <Link href={comparisonHref}>{comparisonLabel}</Link>
            </Button>
          ) : null}
          {commerceSolution ? (
            <Button asChild variant="outline">
              <Link href="/solutions/ecommerce-growth">E-commerce Growth</Link>
            </Button>
          ) : null}
        </div>
      </Container>
    </Section>
  );
}
