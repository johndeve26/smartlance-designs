import type { ReactNode } from "react";
import Image from "next/image";
import type {
  ProductFeatureSection,
  ProjectCaseStudyPoint,
  ProjectEngineeringStack,
  ProjectGalleryItem,
} from "@/types";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { BrowserFrame } from "@/components/work/case-study/case-study-hero";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function CaseStudyIntro({
  statement,
  overview,
  heading,
}: {
  statement?: string;
  overview: string;
  heading?: string;
}) {
  if (!heading && !statement && !overview) return null;

  const title = heading || statement;

  return (
    <Section className="!py-14 sm:!py-16 lg:!py-[4.5rem]">
      <Container>
        <div className="grid gap-10 lg:grid-cols-[minmax(0,0.45fr)_minmax(0,0.55fr)] lg:gap-16 xl:gap-20">
          <div>
            <p className="eyebrow">The project</p>
            {title ? (
              <h2 className="mt-4 max-w-md font-display text-[1.875rem] font-semibold leading-tight sm:text-4xl lg:text-[2.75rem]">
                {title}
              </h2>
            ) : null}
          </div>
          {overview ? (
            <div className="max-w-xl space-y-5 text-[1.0625rem] leading-[1.75] text-muted sm:text-lg">
              {overview.split(/(?<=\.)\s+(?=[A-Z])/).map((paragraph) => (
                <p key={paragraph.slice(0, 40)}>{paragraph}</p>
              ))}
            </div>
          ) : null}
        </div>
      </Container>
    </Section>
  );
}

export function CaseStudyChallenge({
  items,
  heading = "Making the business clearer online.",
}: {
  items: ProjectCaseStudyPoint[];
  heading?: string;
}) {
  if (!items.length) return null;

  return (
    <Section tone="muted" className="!py-14 sm:!py-16 lg:!py-[4.5rem]">
      <Container>
        <div className="grid gap-10 lg:grid-cols-[minmax(0,0.36fr)_minmax(0,0.64fr)] lg:gap-16 xl:gap-20">
          <div>
            <p className="eyebrow">The challenge</p>
            <h2 className="mt-4 font-display text-[1.875rem] font-semibold leading-tight sm:text-4xl">
              {heading}
            </h2>
          </div>
          <ul className="border-t border-border">
            {items.map((item, index) => (
              <li
                key={item.title}
                className="grid gap-3 border-b border-border py-7 sm:grid-cols-[5rem_minmax(0,1fr)] sm:gap-7 sm:py-8"
              >
                <span className="font-display text-3xl font-semibold tabular-nums text-accent-text sm:text-4xl">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3 className="font-display text-xl font-semibold sm:text-2xl">
                    {item.title}
                  </h3>
                  <p className="mt-2.5 text-[1.0625rem] leading-relaxed text-muted sm:text-lg">
                    {item.description}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </Section>
  );
}

export function CaseStudyApproach({
  items,
  heading = "How we approached the work",
}: {
  items: ProjectCaseStudyPoint[];
  heading?: string;
}) {
  if (!items.length) return null;

  const fourUp = items.length === 4;

  return (
    <Section className="!py-14 sm:!py-16 lg:!py-[4.5rem]">
      <Container>
        <div className="max-w-2xl">
          <p className="eyebrow">Our approach</p>
          <h2 className="mt-4 font-display text-[1.875rem] font-semibold sm:text-4xl">
            {heading}
          </h2>
        </div>
        <ol
          className={cn(
            "mt-12 grid gap-x-8 gap-y-10",
            fourUp
              ? "sm:grid-cols-2 xl:grid-cols-4"
              : "sm:grid-cols-2 lg:grid-cols-3",
          )}
        >
          {items.map((item, index) => (
            <li key={item.title} className="border-t-2 border-accent/50 pt-5">
              <span className="font-display text-lg font-semibold tabular-nums text-accent-text sm:text-xl">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-4 font-display text-xl font-semibold sm:text-[1.375rem]">
                {item.title}
              </h3>
              <p className="mt-3 text-[1.0625rem] leading-relaxed text-muted sm:text-lg">
                {item.description}
              </p>
            </li>
          ))}
        </ol>
      </Container>
    </Section>
  );
}

export function CaseStudySolution({
  summary,
  items,
  visual,
  heading = "What we designed, built and improved",
}: {
  summary?: string;
  items: ProjectCaseStudyPoint[];
  visual?: { src: string; alt: string };
  heading?: string;
}) {
  if (!summary && !items.length) return null;

  return (
    <Section tone="muted" className="!py-14 sm:!py-16 lg:!py-[4.5rem]">
      <Container>
        <div className="grid gap-10 lg:grid-cols-[minmax(0,0.38fr)_minmax(0,0.62fr)] lg:gap-16">
          <div>
            <p className="eyebrow">The solution</p>
            <h2 className="mt-4 font-display text-[1.875rem] font-semibold leading-tight sm:text-4xl">
              {heading}
            </h2>
          </div>
          {summary ? (
            <p className="max-w-xl text-[1.0625rem] leading-[1.75] text-muted sm:text-lg">
              {summary}
            </p>
          ) : null}
        </div>

        {items.length > 0 ? (
          <ul className="mt-12 grid gap-0 border-t border-border sm:grid-cols-2">
            {items.map((item, index) => (
              <li
                key={item.title}
                className="border-b border-border py-8 sm:odd:border-r sm:px-8 sm:odd:pl-0 sm:even:pr-0"
              >
                <span className="font-display text-lg font-semibold tabular-nums text-accent-text">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-3.5 font-display text-xl font-semibold sm:text-2xl">
                  {item.title}
                </h3>
                <p className="mt-3 text-[1.0625rem] leading-relaxed text-muted sm:text-lg">
                  {item.description}
                </p>
              </li>
            ))}
          </ul>
        ) : null}

        {visual ? (
          <div className="mt-14 sm:mt-16">
            <BrowserFrame className="shadow-md">
              <div className="relative aspect-[16/9] overflow-hidden bg-surface-muted">
                <Image
                  src={visual.src}
                  alt={visual.alt}
                  fill
                  className="object-cover object-top"
                  sizes="(max-width: 1280px) 100vw, 1200px"
                />
              </div>
            </BrowserFrame>
          </div>
        ) : null}
      </Container>
    </Section>
  );
}

export function CaseStudyHighlights({ items }: { items: string[] }) {
  if (!items.length) return null;

  return (
    <Section className="!py-10 sm:!py-12">
      <Container>
        <p className="eyebrow">Project highlights</p>
        <ul className="mt-7 flex flex-wrap gap-x-10 gap-y-4">
          {items.map((item) => (
            <li
              key={item}
              className="flex items-center gap-3 text-[1.0625rem] font-medium text-foreground sm:text-lg"
            >
              <span className="h-2 w-2 shrink-0 rounded-full bg-accent" />
              {item}
            </li>
          ))}
        </ul>
      </Container>
    </Section>
  );
}

export function CaseStudyOutcome({
  heading,
  summary,
  items,
}: {
  heading: string;
  summary?: string;
  items: string[];
}) {
  if (!summary && !items.length) return null;

  return (
    <Section tone="muted" className="!py-14 sm:!py-16 lg:!py-[4.5rem]">
      <Container>
        <div className="grid gap-10 lg:grid-cols-[minmax(0,0.36fr)_minmax(0,0.64fr)] lg:gap-16 xl:gap-20">
          <div>
            <p className="eyebrow">Outcome</p>
            <h2 className="mt-4 font-display text-[1.875rem] font-semibold sm:text-4xl">
              {heading}
            </h2>
            {summary ? (
              <p className="mt-5 max-w-sm text-[1.0625rem] leading-relaxed text-muted sm:text-lg lg:mt-6">
                {summary}
              </p>
            ) : null}
          </div>
          {items.length > 0 ? (
            <ul className="border-t border-border">
              {items.map((item) => {
                const parsed = splitOutcome(item);
                return (
                  <li
                    key={item}
                    className="border-b border-border py-6 sm:py-7"
                  >
                    <p className="font-display text-xl font-semibold leading-snug text-foreground sm:text-2xl">
                      {parsed.title}
                    </p>
                    {parsed.description ? (
                      <p className="mt-2 text-[1.0625rem] leading-relaxed text-muted sm:text-lg">
                        {parsed.description}
                      </p>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          ) : null}
        </div>
      </Container>
    </Section>
  );
}

/** Turn compact result strings into scannable titles without inventing claims */
function splitOutcome(item: string): { title: string; description?: string } {
  const text = item.trim();
  const colon = text.indexOf(": ");
  if (colon > 0 && colon < 48) {
    return {
      title: text.slice(0, colon),
      description: text.slice(colon + 2),
    };
  }

  const titles: Record<string, string> = {
    "Full website designed and developed on WordPress":
      "WordPress website delivered",
    "Website redesigned and developed on WordPress":
      "WordPress website refresh delivered",
    "Website redesigned and rebuilt on WordPress":
      "WordPress website rebuilt",
    "Full website redesigned on WordPress": "WordPress redesign delivered",
    "Website designed and developed on WordPress":
      "WordPress website delivered",
    "Property listings and booking pathways implemented":
      "Property listings and booking pathways",
    "Property listing presentation improved":
      "Improved property presentation",
    "Property presentation improved": "Improved property presentation",
    "Cabin presentation improved": "Improved cabin presentation",
    "Interactive property presentation implemented":
      "Interactive property presentation",
    "Booking journey simplified": "Simplified booking journey",
    "Guest browsing and booking journey simplified":
      "Clearer guest browsing and booking",
    "SEO foundations added": "SEO foundations implemented",
    "SEO foundations implemented": "SEO foundations implemented",
    "Post-launch training delivered": "Post-launch training delivered",
    "Post-launch training and maintenance support":
      "Training and maintenance support",
    "Content management enabled for the client team":
      "Client content management enabled",
  };

  return { title: titles[text] || text };
}

export function CaseStudyServicesPlatform({
  services,
  platform,
  platformHref,
  platformContext,
  platformHeading,
}: {
  services: { label: string; href: string; description?: string }[];
  platform?: string;
  platformHref?: string | null;
  platformContext?: string;
  platformHeading?: string;
}) {
  if (!services.length && !platform) return null;

  const platformTitle =
    platformHeading || (platform ? `Built with ${platform}` : "");

  return (
    <Section className="!py-12 sm:!py-14 lg:!py-16">
      <Container>
        <div className="grid gap-14 lg:grid-cols-2 lg:gap-16">
          {services.length > 0 ? (
            <div>
              <p className="eyebrow">Services used</p>
              <h2 className="mt-3 font-display text-2xl font-semibold sm:text-3xl">
                Services used on this project
              </h2>
              <ul className="mt-7 border-t border-border">
                {services.map((service) => (
                  <li key={service.label} className="border-b border-border py-5">
                    <p className="font-display text-xl font-semibold text-foreground">
                      {service.label}
                    </p>
                    {service.description ? (
                      <p className="mt-2 text-[1.0625rem] leading-relaxed text-muted">
                        {service.description}
                      </p>
                    ) : null}
                    {service.href ? (
                      <div className="mt-3">
                        <LinkRow
                          href={service.href}
                          label={`Explore ${service.label}`}
                        />
                      </div>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {platform ? (
            <div>
              <p className="eyebrow">Platform</p>
              <h2 className="mt-3 font-display text-2xl font-semibold sm:text-3xl">
                {platformTitle}
              </h2>
              {platformContext ? (
                <p className="mt-4 max-w-md text-[1.0625rem] leading-relaxed text-muted sm:text-lg">
                  {platformContext}
                </p>
              ) : null}
              {platformHref ? (
                <div className="mt-6">
                  <LinkRow href={platformHref} label={`Explore ${platform}`} />
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </Container>
    </Section>
  );
}

function LinkRow({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="group inline-flex items-center gap-2 text-base font-semibold text-accent-text hover:underline sm:text-[1.0625rem]"
    >
      {label}
      <span
        aria-hidden
        className="transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
      >
        →
      </span>
    </Link>
  );
}

export function CaseStudyNav({
  previous,
  next,
}: {
  previous?: { name: string; href: string } | null;
  next?: { name: string; href: string } | null;
}) {
  if (!previous && !next) return null;

  return (
    <Section className="!py-10 sm:!py-12">
      <Container>
        <div className="grid gap-8 border-y border-border py-8 sm:grid-cols-2 sm:gap-10 sm:py-10">
          {previous ? (
            <Link
              href={previous.href}
              className="group block hover:text-accent-text"
            >
              <span className="block text-[0.8125rem] font-semibold uppercase tracking-[0.12em] text-subtle">
                ← Previous project
              </span>
              <span className="mt-2.5 block font-display text-xl font-semibold leading-snug sm:text-2xl">
                {previous.name}
              </span>
            </Link>
          ) : (
            <span />
          )}
          {next ? (
            <Link
              href={next.href}
              className="group block sm:text-right hover:text-accent-text"
            >
              <span className="block text-[0.8125rem] font-semibold uppercase tracking-[0.12em] text-subtle">
                Next project →
              </span>
              <span className="mt-2.5 block font-display text-xl font-semibold leading-snug sm:text-2xl">
                {next.name}
              </span>
            </Link>
          ) : null}
        </div>
      </Container>
    </Section>
  );
}

export function CaseStudyVisualBreak({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <Section className="!py-10 sm:!py-12 lg:!py-14">
      <Container>{children}</Container>
    </Section>
  );
}

export function CaseStudyEngineering({
  intro,
  stacks,
  heading = "Built as a modern web application",
}: {
  intro?: string;
  stacks?: ProjectEngineeringStack[];
  heading?: string;
}) {
  if (!intro && !stacks?.length) return null;

  return (
    <Section className="!py-14 sm:!py-16 lg:!py-[4.5rem]">
      <Container>
        <div className="max-w-2xl">
          <p className="eyebrow">Engineering</p>
          <h2 className="mt-4 font-display text-[1.875rem] font-semibold sm:text-4xl">
            {heading}
          </h2>
          {intro ? (
            <p className="mt-5 text-[1.0625rem] leading-[1.75] text-muted sm:text-lg">
              {intro}
            </p>
          ) : null}
        </div>
        {stacks?.length ? (
          <div className="mt-12 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {stacks.map((stack) => (
              <article
                key={stack.category}
                className="rounded-xl border border-border bg-surface p-6"
              >
                <h3 className="font-display text-lg font-semibold text-foreground">
                  {stack.category}
                </h3>
                <ul className="mt-4 space-y-2">
                  {stack.items.map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-2.5 text-[1.0625rem] leading-relaxed text-muted"
                    >
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                      {item}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        ) : null}
      </Container>
    </Section>
  );
}

function GalleryScreenshot({
  item,
  priority = false,
}: {
  item: ProjectGalleryItem;
  priority?: boolean;
}) {
  return (
    <BrowserFrame className="shadow-md">
      <div className="relative aspect-[16/10] overflow-hidden bg-surface-muted sm:aspect-[16/9]">
        <Image
          src={item.src}
          alt={item.alt}
          fill
          priority={priority}
          className="object-cover object-top"
          sizes={
            item.layout === "half"
              ? "(max-width: 768px) 100vw, 50vw"
              : "(max-width: 1280px) 100vw, 1200px"
          }
        />
      </div>
    </BrowserFrame>
  );
}

export function CaseStudyGallery({ items }: { items: ProjectGalleryItem[] }) {
  if (!items.length) return null;

  const blocks: ProjectGalleryItem[][] = [];
  let index = 0;

  while (index < items.length) {
    const current = items[index];
    if (current.layout === "half" && items[index + 1]?.layout === "half") {
      blocks.push([current, items[index + 1]]);
      index += 2;
      continue;
    }
    blocks.push([current]);
    index += 1;
  }

  return (
    <>
      {blocks.map((block, blockIndex) => {
        const key = block.map((item) => item.src).join("-");
        if (block.length === 2) {
          return (
            <CaseStudyVisualBreak key={key}>
              <div className="grid gap-6 sm:grid-cols-2 sm:gap-8">
                {block.map((item) => (
                  <GalleryScreenshot key={item.src} item={item} />
                ))}
              </div>
            </CaseStudyVisualBreak>
          );
        }

        return (
          <CaseStudyVisualBreak key={key}>
            <GalleryScreenshot
              item={block[0]}
              priority={blockIndex === 0}
            />
          </CaseStudyVisualBreak>
        );
      })}
    </>
  );
}

export function CaseStudyPrinciples({
  items,
  heading = "The principles behind the platform",
}: {
  items: ProjectCaseStudyPoint[];
  heading?: string;
}) {
  if (!items.length) return null;

  return (
    <Section tone="muted" className="!py-14 sm:!py-16 lg:!py-[4.5rem]">
      <Container>
        <div className="max-w-2xl">
          <p className="eyebrow">Product principles</p>
          <h2 className="mt-4 font-display text-[1.875rem] font-semibold sm:text-4xl">
            {heading}
          </h2>
        </div>
        <ol className="mt-12 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item, index) => (
            <li key={item.title} className="border-t-2 border-accent/50 pt-5">
              <span className="font-display text-lg font-semibold tabular-nums text-accent-text sm:text-xl">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-4 font-display text-xl font-semibold sm:text-[1.375rem]">
                {item.title}
              </h3>
              <p className="mt-3 text-[1.0625rem] leading-relaxed text-muted sm:text-lg">
                {item.description}
              </p>
            </li>
          ))}
        </ol>
      </Container>
    </Section>
  );
}

export function CaseStudyProductFeatures({
  features,
}: {
  features: ProductFeatureSection[];
}) {
  if (!features.length) return null;

  return (
    <>
      {features.map((feature, index) => (
        <Section
          key={feature.title}
          className="!py-14 sm:!py-16 lg:!py-[4.5rem]"
          tone={index % 2 === 0 ? undefined : "muted"}
        >
          <Container>
            <div
              className={cn(
                "grid gap-10 lg:items-center lg:gap-16",
                feature.image
                  ? "lg:grid-cols-[minmax(0,0.42fr)_minmax(0,0.58fr)]"
                  : "max-w-3xl",
              )}
            >
              <div className={feature.image ? "min-w-0" : undefined}>
                <p className="eyebrow">{feature.title}</p>
                <h2 className="mt-4 font-display text-[1.875rem] font-semibold leading-tight sm:text-4xl">
                  {feature.heading}
                </h2>
                <p className="mt-5 text-[1.0625rem] leading-[1.75] text-muted sm:text-lg">
                  {feature.body}
                </p>
              </div>
              {feature.image ? (
                <div className="min-w-0">
                  <BrowserFrame className="shadow-md">
                    <div className="relative aspect-[16/10] overflow-hidden bg-surface-muted sm:aspect-[16/9]">
                      <Image
                        src={feature.image.src}
                        alt={feature.image.alt}
                        fill
                        className="object-cover object-top"
                        sizes="(max-width: 1024px) 100vw, 58vw"
                      />
                    </div>
                  </BrowserFrame>
                </div>
              ) : null}
            </div>
          </Container>
        </Section>
      ))}
    </>
  );
}

export function CaseStudySaasInfrastructure({
  stacks,
  heading = "The systems behind the product",
}: {
  stacks?: ProjectEngineeringStack[];
  heading?: string;
}) {
  if (!stacks?.length) return null;

  return (
    <Section tone="muted" className="!py-14 sm:!py-16 lg:!py-[4.5rem]">
      <Container>
        <div className="max-w-2xl">
          <p className="eyebrow">SaaS infrastructure</p>
          <h2 className="mt-4 font-display text-[1.875rem] font-semibold sm:text-4xl">
            {heading}
          </h2>
        </div>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {stacks.map((stack) => (
            <article
              key={stack.category}
              className="rounded-xl border border-border bg-surface p-6"
            >
              <h3 className="font-display text-lg font-semibold text-foreground">
                {stack.category}
              </h3>
              <ul className="mt-4 space-y-2">
                {stack.items.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2.5 text-[1.0625rem] leading-relaxed text-muted"
                  >
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                    {item}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </Container>
    </Section>
  );
}

const ARCHITECTURE_LAYERS = [
  {
    title: "Freelancer context",
    items: "Profile · Skills · Work · Proof",
  },
  {
    title: "Win work",
    items: "Opportunities → Analysis → Proposals → Pipeline",
  },
  {
    title: "Run relationships",
    items: "Leads → Clients → Projects",
  },
  {
    title: "Present proof",
    items: "Portfolio → Services → Public Profile",
  },
  {
    title: "Learn and improve",
    items: "Analytics → Insights → Career Coach",
  },
];

const ARCHITECTURE_SUPPORT = [
  "Authentication",
  "Billing",
  "Notifications",
  "Administration",
];

export function CaseStudyArchitectureDiagram() {
  return (
    <Section className="!py-14 sm:!py-16 lg:!py-[4.5rem]">
      <Container>
        <div className="max-w-2xl">
          <p className="eyebrow">Product architecture</p>
          <h2 className="mt-4 font-display text-[1.875rem] font-semibold sm:text-4xl">
            One operating system, many connected workflows
          </h2>
          <p className="mt-5 text-[1.0625rem] leading-relaxed text-muted sm:text-lg">
            Freelance OS is organized around shared freelancer context and
            connected product domains rather than isolated feature pages.
          </p>
        </div>
        <div className="mt-12 space-y-4">
          <div className="rounded-xl border border-accent/30 bg-accent/5 px-6 py-5 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent-text">
              Freelance OS
            </p>
          </div>
          {ARCHITECTURE_LAYERS.map((layer) => (
            <div key={layer.title} className="flex flex-col items-center gap-3">
              <span className="text-accent-text" aria-hidden>
                ↓
              </span>
              <div className="w-full max-w-3xl rounded-xl border border-border bg-surface px-6 py-5 text-center">
                <p className="font-display text-lg font-semibold text-foreground">
                  {layer.title}
                </p>
                <p className="mt-2 text-[1.0625rem] text-muted">{layer.items}</p>
              </div>
            </div>
          ))}
          <div className="flex flex-col items-center gap-3 pt-2">
            <span className="text-accent-text" aria-hidden>
              ↓
            </span>
            <div className="w-full max-w-3xl rounded-xl border border-dashed border-border bg-surface-muted/60 px-6 py-5 text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-subtle">
                Supporting infrastructure
              </p>
              <p className="mt-3 text-[1.0625rem] text-muted">
                {ARCHITECTURE_SUPPORT.join(" · ")}
              </p>
            </div>
          </div>
        </div>
      </Container>
    </Section>
  );
}
