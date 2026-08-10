import type { Metadata } from "next";
import Link from "next/link";
import { ProjectPlanner } from "@/components/project-planner/project-planner";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { CTASection } from "@/components/ui/cta-section";
import { Section } from "@/components/ui/section";
import { SectionHeader } from "@/components/ui/section-header";
import { StructuredData } from "@/components/ui/structured-data";
import { buildManagedPageMetadata } from "@/lib/seo";
import { breadcrumbJsonLd, webPageJsonLd } from "@/lib/structured-data";

const pageTitle = "Website Project Planner";
const pageDescription =
  "Answer a few questions about your website, goals and current challenges to identify the type of project you may need and the most useful next steps.";

export async function generateMetadata(): Promise<Metadata> {
  return buildManagedPageMetadata("project-planner", {
    title: pageTitle,
    description: pageDescription,
    path: "/project-planner",
  });
}

const decisionFlow = [
  "Where are you now?",
  "What needs to change?",
  "What matters most?",
  "Project path",
  "Next step",
] as const;

const howItWorks = [
  {
    step: "01",
    title: "Tell us where the project stands",
    body: "Start with what exists today — a live site, a partial build, or nothing yet.",
  },
  {
    step: "02",
    title: "Clarify what needs to change",
    body: "Focus on goals, constraints and the level of change the business actually needs.",
  },
  {
    step: "03",
    title: "Get a suggested path and next steps",
    body: "See a practical project direction, then decide whether to brief, compare options or talk through scope.",
  },
] as const;

const relatedResources = [
  {
    href: "/templates/website-project-brief-template",
    label: "Website Project Brief Template",
    description:
      "Capture requirements in a structured brief once the project direction is clearer.",
  },
  {
    href: "/tools/website-platform-selector",
    label: "Website Platform Selector",
    description:
      "Narrow platform options after you know what the website needs to support.",
  },
  {
    href: "/guides/website-redesign-guide",
    label: "Website Redesign Guide",
    description:
      "Plan redesign work without overlooking content, SEO, migration and launch.",
  },
  {
    href: "/pricing",
    label: "Pricing & Project Scope",
    description:
      "Understand what affects website project scope before you request a proposal.",
  },
] as const;

function DecisionFlowVisual() {
  return (
    <div
      className="mx-auto w-full max-w-md rounded-xl border border-border bg-surface p-5 shadow-sm lg:mx-0 lg:max-w-none"
      aria-hidden
    >
      <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-subtle">
        Decision path
      </p>
      <ol className="mt-4 space-y-0">
        {decisionFlow.map((label, index) => {
          const isLast = index === decisionFlow.length - 1;
          const isPath = label === "Project path";
          const isNext = label === "Next step";

          return (
            <li key={label}>
              <div
                className={
                  isNext
                    ? "rounded-md border border-border bg-surface-dark px-4 py-3 text-center text-white"
                    : isPath
                      ? "rounded-md border border-accent/30 bg-brand-soft px-4 py-3 text-center"
                      : "rounded-md border border-border bg-surface-muted px-4 py-3 text-center"
                }
              >
                <p
                  className={
                    isNext
                      ? "text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-white/60"
                      : isPath
                        ? "text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-accent-text"
                        : "text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-subtle"
                  }
                >
                  {label}
                </p>
              </div>
              {!isLast ? (
                <div className="flex justify-center py-2 text-subtle">↓</div>
              ) : null}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export default function ProjectPlannerPage() {
  return (
    <>
      <StructuredData
        data={[
          webPageJsonLd({
            name: pageTitle,
            description: pageDescription,
            path: "/project-planner",
          }),
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Project Planner", path: "/project-planner" },
          ]),
        ]}
      />

      <section className="border-b border-border bg-surface-muted">
        <Container className="!pt-10 !pb-12 sm:!pb-14 lg:!pb-16">
          <Breadcrumbs
            items={[
              { label: "Home", href: "/" },
              { label: "Project Planner" },
            ]}
          />

          <div className="mt-8 grid items-center gap-10 lg:grid-cols-[minmax(0,0.58fr)_minmax(0,0.42fr)] lg:gap-14">
            <div className="min-w-0">
              <p className="eyebrow">Project Planner</p>
              <h1 className="mt-4 max-w-2xl font-display text-[clamp(3rem,5vw,4.25rem)] font-semibold leading-[1.06] tracking-tight text-foreground">
                Not Sure What Your Website Actually Needs?
              </h1>
              <p className="mt-5 max-w-xl text-base leading-[1.7] text-muted sm:text-lg">
                Answer a few questions about what you&apos;re building, what
                exists today and what needs to improve. We&apos;ll help you
                narrow the project before you start choosing services or
                platforms.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild size="lg">
                  <a href="#planner">Plan My Project</a>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href="/contact">Already Know What You Need?</Link>
                </Button>
              </div>
            </div>

            <DecisionFlowVisual />
          </div>
        </Container>
      </section>

      <Section className="!py-8 sm:!py-10">
        <Container>
          <p className="mx-auto max-w-3xl text-center text-[0.9375rem] leading-relaxed text-muted sm:text-base">
            This planner narrows the type of project based on your current
            website, goals and expected level of change. It does not estimate
            cost or replace a technical audit.
          </p>
        </Container>
      </Section>

      <Section className="!pt-0 !pb-12 sm:!pb-14">
        <Container size="interactive">
          <ProjectPlanner />
        </Container>
      </Section>

      <Section tone="muted" className="!py-12 sm:!py-14">
        <Container>
          <SectionHeader
            eyebrow="How it works"
            title="Three steps to a clearer project path"
            description="A short sequence — not a questionnaire for its own sake."
          />
          <ol className="mt-10 grid gap-6 sm:grid-cols-3">
            {howItWorks.map((item) => (
              <li key={item.step} className="min-w-0">
                <p className="font-display text-2xl font-semibold tracking-tight text-accent-text sm:text-3xl">
                  {item.step}
                </p>
                <h3 className="mt-3 font-display text-xl font-semibold tracking-tight text-foreground sm:text-[1.375rem]">
                  {item.title}
                </h3>
                <p className="mt-2 text-[0.9375rem] leading-relaxed text-muted sm:text-base">
                  {item.body}
                </p>
              </li>
            ))}
          </ol>
        </Container>
      </Section>

      <Section className="!py-12 sm:!py-14">
        <Container>
          <div>
            <SectionHeader
              eyebrow="About this planner"
              title="Clarify the project before you choose the work"
            />

            <div className="mt-8 space-y-6 text-base leading-[1.7] text-muted sm:text-[1.0625rem]">
              <p>
                The Website Project Planner is for business owners and teams who
                know something needs to change on their website, but are unsure
                whether that means targeted improvements, a redesign, a new
                build, a platform migration or a growth-focused engagement.
              </p>

              <div>
                <h3 className="font-display text-lg font-semibold tracking-tight text-foreground sm:text-xl">
                  Improve, redesign, build, migrate or grow
                </h3>
                <ul className="mt-3 space-y-3">
                  <li>
                    <span className="font-semibold text-foreground">
                      Improve
                    </span>{" "}
                    — the current site is usable; focused fixes may be enough.
                  </li>
                  <li>
                    <span className="font-semibold text-foreground">
                      Redesign
                    </span>{" "}
                    — the foundation still has value, but structure, content and
                    experience need broader change.
                  </li>
                  <li>
                    <span className="font-semibold text-foreground">Build</span>{" "}
                    — there is no useful starting site, or planning should start
                    like a new website.
                  </li>
                  <li>
                    <span className="font-semibold text-foreground">
                      Migration
                    </span>{" "}
                    — changing platform, CMS or technical foundation is central
                    to the project.
                  </li>
                  <li>
                    <span className="font-semibold text-foreground">Grow</span>{" "}
                    — the site works; the priority is SEO, conversion, commerce
                    or ongoing improvement.
                  </li>
                </ul>
              </div>

              <p>
                After you finish the planner, you get a suggested path and
                practical next steps — such as drafting a brief, reviewing
                platform fit, reading a relevant guide or discussing scope. It
                is a planning aid, not a quote or a commitment.
              </p>

              <p>
                This is not the{" "}
                <Link
                  href="/templates/website-project-brief-template"
                  className="font-semibold text-accent-text hover:underline"
                >
                  Project Brief Template
                </Link>{" "}
                and not the{" "}
                <Link
                  href="/tools/website-platform-selector"
                  className="font-semibold text-accent-text hover:underline"
                >
                  Platform Selector
                </Link>
                . Use the planner first when the type of project is still
                unclear; use those tools once direction and requirements need
                more detail.
              </p>
            </div>
          </div>
        </Container>
      </Section>

      <Section tone="muted" className="!py-12 sm:!py-14">
        <Container>
          <h2 className="font-display text-[1.5rem] font-semibold tracking-tight sm:text-[1.75rem]">
            Related planning resources
          </h2>
          <ul className="mt-6 grid gap-6 sm:grid-cols-2">
            {relatedResources.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="font-semibold text-accent-text hover:underline"
                >
                  {item.label}
                </Link>
                <p className="mt-1 text-sm leading-relaxed text-muted">
                  {item.description}
                </p>
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      <CTASection
        title="Ready to Discuss the Project?"
        description="If the planner pointed you in a useful direction, tell us what you are trying to improve. We will look at the requirements before recommending next steps."
        primaryLabel="Tell Us About Your Project"
        primaryHref="/contact"
        secondaryLabel="Use the Project Brief Template"
        secondaryHref="/templates/website-project-brief-template"
      />
    </>
  );
}
