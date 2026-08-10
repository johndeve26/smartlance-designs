import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { CTASection } from "@/components/ui/cta-section";
import { StructuredData } from "@/components/ui/structured-data";
import { WorkflowDiagram } from "@/components/ai-automation/ai-automation-hub";
import { breadcrumbJsonLd } from "@/lib/structured-data";
import { PUBLIC_CTAS } from "@/lib/public/cta-map";
import type { AiAutomationPageContent } from "@/lib/public/ai-automation-content";
import { AI_AUTOMATION_HUB } from "@/lib/public/ai-automation-routes";

export function AiAutomationDetailPage({
  page,
}: {
  page: AiAutomationPageContent;
}) {
  return (
    <>
      <StructuredData
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "AI & Automation", path: AI_AUTOMATION_HUB },
          { name: page.title, path: `/ai-automation/${page.slug}` },
        ])}
      />

      <Section className="!pt-10 !pb-12">
        <Container>
          <Breadcrumbs
            items={[
              { label: "Home", href: "/" },
              { label: "AI & Automation", href: AI_AUTOMATION_HUB },
              { label: page.title },
            ]}
          />
          <div className="mt-8 max-w-3xl">
            <p className="eyebrow">{page.eyebrow}</p>
            <h1 className="heading-page mt-3 font-display font-semibold">
              {page.heroTitle}
            </h1>
            <p className="section-deck mt-6">{page.heroSupporting}</p>
            <p className="mt-6 text-base leading-relaxed text-muted">{page.intro}</p>
          </div>
        </Container>
      </Section>

      {page.sections.map((section, index) => (
        <Section
          key={section.id ?? section.title}
          tone={index % 2 === 1 ? "muted" : "default"}
          className="!py-12 sm:!py-14"
          id={section.id}
        >
          <Container>
            <div className="max-w-3xl">
              <h2 className="heading-section font-display font-semibold">
                {section.title}
              </h2>
              <p className="mt-4 text-base leading-relaxed text-muted">{section.body}</p>
              {section.bullets && section.bullets.length > 0 ? (
                <ul className="mt-6 space-y-3">
                  {section.bullets.map((bullet) => (
                    <li
                      key={bullet}
                      className="flex gap-3 text-base leading-relaxed text-foreground"
                    >
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                      {bullet}
                    </li>
                  ))}
                </ul>
              ) : null}
              {section.callout ? (
                <p className="mt-6 rounded-lg border border-border bg-surface px-5 py-4 text-sm leading-relaxed text-foreground">
                  {section.callout}
                </p>
              ) : null}
            </div>
            {section.workflow && section.workflow.length > 0 ? (
              <div className="mt-8 max-w-2xl">
                <WorkflowDiagram steps={section.workflow} />
              </div>
            ) : null}
          </Container>
        </Section>
      ))}

      {page.useCases && page.useCases.length > 0 ? (
        <Section tone="muted" className="!py-12 sm:!py-14">
          <Container>
            <h2 className="heading-section font-display font-semibold">
              Capability examples
            </h2>
            <p className="mt-3 max-w-2xl text-sm text-muted">
              Illustrative use cases — not claims about specific client deployments
              unless shown in our work.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {page.useCases.map((useCase) => (
                <article
                  key={useCase.title}
                  className="rounded-lg border border-border bg-surface p-5"
                >
                  <h3 className="font-display text-lg font-semibold">{useCase.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">
                    {useCase.description}
                  </p>
                </article>
              ))}
            </div>
          </Container>
        </Section>
      ) : null}

      <Section className="!py-12 sm:!py-14">
        <Container>
          <h2 className="heading-section font-display font-semibold">Related</h2>
          <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-3">
            {page.relatedLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="link-action">
                  {link.label} →
                </Link>
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      <CTASection
        title={page.ctaTitle}
        description={page.ctaDescription}
        primaryLabel={PUBLIC_CTAS.project.label}
        primaryHref={PUBLIC_CTAS.project.href}
        secondaryLabel="AI & Automation overview"
        secondaryHref={AI_AUTOMATION_HUB}
      />
    </>
  );
}
