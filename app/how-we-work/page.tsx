import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { CTASection } from "@/components/ui/cta-section";
import { StructuredData } from "@/components/ui/structured-data";
import { buildPageMetadata } from "@/lib/seo";
import { breadcrumbJsonLd } from "@/lib/structured-data";
import {
  howWeWorkBeforeProject,
  howWeWorkJourney,
  homepageProcessSteps,
  clientPortalHighlights,
  howWeWorkTechnology,
} from "@/lib/public/how-we-work-content";
import { PUBLIC_CTAS } from "@/lib/public/cta-map";

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata({
    title: "How We Work",
    description:
      "See how Smartlance plans, delivers and supports website projects — from free tools and discovery through launch and ongoing improvement.",
    path: "/how-we-work",
  });
}

export default function HowWeWorkPage() {
  return (
    <>
      <StructuredData
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "How We Work", path: "/how-we-work" },
        ])}
      />

      <section className="section-padding bg-surface">
        <Container>
          <div className="max-w-3xl">
            <p className="eyebrow">How we work</p>
            <h1 className="heading-page mt-3 font-display font-semibold">
              A Clear Process From Idea to Launch — and Beyond
            </h1>
            <p className="section-deck mt-6">
              Every project is different, but the way we work is structured so
              clients know what is happening, what we need, and what comes next.
            </p>
          </div>
        </Container>
      </section>

      <section className="section-padding border-t border-border bg-[#FAF9F7]">
        <Container>
          <h2 className="heading-section font-display font-semibold">
            Before a project starts
          </h2>
          <p className="section-deck mt-4 max-w-2xl">
            Not every visitor needs the same starting point. Choose the path
            that fits where you are today.
          </p>
          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            {howWeWorkBeforeProject.map((item) => (
              <article
                key={item.href}
                className="rounded-lg border border-border bg-surface p-6"
              >
                <h3 className="font-display text-xl font-semibold">{item.title}</h3>
                <p className="body-copy mt-3">{item.description}</p>
                <Link href={item.href} className="link-action mt-5 inline-block">
                  {item.cta} →
                </Link>
              </article>
            ))}
          </div>
        </Container>
      </section>

      <section className="section-padding bg-surface">
        <Container>
          <h2 className="heading-section font-display font-semibold">
            How Smartlance works
          </h2>
          <ol className="mt-10 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {homepageProcessSteps.map((step) => (
              <li key={step.title} className="border-t border-border pt-6">
                <span className="ordinal-marker">
                  {String(step.step).padStart(2, "0")}
                </span>
                <h3 className="mt-3 font-display text-xl font-semibold">{step.title}</h3>
                <p className="body-copy mt-2.5">{step.description}</p>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      <section className="section-padding border-t border-border bg-[#FAF9F7]">
        <Container>
          <h2 className="heading-section font-display font-semibold">
            The client journey
          </h2>
          <div className="mt-10 space-y-8">
            {howWeWorkJourney.map((step, index) => (
              <article
                key={step.title}
                className="grid gap-4 border-t border-border pt-6 md:grid-cols-[4rem_minmax(0,1fr)]"
              >
                <span className="ordinal-marker">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3 className="font-display text-xl font-semibold">{step.title}</h3>
                  <p className="body-copy mt-2">{step.description}</p>
                </div>
              </article>
            ))}
          </div>
        </Container>
      </section>

      <section className="section-padding border-t border-border bg-[#FAF9F7]">
        <Container>
          <h2 className="heading-section font-display font-semibold">
            {howWeWorkTechnology.title}
          </h2>
          <p className="section-deck mt-4 max-w-3xl">{howWeWorkTechnology.body}</p>
          <div className="mt-10 grid gap-8 lg:grid-cols-2">
            <div>
              <h3 className="font-display text-lg font-semibold">
                AI / automation discovery
              </h3>
              <ul className="mt-4 space-y-2 text-muted">
                {howWeWorkTechnology.discovery.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-display text-lg font-semibold">
                Automation delivery
              </h3>
              <ul className="mt-4 space-y-2 text-muted">
                {howWeWorkTechnology.delivery.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </Container>
      </section>

      <section className="section-padding bg-surface">
        <Container>
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <h2 className="heading-section font-display font-semibold">
                Your project doesn&apos;t disappear into email threads
              </h2>
              <p className="section-deck mt-4">
                Clients use a structured portal for projects, approvals, files,
                documents and billing — so the work stays organized instead of
                scattered across messages.
              </p>
              <ul className="mt-6 space-y-3">
                {clientPortalHighlights.map((item) => (
                  <li key={item} className="text-muted">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-lg border border-border bg-[#FAF9F7] p-6">
              <p className="text-sm font-semibold text-muted">Client portal preview</p>
              <p className="mt-2 font-display text-lg font-semibold">Project workspace</p>
              <p className="mt-6 text-sm text-muted">
                Safe demo layout — no live client data shown on public pages.
              </p>
            </div>
          </div>
        </Container>
      </section>

      <CTASection
        title="Ready to talk about your website?"
        description="Tell us what you are building, redesigning or trying to improve."
        primaryLabel={PUBLIC_CTAS.project.label}
        primaryHref={PUBLIC_CTAS.project.href}
        secondaryLabel={PUBLIC_CTAS.freeReview.label}
        secondaryHref={PUBLIC_CTAS.freeReview.href}
      />
    </>
  );
}
