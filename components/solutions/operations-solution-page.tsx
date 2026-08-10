import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { CTASection } from "@/components/ui/cta-section";
import { StructuredData } from "@/components/ui/structured-data";
import { breadcrumbJsonLd } from "@/lib/structured-data";
import { PUBLIC_CTAS } from "@/lib/public/cta-map";
import type { OperationsSolutionContent } from "@/lib/public/operations-solutions-content";

export function OperationsSolutionPage({
  content,
}: {
  content: OperationsSolutionContent;
}) {
  return (
    <>
      <StructuredData
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Solutions", path: "/solutions" },
          { name: content.title, path: `/solutions/${content.slug}` },
        ])}
      />

      <Section className="!pt-10 !pb-12">
        <Container>
          <Breadcrumbs
            items={[
              { label: "Home", href: "/" },
              { label: "Solutions", href: "/solutions" },
              { label: content.title },
            ]}
          />
          <div className="mt-8 max-w-3xl">
            <p className="eyebrow">Solution</p>
            <h1 className="heading-page mt-3 font-display font-semibold">
              {content.heroStatement}
            </h1>
            <p className="section-deck mt-6">{content.heroSupporting}</p>
          </div>
        </Container>
      </Section>

      <Section tone="muted" className="!py-12 sm:!py-14">
        <Container>
          <div className="grid gap-10 lg:grid-cols-2">
            <div>
              <h2 className="heading-section font-display font-semibold">
                Why this happens
              </h2>
              <ul className="mt-6 space-y-3">
                {content.whyItHappens.map((item) => (
                  <li key={item} className="flex gap-3 text-base leading-relaxed text-muted">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h2 className="heading-section font-display font-semibold">
                What a better process looks like
              </h2>
              <ul className="mt-6 space-y-3">
                {content.betterProcess.map((item) => (
                  <li key={item} className="flex gap-3 text-base leading-relaxed text-foreground">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Container>
      </Section>

      <Section className="!py-12 sm:!py-14">
        <Container>
          <h2 className="heading-section font-display font-semibold">
            How Smartlance approaches it
          </h2>
          <p className="mt-4 max-w-3xl text-base leading-relaxed text-muted">
            {content.approach}
          </p>
          <div className="mt-8">
            <h3 className="text-sm font-semibold uppercase tracking-[0.1em] text-subtle">
              Relevant capabilities
            </h3>
            <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-3">
              {content.capabilities.map((cap) => (
                <li key={cap.href}>
                  <Link href={cap.href} className="link-action">
                    {cap.label} →
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </Container>
      </Section>

      <CTASection
        title={content.ctaTitle}
        description="Tell us what is happening today and what better would look like for your team or customers."
        primaryLabel={PUBLIC_CTAS.project.label}
        primaryHref={PUBLIC_CTAS.project.href}
        secondaryLabel={PUBLIC_CTAS.exploreSolutions.label}
        secondaryHref={PUBLIC_CTAS.exploreSolutions.href}
      />
    </>
  );
}
