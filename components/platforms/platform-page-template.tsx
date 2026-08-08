import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { SectionHeader } from "@/components/ui/section-header";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Button } from "@/components/ui/button";
import { FAQ } from "@/components/ui/faq";
import { CTASection } from "@/components/ui/cta-section";
import { StructuredData } from "@/components/ui/structured-data";
import { Icon } from "@/components/ui/icon";
import { ServiceProofCard } from "@/components/services/detail/service-proof-card";
import type { Platform, Project, Service } from "@/types";
import { seoServices } from "@/data/seo";
import { listPublishedServices } from "@/lib/repositories/servicesRepository";
import {
  breadcrumbJsonLd,
  faqJsonLd,
  serviceJsonLd,
} from "@/lib/structured-data";
import { getPlatformConnection } from "@/lib/site-relationships";
import { PlatformDecisionLinks } from "@/components/connections/connection-links";
import { cn } from "@/lib/utils";

type PlatformPageTemplateProps = {
  platform: Platform;
  relatedProjects?: Project[];
};

function serviceMeta(href: string, publishedServices: Service[]) {
  const service = publishedServices.find((item) => item.href === href);
  if (service) {
    return {
      title: service.title,
      summary: service.summary,
      icon: service.icon,
    };
  }
  const seo = seoServices.find((item) => item.href === href);
  if (seo) {
    return {
      title: seo.title,
      summary: seo.summary,
      icon: seo.icon,
    };
  }
  return {
    title: href.replace(/^\//, "").replace(/\//g, " / "),
    summary: "Related Smartlance capability.",
    icon: "layers",
  };
}

function PlatformHeroVisual({
  platform,
  project,
}: {
  platform: Platform;
  project?: Project;
}) {
  const imageSrc = project?.heroImage || project?.image;

  if (imageSrc) {
    return (
      <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
        <div className="flex items-center gap-1.5 border-b border-border px-3 py-2">
          <span className="h-1.5 w-1.5 rounded-full bg-neutral-300" />
          <span className="h-1.5 w-1.5 rounded-full bg-neutral-300" />
          <span className="h-1.5 w-1.5 rounded-full bg-neutral-300" />
          <span className="ml-2 h-3 flex-1 rounded bg-surface-muted" />
        </div>
        <div className="relative aspect-[16/10] bg-surface-muted">
          <Image
            src={imageSrc}
            alt={project?.imageAlt || `${platform.name} website example`}
            fill
            className="object-cover object-top"
            sizes="(max-width: 1024px) 100vw, 560px"
            priority
          />
        </div>
        <div className="border-t border-border px-4 py-3 text-sm font-medium text-foreground">
          {project?.name || platform.name}
          {project?.industry ? (
            <span className="text-muted"> · {project.industry}</span>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-border bg-surface-muted shadow-sm">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_100%_0%,var(--orange-100)_0%,transparent_55%)]"
        aria-hidden
      />
      <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-cta text-cta-foreground shadow-sm">
          <Icon name={platform.icon} className="h-7 w-7" />
        </div>
        <p className="mt-5 font-display text-xl font-semibold">{platform.name}</p>
        <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted">
          Platform-focused website design, development and improvement.
        </p>
      </div>
    </div>
  );
}

export async function PlatformPageTemplate({
  platform,
  relatedProjects = [],
}: PlatformPageTemplateProps) {
  const publishedServices = await listPublishedServices();
  const projects = relatedProjects.slice(0, 3);
  const heroProject = projects[0];
  const relatedServices = platform.relatedServiceHrefs
    .map((href) => ({ href, ...serviceMeta(href, publishedServices) }))
    .slice(0, 4);
  const whenItFits = platform.whenItFits?.length
    ? platform.whenItFits
    : platform.audiences.slice(0, 5);
  const decision = getPlatformConnection(platform.slug);

  return (
    <>
      <StructuredData
        data={[
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Platforms", path: "/platforms" },
            { name: platform.name, path: platform.href },
          ]),
          serviceJsonLd({
            name: platform.title,
            description: platform.description,
            path: platform.href,
          }),
          ...(platform.faqs?.length ? [faqJsonLd(platform.faqs)] : []),
        ]}
      />

      {/* Hero */}
      <Section className="!pt-10 !pb-12 sm:!pb-14">
        <Container>
          <Breadcrumbs
            items={[
              { label: "Home", href: "/" },
              { label: "Platforms", href: "/platforms" },
              { label: platform.name },
            ]}
          />
          <div className="mt-8 grid items-center gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-12 xl:gap-16">
            <div className="order-1 min-w-0">
              <p className="eyebrow">Platforms</p>
              <h1 className="heading-section mt-3 font-display font-semibold">
                {platform.title}
              </h1>
              {platform.tagline ? (
                <p className="mt-4 text-xl font-semibold leading-snug text-foreground sm:text-2xl">
                  {platform.tagline}
                </p>
              ) : null}
              <p className="mt-5 max-w-[36rem] text-base leading-[1.65] text-muted sm:text-[1.0625rem]">
                {platform.description}
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button asChild size="lg">
                  <Link href="/contact">Schedule a Free Call</Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href="/free-website-review">
                    Get a Free Website Review
                  </Link>
                </Button>
              </div>
            </div>
            <div className="order-2">
              <PlatformHeroVisual platform={platform} project={heroProject} />
            </div>
          </div>
        </Container>
      </Section>

      {/* When it fits */}
      <Section tone="muted" className="!py-12 sm:!py-14">
        <Container>
          <div className="grid gap-10 lg:grid-cols-[minmax(0,0.4fr)_minmax(0,0.6fr)] lg:gap-16">
            <div>
              <p className="eyebrow">Fit</p>
              <h2 className="heading-section mt-3 font-display font-semibold">
                When {platform.name} may be the right fit
              </h2>
              <p className="mt-4 max-w-[36rem] text-base leading-[1.65] text-muted sm:text-[1.0625rem]">
                Platform choice should follow business requirements — not
                habit or hype.
              </p>
            </div>
            <ul className="border-t border-border">
              {whenItFits.map((item, index) => (
                <li
                  key={item}
                  className="flex gap-4 border-b border-border py-5"
                >
                  <span className="font-display text-lg font-semibold tabular-nums text-accent-text">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <p className="pt-0.5 text-base leading-relaxed text-foreground">
                    {item}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </Container>
      </Section>

      {/* Capabilities */}
      <Section className="!py-12 sm:!py-14">
        <Container>
          <SectionHeader
            eyebrow="Capabilities"
            title={`What Smartlance can do on ${platform.name}`}
            description="Website, SEO and conversion work tied to how your business actually operates."
          />
          <ul className="mt-10 grid gap-0 sm:grid-cols-2">
            {platform.capabilities.map((item, index) => (
              <li
                key={item}
                className="border-t border-border py-5 sm:odd:pr-8 sm:even:pl-8 lg:odd:border-r"
              >
                <span className="font-display text-sm font-semibold tabular-nums text-accent-text">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <p className="mt-2 text-base leading-relaxed text-foreground">
                  {item}
                </p>
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      {/* Challenges */}
      {platform.challenges?.length ? (
        <Section tone="muted" className="!py-12 sm:!py-14">
          <Container>
            <SectionHeader
              eyebrow="Problems we solve"
              title="Common website problems we help solve"
              description="Typical issues businesses bring to us on this platform."
            />
            <ul className="mt-10 grid gap-0 sm:grid-cols-2">
              {platform.challenges.map((item, index) => (
                <li
                  key={item}
                  className="border-t border-border py-5 sm:odd:pr-8 sm:even:pl-8"
                >
                  <span className="font-display text-sm font-semibold tabular-nums text-accent-text">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <p className="mt-2 text-base leading-relaxed text-foreground">
                    {item}
                  </p>
                </li>
              ))}
            </ul>
          </Container>
        </Section>
      ) : null}

      {/* Platform + SEO */}
      {platform.seoSection ? (
        <Section tone="dark" className="!py-12 sm:!py-14">
          <Container>
            <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-orange-300">
                  {platform.name} + SEO
                </p>
                <h2 className="mt-3 font-display text-3xl font-semibold text-white sm:text-4xl">
                  {platform.seoSection.title}
                </h2>
                <p className="mt-4 text-base leading-[1.65] text-white/75 sm:text-[1.0625rem]">
                  {platform.seoSection.intro}
                </p>
                <div className="mt-7 flex flex-wrap gap-3">
                  <Link
                    href="/seo"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-white/20 px-4 py-2.5 text-[0.9375rem] font-semibold text-white hover:border-white/40"
                  >
                    SEO Services
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                  <Link
                    href="/seo/technical-seo"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-white/20 px-4 py-2.5 text-[0.9375rem] font-semibold text-white hover:border-white/40"
                  >
                    Technical SEO
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
              <ul className="border-t border-white/15">
                {platform.seoSection.points.map((point, index) => (
                  <li
                    key={point}
                    className="flex gap-4 border-b border-white/15 py-4"
                  >
                    <span className="font-display text-base font-semibold tabular-nums text-orange-300">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <p className="text-base text-white">{point}</p>
                  </li>
                ))}
              </ul>
            </div>
          </Container>
        </Section>
      ) : null}

      {/* Conversion + migration */}
      {(platform.conversionNote || platform.migrationNote) && (
        <Section className="!py-12 sm:!py-14">
          <Container>
            <div
              className={cn(
                "grid gap-10",
                platform.conversionNote && platform.migrationNote
                  ? "lg:grid-cols-2 lg:gap-16"
                  : "max-w-3xl",
              )}
            >
              {platform.conversionNote ? (
                <div>
                  <p className="eyebrow">Conversion</p>
                  <h2 className="mt-3 font-display text-2xl font-semibold sm:text-3xl">
                    Conversion on {platform.name}
                  </h2>
                  <p className="mt-4 text-base leading-[1.65] text-muted sm:text-[1.0625rem]">
                    {platform.conversionNote}
                  </p>
                  <Link
                    href="/services/conversion-rate-optimization"
                    className="group mt-5 inline-flex items-center gap-1.5 text-[0.9375rem] font-semibold text-accent-text hover:underline"
                  >
                    Conversion Rate Optimization
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" />
                  </Link>
                </div>
              ) : null}
              {platform.migrationNote ? (
                <div>
                  <p className="eyebrow">Redesign</p>
                  <h2 className="mt-3 font-display text-2xl font-semibold sm:text-3xl">
                    When redesign or migration makes sense
                  </h2>
                  <p className="mt-4 text-base leading-[1.65] text-muted sm:text-[1.0625rem]">
                    {platform.migrationNote}
                  </p>
                  <Link
                    href="/services/website-redesign"
                    className="group mt-5 inline-flex items-center gap-1.5 text-[0.9375rem] font-semibold text-accent-text hover:underline"
                  >
                    Website Redesign
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" />
                  </Link>
                </div>
              ) : null}
            </div>
          </Container>
        </Section>
      )}

      {/* Proof */}
      {projects.length > 0 ? (
        <Section tone="muted" className="!py-12 sm:!py-14">
          <Container>
            <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <SectionHeader
                eyebrow="Work"
                title={`${platform.name} projects`}
                description="Verified Smartlance work on this platform."
              />
              <Button asChild variant="outline" className="shrink-0 self-start">
                <Link href="/work">View all work</Link>
              </Button>
            </div>
            <div
              className={cn(
                "mt-10 grid gap-6",
                projects.length === 1
                  ? "max-w-2xl"
                  : projects.length === 2
                    ? "sm:grid-cols-2"
                    : "sm:grid-cols-2 lg:grid-cols-3",
              )}
            >
              {projects.map((project) => (
                <ServiceProofCard key={project.slug} project={project} />
              ))}
            </div>
          </Container>
        </Section>
      ) : null}

      {/* Related services */}
      {relatedServices.length > 0 ? (
        <Section className="!py-12 sm:!py-14">
          <Container>
            <SectionHeader
              eyebrow="Related"
              title="Related services"
              description="Platform work is one part of the broader website, SEO and conversion system."
            />
            <ul className="mt-10 grid gap-0 border-t border-border sm:grid-cols-2">
              {relatedServices.map((item) => (
                <li
                  key={item.href}
                  className="border-b border-border py-6 sm:odd:border-r sm:px-6"
                >
                  <div className="flex items-start gap-3">
                    <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface-muted text-accent-text ring-1 ring-border">
                      <Icon name={item.icon} className="h-4 w-4" />
                    </span>
                    <div>
                      <h3 className="font-display text-lg font-semibold sm:text-xl">
                        <Link href={item.href} className="hover:text-accent-text">
                          {item.title}
                        </Link>
                      </h3>
                      <p className="mt-2 text-[0.9375rem] leading-relaxed text-muted sm:text-base">
                        {item.summary}
                      </p>
                      <Link
                        href={item.href}
                        className="group mt-3 inline-flex items-center gap-1.5 text-[0.9375rem] font-semibold text-accent-text hover:underline"
                      >
                        Explore {item.title}
                        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" />
                      </Link>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </Container>
        </Section>
      ) : null}

      {/* FAQ */}
      {platform.faqs?.length ? (
        <Section tone="muted" className="!py-12 sm:!py-14">
          <Container size="reading">
            <SectionHeader
              eyebrow="FAQ"
              title="Questions"
              description={`Common questions about ${platform.name}.`}
            />
            <div className="mt-8">
              <FAQ items={platform.faqs} />
            </div>
          </Container>
        </Section>
      ) : null}

      <PlatformDecisionLinks
        platformName={platform.name}
        showSelector={decision.showSelector !== false}
        comparisonHref={decision.comparisonHref}
        commerceSolution={decision.commerceSolution}
      />

      <CTASection
        title={
          platform.ctaTitle || `Need Help With Your ${platform.name} Website?`
        }
        description={
          platform.ctaDescription ||
          "Tell us about your platform, goals and current website. We will recommend a practical next step."
        }
        primaryLabel="Schedule a Free Call"
        primaryHref="/contact"
        secondaryLabel="Get a Free Website Review"
        secondaryHref="/free-website-review"
      />
    </>
  );
}
