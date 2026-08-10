import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { PortfolioScreenshot } from "@/components/ui/site-image";
import type { Project } from "@/types";

export type HomeHeroProps = {
  eyebrow: string;
  headline: string;
  headlineAccent?: string | null;
  supporting: string;
  primaryCtaLabel: string;
  primaryCtaHref: string;
  secondaryCtaLabel: string;
  secondaryCtaHref: string;
  heroProject?: Project | null;
};

function renderHeadline(headline: string, accent?: string | null) {
  if (!accent || !headline.includes(accent)) {
    return headline;
  }
  const index = headline.indexOf(accent);
  const before = headline.slice(0, index);
  const after = headline.slice(index + accent.length);
  return (
    <>
      {before}
      <span className="text-accent-text">{accent}</span>
      {after}
    </>
  );
}

export function HomeHero({
  eyebrow,
  headline,
  headlineAccent,
  supporting,
  primaryCtaLabel,
  primaryCtaHref,
  secondaryCtaLabel,
  secondaryCtaHref,
  heroProject,
}: HomeHeroProps) {
  const showcase = heroProject ?? undefined;
  const imageSrc = showcase?.heroImage || showcase?.image;

  return (
    <section className="relative overflow-hidden bg-surface">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_100%_0%,var(--orange-50)_0%,transparent_60%)]"
        aria-hidden
      />

      <Container className="relative grid items-center gap-12 pb-16 pt-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-14 lg:pb-24 lg:pt-20 xl:gap-20">
        <div className="min-w-0">
          <p className="eyebrow">{eyebrow}</p>
          <h1 className="heading-hero mt-4 max-w-[16ch] font-display font-semibold tracking-tight sm:max-w-[18ch]">
            {renderHeadline(headline, headlineAccent)}
          </h1>
          <p className="mt-6 max-w-[38ch] text-[1.0625rem] leading-[1.6] text-muted sm:text-[1.1875rem]">
            {supporting}
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button asChild size="lg">
              <Link href={primaryCtaHref}>{primaryCtaLabel}</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href={secondaryCtaHref}>{secondaryCtaLabel}</Link>
            </Button>
          </div>
          <p className="mt-5">
            <Link href="/work" className="link-action text-[0.9375rem]">
              See our work →
            </Link>
          </p>
        </div>

        {imageSrc && showcase ? (
          <figure className="relative min-w-0">
            {/* Thin accent rule anchors the image to the editorial grid */}
            <span
              className="absolute -left-4 top-0 hidden h-16 w-px bg-accent lg:block"
              aria-hidden
            />
            <PortfolioScreenshot
              src={imageSrc}
              alt={
                showcase.heroImageAlt ||
                showcase.imageAlt ||
                `${showcase.name} website designed and built by Smartlance Designs`
              }
              priority
              sizes="(max-width: 1023px) 100vw, 1280px"
              maxWidthClassName="max-w-[1280px]"
              frameClassName="border border-border shadow-md"
            />
            <figcaption className="mt-4 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 border-t border-border pt-4">
              <span className="text-meta">
                <span className="text-[0.8125rem] font-semibold uppercase tracking-[0.12em] text-muted">
                  Recent project
                </span>
                <span aria-hidden> · </span>
                <span className="font-semibold text-foreground">
                  {showcase.name}
                </span>
              </span>
              <Link
                href={`/work/${showcase.slug}`}
                className="link-action group"
              >
                View Project
                <ArrowUpRight
                  className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 motion-reduce:transition-none"
                  aria-hidden
                />
              </Link>
            </figcaption>
          </figure>
        ) : null}
      </Container>
    </section>
  );
}
