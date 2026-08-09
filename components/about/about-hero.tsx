import { SiteImage } from "@/components/ui/site-image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Button } from "@/components/ui/button";
import { BrowserFrame } from "@/components/work/case-study/case-study-hero";
import {
  aboutCapabilities,
  aboutSnapshot,
} from "@/data/about";
import { siteConfig } from "@/lib/site";
import type { Project } from "@/types";
import { cn } from "@/lib/utils";

type AboutHeroProps = {
  projects: Project[];
};

export function AboutHero({ projects }: AboutHeroProps) {
  return (
    <section className="border-b border-border bg-surface-muted">
      <Container className="!pt-10 !pb-12 sm:!pb-14 lg:!pb-16">
        <Breadcrumbs
          items={[{ label: "Home", href: "/" }, { label: "About" }]}
        />

        <div className="mt-8 grid items-center gap-10 lg:grid-cols-[minmax(0,0.52fr)_minmax(0,0.48fr)] lg:gap-12 xl:gap-14">
          <div className="min-w-0">
            <p className="eyebrow">About Smartlance</p>
            <h1 className="mt-4 max-w-xl font-display text-[clamp(2.75rem,5vw,5rem)] font-semibold leading-[1.05] tracking-tight text-foreground">
              We Build Websites Around What Businesses Actually Need.
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted sm:text-xl">
              {siteConfig.name} is a website, SEO and digital-growth agency
              helping businesses build clearer, faster and more discoverable
              online experiences — with {siteConfig.experienceClaim.toLowerCase()}.
            </p>

            <ul className="mt-6 flex flex-wrap gap-x-3 gap-y-2">
              {aboutCapabilities.map((item) => (
                <li
                  key={item}
                  className="rounded-full border border-border bg-surface px-3 py-1 text-sm font-medium text-foreground"
                >
                  {item}
                </li>
              ))}
            </ul>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/contact">Tell Us About Your Project</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/work">View Our Work</Link>
              </Button>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-lg lg:max-w-none">
            <AboutWorkCollage
              primary={projects[0]}
              secondary={projects[2] || projects[1]}
              tertiary={projects[1]}
            />
          </div>
        </div>

        <dl className="mt-12 grid gap-6 border-t border-border pt-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          {aboutSnapshot.map((item) => (
            <div key={item.label}>
              <dt className="text-[0.8125rem] font-semibold uppercase tracking-[0.12em] text-subtle">
                {item.label}
              </dt>
              <dd className="mt-2 font-display text-xl font-semibold text-foreground sm:text-[1.375rem]">
                {item.value}
              </dd>
            </div>
          ))}
        </dl>
      </Container>
    </section>
  );
}

function AboutWorkCollage({
  primary,
  secondary,
  tertiary,
}: {
  primary?: Project;
  secondary?: Project;
  tertiary?: Project;
}) {
  if (!primary?.image && !primary?.heroImage) {
    return (
      <div className="aspect-[4/3] rounded-2xl border border-border bg-surface" />
    );
  }

  const primarySrc = primary.heroImage || primary.image;
  const secondarySrc = secondary?.heroImage || secondary?.image;
  const tertiarySrc = tertiary?.heroImage || tertiary?.image;

  return (
    <div className="relative aspect-[5/4] sm:aspect-[4/3]">
      <div className="absolute inset-x-[8%] top-0 z-10 sm:inset-x-[6%]">
        <BrowserFrame className="shadow-lg ring-1 ring-black/5">
          <div className="relative aspect-[16/10] overflow-hidden bg-surface-muted">
            {primarySrc ? (
              <SiteImage
                src={primarySrc}
                alt={primary.imageAlt || `${primary.name} website`}
                fill
                priority
                className="object-cover object-top"
                sizes="(max-width: 1024px) 90vw, 42vw"
              />
            ) : null}
          </div>
        </BrowserFrame>
      </div>

      {secondarySrc ? (
        <div className="absolute bottom-[6%] left-0 z-20 w-[42%] max-w-[11rem] sm:bottom-[4%] sm:max-w-[12.5rem]">
          <div className="overflow-hidden rounded-[1.1rem] border-[3px] border-foreground bg-foreground shadow-xl">
            <div className="mx-auto mt-1.5 h-1 w-8 rounded-full bg-white/25" />
            <div className="relative m-1 aspect-[9/16] overflow-hidden rounded-[0.85rem] bg-surface-muted">
              <SiteImage
                src={secondarySrc}
                alt={secondary?.imageAlt || `${secondary?.name} mobile view`}
                fill
                className="object-cover object-top"
                sizes="180px"
              />
            </div>
          </div>
        </div>
      ) : null}

      {tertiarySrc ? (
        <div
          className={cn(
            "absolute bottom-0 right-0 z-0 w-[58%] max-w-[16rem] sm:max-w-[18rem]",
            "translate-y-2 rotate-[-2deg]",
          )}
        >
          <BrowserFrame className="opacity-95 shadow-md">
            <div className="relative aspect-[16/11] overflow-hidden bg-surface-muted">
              <SiteImage
                src={tertiarySrc}
                alt={tertiary?.imageAlt || `${tertiary?.name} website`}
                fill
                className="object-cover object-top"
                sizes="280px"
              />
            </div>
          </BrowserFrame>
        </div>
      ) : null}

      <Link
        href="/work"
        className="absolute bottom-3 right-3 z-30 inline-flex items-center gap-1.5 rounded-full bg-surface px-3 py-1.5 text-sm font-semibold text-accent-text shadow-sm ring-1 ring-border hover:underline"
      >
        View work
        <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}
