import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { WorkflowDiagram } from "@/components/ai-automation/ai-automation-hub";
import { homepageAiUseCases } from "@/lib/public/ai-automation-content";
import { AI_AUTOMATION_HUB } from "@/lib/public/ai-automation-routes";
import { PUBLIC_CTAS } from "@/lib/public/cta-map";

const sampleWorkflow = [
  { label: "Enquiry arrives", note: "Website / form / email" },
  { label: "Validate & route", note: "Rules" },
  { label: "CRM record", note: "System of record" },
  { label: "Notify & assign", note: "Ownership" },
  { label: "Follow-up task", note: "Action" },
];

export function HomeAiAutomationSection() {
  return (
    <Section tone="muted" className="!py-14 sm:!py-16 lg:!py-[4.5rem]">
      <Container>
        <div className="grid gap-12 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:items-start lg:gap-16">
          <div>
            <p className="eyebrow">AI & Automation</p>
            <h2 className="heading-section mt-3 font-display font-semibold">
              AI where it actually makes sense
            </h2>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
              Smartlance uses AI and automation to reduce repetitive work,
              improve lead handling, connect business systems and build smarter
              customer experiences — with human review where it matters.
            </p>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-subtle">
              Some workflows are better solved with straightforward automation
              and clear rules. AI is added when it genuinely helps — not to chase
              a trend.
            </p>
            <Button asChild className="mt-8">
              <Link href={AI_AUTOMATION_HUB}>Explore AI & Automation</Link>
            </Button>
          </div>
          <WorkflowDiagram
            steps={sampleWorkflow}
            title="Example: enquiry to follow-up"
            description="Illustrative workflow — built around your tools, rules and team."
          />
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {homepageAiUseCases.map((useCase) => (
            <Link
              key={useCase.href}
              href={useCase.href}
              className="group rounded-lg border border-border bg-surface p-5 transition-colors hover:border-border-strong"
            >
              <h3 className="font-display text-lg font-semibold text-foreground">
                {useCase.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {useCase.description}
              </p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-accent-text">
                Learn more
                <ArrowRight className="h-4 w-4" />
              </span>
            </Link>
          ))}
        </div>
      </Container>
    </Section>
  );
}

export function HomeCoreCapabilitiesSection() {
  const pillars = [
    {
      title: "Web",
      items: ["Design", "Development", "Commerce"],
      href: "/services",
    },
    {
      title: "Growth",
      items: ["SEO", "Conversion", "Digital marketing"],
      href: "/seo",
    },
    {
      title: "AI",
      items: ["Agents", "Assistants", "Voice AI"],
      href: AI_AUTOMATION_HUB,
    },
    {
      title: "Automation",
      items: ["Workflows", "CRM / leads", "Integrations"],
      href: "/ai-automation/workflow-automation",
    },
  ];

  return (
    <Section className="!py-14 sm:!py-16">
      <Container>
        <h2 className="heading-section font-display font-semibold">
          Core capabilities
        </h2>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted">
          Websites, growth, AI and automation — planned together when your
          business needs them to work as one system.
        </p>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {pillars.map((pillar) => (
            <Link
              key={pillar.title}
              href={pillar.href}
              className="rounded-lg border border-border p-5 transition-colors hover:border-border-strong hover:bg-surface-muted"
            >
              <h3 className="font-display text-xl font-semibold">{pillar.title}</h3>
              <ul className="mt-3 space-y-1.5 text-sm text-muted">
                {pillar.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </Link>
          ))}
        </div>
      </Container>
    </Section>
  );
}
