import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { ProjectCard } from "@/components/ui/project-card";
import {
  aboutApproachChain,
  aboutDontOptimizeFor,
  aboutIndustries,
  aboutProcessSteps,
  aboutValues,
  aboutWorkingWith,
} from "@/data/about";
import { getPublishedTeam } from "@/data/testimonials";
import type { Project, Testimonial } from "@/types";
import { cn } from "@/lib/utils";

export function AboutWho() {
  return (
    <Section className="!py-14 sm:!py-16 lg:!py-[4.5rem]">
      <Container>
        <div className="grid gap-10 lg:grid-cols-[minmax(0,0.42fr)_minmax(0,0.58fr)] lg:gap-16 xl:gap-20">
          <div>
            <p className="eyebrow">What we actually do</p>
            <h2 className="mt-4 font-display text-[1.875rem] font-semibold leading-tight sm:text-4xl lg:text-[2.75rem]">
              Smartlance Designs at a glance
            </h2>
          </div>
          <div className="max-w-xl space-y-5 text-[1.0625rem] leading-[1.75] text-muted sm:text-lg">
            <p>
              Smartlance helps businesses improve their online presence through
              website design, development, SEO and conversion-focused strategy.
            </p>
            <p>
              The goal is not simply to make a website look different. The goal
              is to improve clarity, trust, discoverability, usability,
              conversion and long-term maintainability — so the site can keep
              working after launch.
            </p>
            <p>
              Design, structure, SEO and conversion are planned together, because
              each one affects how effectively visitors find the site, understand
              the offer and take the next step.
            </p>
          </div>
        </div>
      </Container>
    </Section>
  );
}

export function AboutPhilosophy() {
  return (
    <Section tone="muted" className="!py-14 sm:!py-16 lg:!py-[4.5rem]">
      <Container>
        <div className="mx-auto max-w-3xl text-center">
          <p className="eyebrow">Why we approach websites differently</p>
          <h2 className="mt-4 font-display text-[1.875rem] font-semibold leading-tight sm:text-4xl">
            A website is not separate from SEO, structure or conversion.
          </h2>
          <div className="mt-6 space-y-4 text-left text-[1.0625rem] leading-[1.75] text-muted sm:text-center sm:text-lg">
            <p>
              Many businesses commission a redesign, then hire someone later to
              “do SEO”. That split usually produces a site that looks better but
              still struggles to rank or convert.
            </p>
            <p>
              Design is not separate from conversion. Development is not separate
              from performance. SEO is not separate from structure. All of these
              influence how effectively the website works — so we plan them
              together while the site is being shaped.
            </p>
          </div>
        </div>

        <ol className="mx-auto mt-12 flex max-w-4xl flex-col gap-0 sm:mt-14">
          {aboutApproachChain.map((item, index) => (
            <li key={item.title} className="relative flex gap-4 sm:gap-6">
              <div className="flex w-10 shrink-0 flex-col items-center sm:w-12">
                <span className="flex h-10 w-10 items-center justify-center rounded-full border border-accent/40 bg-surface font-display text-sm font-semibold text-accent-text sm:h-11 sm:w-11">
                  {String(index + 1).padStart(2, "0")}
                </span>
                {index < aboutApproachChain.length - 1 ? (
                  <span
                    className="mt-1 w-px flex-1 bg-accent/35"
                    aria-hidden
                  />
                ) : null}
              </div>
              <div
                className={cn(
                  "min-w-0 pb-8",
                  index === aboutApproachChain.length - 1 && "pb-0",
                )}
              >
                <h3 className="font-display text-xl font-semibold text-foreground sm:text-[1.375rem]">
                  {item.title}
                </h3>
                <p className="mt-1.5 text-base text-muted sm:text-[1.0625rem]">
                  {item.note}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </Container>
    </Section>
  );
}

export function AboutValues() {
  return (
    <Section className="!py-14 sm:!py-16 lg:!py-[4.5rem]">
      <Container>
        <div className="max-w-2xl">
          <p className="eyebrow">How Smartlance thinks</p>
          <h2 className="mt-4 font-display text-[1.875rem] font-semibold sm:text-4xl">
            What we value in every project
          </h2>
          <p className="mt-4 text-[1.0625rem] leading-relaxed text-muted sm:text-lg">
            These principles guide decisions before design polish — so the
            finished site is easier to find, easier to use and easier to improve.
          </p>
        </div>

        <ul className="mt-12 grid gap-x-8 gap-y-10 border-t border-border pt-10 sm:grid-cols-2 lg:grid-cols-3">
          {aboutValues.map((item, index) => (
            <li key={item.title}>
              <span className="font-display text-lg font-semibold tabular-nums text-accent-text">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-3 font-display text-xl font-semibold sm:text-[1.375rem]">
                {item.title}
              </h3>
              <p className="mt-2.5 text-[1.0625rem] leading-relaxed text-muted">
                {item.description}
              </p>
            </li>
          ))}
        </ul>
      </Container>
    </Section>
  );
}

export function AboutExperience() {
  return (
    <Section tone="muted" className="!py-14 sm:!py-16 lg:!py-[4.5rem]">
      <Container>
        <div className="grid gap-10 lg:grid-cols-[minmax(0,0.4fr)_minmax(0,0.6fr)] lg:gap-16">
          <div>
            <p className="eyebrow">Real project experience</p>
            <h2 className="mt-4 font-display text-[1.875rem] font-semibold leading-tight sm:text-4xl">
              Experience across property, hospitality and service businesses
            </h2>
            <p className="mt-5 text-[1.0625rem] leading-relaxed text-muted sm:text-lg">
              Smartlance has delivered WordPress website projects for hospitality,
              short-term rentals, cabin rentals, property management, real estate
              and related service businesses. That experience informs how we
              approach clarity, booking journeys and search foundations — without
              limiting who we can help.
            </p>
          </div>
          <ul className="grid gap-0 border-t border-border sm:grid-cols-2">
            {aboutIndustries.map((item) => (
              <li
                key={item.title}
                className="border-b border-border py-5 sm:odd:border-r sm:odd:pr-6 sm:even:pl-6"
              >
                <h3 className="font-display text-lg font-semibold text-foreground">
                  {item.title}
                </h3>
                <p className="mt-1.5 text-base text-muted">{item.description}</p>
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </Section>
  );
}

export function AboutSelectedWork({ projects }: { projects: Project[] }) {
  if (projects.length === 0) return null;

  return (
    <Section className="!py-14 sm:!py-16 lg:!py-[4.5rem]">
      <Container>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-2xl">
            <p className="eyebrow">Selected work</p>
            <h2 className="mt-4 font-display text-[1.875rem] font-semibold sm:text-4xl">
              Work that shaped our approach
            </h2>
            <p className="mt-4 text-[1.0625rem] leading-relaxed text-muted sm:text-lg">
              Real websites for hospitality, property and service businesses —
              not stock mockups.
            </p>
          </div>
          <Link
            href="/work"
            className="text-base font-semibold text-accent-text hover:underline"
          >
            View all work →
          </Link>
        </div>
        <div className="mt-10 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard
              key={project.slug}
              project={project}
              variant="featured"
            />
          ))}
        </div>
      </Container>
    </Section>
  );
}

export function AboutWorkingWith() {
  return (
    <Section tone="muted" className="!py-14 sm:!py-16 lg:!py-[4.5rem]">
      <Container>
        <div className="max-w-2xl">
          <p className="eyebrow">Client relationship</p>
          <h2 className="mt-4 font-display text-[1.875rem] font-semibold sm:text-4xl">
            What working with Smartlance looks like
          </h2>
          <p className="mt-4 text-[1.0625rem] leading-relaxed text-muted sm:text-lg">
            Beyond the deliverables, clients should expect a clear process and
            practical guidance — not opaque agency theatre.
          </p>
        </div>
        <ul className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {aboutWorkingWith.map((item, index) => (
            <li key={item.title} className="border-t-2 border-accent/45 pt-5">
              <span className="font-display text-sm font-semibold tabular-nums text-accent-text">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-3 font-display text-xl font-semibold">
                {item.title}
              </h3>
              <p className="mt-2.5 text-[1.0625rem] leading-relaxed text-muted">
                {item.description}
              </p>
            </li>
          ))}
        </ul>
      </Container>
    </Section>
  );
}

export function AboutProcess() {
  return (
    <Section className="!py-14 sm:!py-16 lg:!py-[4.5rem]">
      <Container>
        <div className="max-w-2xl">
          <p className="eyebrow">How the work happens</p>
          <h2 className="mt-4 font-display text-[1.875rem] font-semibold sm:text-4xl">
            How projects usually move
          </h2>
          <p className="mt-4 text-[1.0625rem] leading-relaxed text-muted sm:text-lg">
            A straightforward path from discovery to launch — with room to keep
            improving after go-live.
          </p>
        </div>
        <ol className="mt-12 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {aboutProcessSteps.map((step) => (
            <li key={step.title} className="border-t border-border pt-5">
              <span className="font-display text-2xl font-semibold tabular-nums text-accent-text sm:text-3xl">
                {String(step.step).padStart(2, "0")}
              </span>
              <h3 className="mt-3 font-display text-xl font-semibold sm:text-[1.375rem]">
                {step.title}
              </h3>
              <p className="mt-2.5 text-[1.0625rem] leading-relaxed text-muted">
                {step.description}
              </p>
            </li>
          ))}
        </ol>
      </Container>
    </Section>
  );
}

export function AboutDontOptimize() {
  return (
    <Section tone="muted" className="!py-12 sm:!py-14">
      <Container>
        <div className="grid gap-8 lg:grid-cols-[minmax(0,0.38fr)_minmax(0,0.62fr)] lg:gap-16">
          <div>
            <p className="eyebrow">Positioning</p>
            <h2 className="mt-3 font-display text-2xl font-semibold sm:text-3xl">
              What we don’t optimize for
            </h2>
          </div>
          <ul className="border-t border-border">
            {aboutDontOptimizeFor.map((item) => (
              <li
                key={item.title}
                className="border-b border-border py-5 sm:py-6"
              >
                <h3 className="font-display text-lg font-semibold text-foreground">
                  {item.title}
                </h3>
                <p className="mt-1.5 text-base leading-relaxed text-muted">
                  {item.description}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </Section>
  );
}

export function AboutTestimonial({
  testimonial,
}: {
  testimonial: Testimonial | null;
}) {
  if (!testimonial?.quote?.trim()) return null;

  const words = testimonial.quote.trim().split(/\s+/);
  const excerpt =
    words.length > 55 ? `${words.slice(0, 55).join(" ")}…` : testimonial.quote;

  return (
    <Section tone="dark" className="!py-14 sm:!py-16 lg:!py-[4.5rem]">
      <Container>
          <p className="text-[0.8125rem] font-semibold uppercase tracking-[0.14em] text-orange-300">
            Client feedback
          </p>
          <blockquote className="mt-6 font-display text-[clamp(1.5rem,2.8vw,2.25rem)] font-medium leading-[1.35] text-white">
            “{excerpt}”
          </blockquote>
          <footer className="mt-8 text-base text-white/70 sm:text-[1.0625rem]">
            <cite className="not-italic font-semibold text-white">
              {testimonial.name}
            </cite>
            {testimonial.company ? (
              <span className="mt-1.5 block">{testimonial.company}</span>
            ) : null}
            {testimonial.projectSlug ? (
              <Link
                href={`/work/${testimonial.projectSlug}`}
                className="mt-4 inline-block font-semibold text-orange-300 hover:underline"
              >
                View related project →
              </Link>
            ) : null}
          </footer>
      </Container>
    </Section>
  );
}

/** Renders only when verified team members exist — no placeholders */
export function AboutTeam() {
  const team = getPublishedTeam();
  if (team.length === 0) return null;

  return (
    <Section className="!py-14 sm:!py-16">
      <Container>
        <div className="max-w-2xl">
          <p className="eyebrow">People</p>
          <h2 className="mt-4 font-display text-[1.875rem] font-semibold sm:text-4xl">
            Who you work with
          </h2>
        </div>
        <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {team.map((member) => (
            <article key={member.id} className="border-t border-border pt-5">
              <h3 className="font-display text-xl font-semibold">
                {member.name}
              </h3>
              <p className="mt-1 text-base text-accent-text">{member.role}</p>
              {member.bio ? (
                <p className="mt-3 text-[1.0625rem] leading-relaxed text-muted">
                  {member.bio}
                </p>
              ) : null}
            </article>
          ))}
        </div>
      </Container>
    </Section>
  );
}
