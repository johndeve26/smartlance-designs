import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { CTASection } from "@/components/ui/cta-section";
import { StructuredData } from "@/components/ui/structured-data";
import { Button } from "@/components/ui/button";
import { breadcrumbJsonLd } from "@/lib/structured-data";
import { PUBLIC_CTAS } from "@/lib/public/cta-map";
import {
  aiHubApproach,
  aiHubCapabilities,
  aiHubPlatformLink,
  aiHubProblems,
} from "@/lib/public/ai-automation-content";
import { AI_AUTOMATION_HUB } from "@/lib/public/ai-automation-routes";
import { cn } from "@/lib/utils";

export function WorkflowDiagram({
  steps,
  title,
  description,
}: {
  steps: Array<{ label: string; note?: string }>;
  title?: string;
  description?: string;
}) {
  return (
    <figure className="rounded-lg border border-border bg-surface-muted p-5 sm:p-6">
      {title ? (
        <figcaption className="font-display text-lg font-semibold text-foreground">
          {title}
        </figcaption>
      ) : null}
      {description ? (
        <p className="mt-2 text-sm leading-relaxed text-muted">{description}</p>
      ) : null}
      <ol className={cn("space-y-0", title || description ? "mt-5" : undefined)}>
        {steps.map((step, index) => (
          <li key={`${step.label}-${index}`} className="relative flex gap-3 pb-4 last:pb-0">
            {index < steps.length - 1 ? (
              <span
                className="absolute left-[0.6875rem] top-6 h-[calc(100%-0.5rem)] w-px bg-border"
                aria-hidden
              />
            ) : null}
            <span className="relative z-[1] mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent text-[0.625rem] font-semibold text-white">
              {index + 1}
            </span>
            <div className="min-w-0 pt-0.5">
              <p className="text-sm font-semibold text-foreground">{step.label}</p>
              {step.note ? (
                <p className="mt-0.5 text-xs text-muted">{step.note}</p>
              ) : null}
            </div>
          </li>
        ))}
      </ol>
    </figure>
  );
}

export function AiAutomationHubPage() {
  return (
    <>
      <StructuredData
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "AI & Automation", path: AI_AUTOMATION_HUB },
        ])}
      />

      <Section className="!pt-10 !pb-12">
        <Container>
          <Breadcrumbs
            items={[{ label: "Home", href: "/" }, { label: "AI & Automation" }]}
          />
          <div className="mt-8 max-w-3xl">
            <p className="eyebrow">AI & Automation</p>
            <h1 className="heading-page mt-3 font-display font-semibold">
              AI and automation that solve real business problems
            </h1>
            <p className="section-deck mt-6">
              Smartlance builds practical AI, automation and integration systems
              that help businesses respond faster, reduce repetitive work,
              organize leads and connect the tools they already use.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild>
                <Link href={PUBLIC_CTAS.project.href}>{PUBLIC_CTAS.project.label}</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href={PUBLIC_CTAS.exploreSolutions.href}>
                  {PUBLIC_CTAS.exploreSolutions.label}
                </Link>
              </Button>
            </div>
          </div>
        </Container>
      </Section>

      <Section tone="muted" className="!py-12 sm:!py-14">
        <Container>
          <h2 className="heading-section font-display font-semibold">
            What are you trying to improve?
          </h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {aiHubProblems.map((problem) => (
              <Link
                key={problem.href}
                href={problem.href}
                className="group rounded-lg border border-border bg-surface p-5 transition-colors hover:border-border-strong"
              >
                <h3 className="font-display text-lg font-semibold text-foreground group-hover:text-accent-text">
                  {problem.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {problem.description}
                </p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-accent-text">
                  View solution
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            ))}
          </div>
        </Container>
      </Section>

      <Section className="!py-12 sm:!py-14">
        <Container>
          <h2 className="heading-section font-display font-semibold">
            Capability areas
          </h2>
          <p className="section-deck mt-4 max-w-2xl">
            Explore the areas where Smartlance most often helps — from lead
            handling and workflow automation to integrations and focused AI tools.
          </p>
          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {aiHubCapabilities.map((capability) => (
              <Link
                key={capability.href}
                href={capability.href}
                className="group flex flex-col rounded-lg border border-border p-6 transition-colors hover:border-border-strong hover:bg-surface-muted"
              >
                <h3 className="font-display text-xl font-semibold text-foreground">
                  {capability.title}
                </h3>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-muted">
                  {capability.outcome}
                </p>
                <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-accent-text">
                  Learn more
                  <ArrowRight className="h-4 w-4" />
                </span>
              </Link>
            ))}
          </div>
        </Container>
      </Section>

      <Section tone="muted" className="!py-12 sm:!py-14">
        <Container>
          <div className="grid gap-10 lg:grid-cols-[minmax(0,0.45fr)_minmax(0,0.55fr)] lg:items-start">
            <div>
              <h2 className="heading-section font-display font-semibold">
                {aiHubApproach.title}
              </h2>
            </div>
            <div className="space-y-5 text-base leading-relaxed text-muted">
              <p>{aiHubApproach.body}</p>
              <p className="rounded-lg border border-border bg-surface px-5 py-4 text-foreground">
                {aiHubApproach.notAlways}
              </p>
              <Link href={aiHubPlatformLink.href} className="link-action inline-flex">
                {aiHubPlatformLink.label} →
              </Link>
            </div>
          </div>
        </Container>
      </Section>

      <CTASection
        title="Tell us what you want to automate"
        description="Share the process, the tools involved and what better would look like for your team or customers."
        primaryLabel={PUBLIC_CTAS.project.label}
        primaryHref={PUBLIC_CTAS.project.href}
        secondaryLabel={PUBLIC_CTAS.howWeWork.label}
        secondaryHref={PUBLIC_CTAS.howWeWork.href}
      />
    </>
  );
}
