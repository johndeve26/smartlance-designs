import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { FAQ } from "@/components/ui/faq";
import { ContactForm } from "@/components/forms/contact-form";
import { StructuredData } from "@/components/ui/structured-data";
import { TrackedMailto, TrackedTel } from "@/components/forms/tracked-links";
import { contactFaqs } from "@/data/testimonials";
import { companyDetails } from "@/data/navigation";
import { buildManagedPageMetadata } from "@/lib/seo";
import { breadcrumbJsonLd, faqJsonLd } from "@/lib/structured-data";
import { getPublicSettings } from "@/lib/repositories/siteSettingsRepository";
import { getPublishedManagedPageByKey } from "@/lib/managed-pages/public";
import {
  MANAGED_PAGE_HERO_DEFAULTS,
  resolveManagedPageHero,
} from "@/lib/managed-pages/hero";

export async function generateMetadata(): Promise<Metadata> {
  return buildManagedPageMetadata("contact", {
    title: "Contact",
    description:
      "Contact Smartlance Designs to start a website, SEO or conversion project — or request practical guidance on your next step.",
    path: "/contact",
  });
}

const goodToKnow = [
  "You do not need a finished project brief before getting in touch.",
  "Existing websites can be reviewed before recommending a redesign.",
  "If you are unsure which service fits, choose “Not Sure Yet” in the form.",
] as const;

export default async function ContactPage() {
  const settings = await getPublicSettings();
  const managedPage = await getPublishedManagedPageByKey("contact");
  const hero = resolveManagedPageHero(
    MANAGED_PAGE_HERO_DEFAULTS.contact,
    managedPage,
  );
  const formEnabled = settings.contactFormEnabled;
  return (
    <>
      <StructuredData
        data={[
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Contact", path: "/contact" },
          ]),
          faqJsonLd(contactFaqs),
        ]}
      />

      <Section className="!pt-10 !pb-12 sm:!pb-14 lg:!pb-16">
        <Container>
          <Breadcrumbs
            items={[{ label: "Home", href: "/" }, { label: "Contact" }]}
          />

          <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,0.42fr)_minmax(0,0.58fr)] lg:items-start lg:gap-14 xl:gap-16">
            <div className="min-w-0">
              <p className="eyebrow">{hero.eyebrow}</p>
              <h1 className="mt-3 font-display text-[clamp(2.5rem,4.5vw,4.5rem)] font-semibold leading-[1.05] tracking-tight text-foreground">
                {hero.headline}
              </h1>
              <p className="mt-5 max-w-md text-lg leading-relaxed text-muted sm:text-xl">
                {hero.supporting}
              </p>

              <dl className="mt-9 space-y-6 border-t border-border pt-8">
                <div>
                  <dt className="text-[0.8125rem] font-semibold uppercase tracking-[0.12em] text-subtle">
                    Email
                  </dt>
                  <dd className="mt-2">
                    <TrackedMailto
                      email={companyDetails.email}
                      className="text-[1.0625rem] font-medium text-accent-text hover:underline sm:text-lg"
                    />
                  </dd>
                </div>
                {companyDetails.phone ? (
                  <div>
                    <dt className="text-[0.8125rem] font-semibold uppercase tracking-[0.12em] text-subtle">
                      Phone
                    </dt>
                    <dd className="mt-2">
                      <TrackedTel
                        phone={companyDetails.phone}
                        className="text-[1.0625rem] font-medium text-foreground hover:text-accent-text hover:underline sm:text-lg"
                      />
                    </dd>
                  </div>
                ) : null}
                <div>
                  <dt className="text-[0.8125rem] font-semibold uppercase tracking-[0.12em] text-subtle">
                    Not sure where to start?
                  </dt>
                  <dd className="mt-2">
                    <Link
                      href="/free-website-review"
                      className="text-[1.0625rem] font-semibold text-accent-text hover:underline sm:text-lg"
                    >
                      Request a Free Website Review →
                    </Link>
                  </dd>
                </div>
              </dl>

              <div className="mt-10 max-w-md">
                <p className="text-[0.8125rem] font-semibold uppercase tracking-[0.12em] text-subtle">
                  Good to know
                </p>
                <ul className="mt-4 space-y-3">
                  {goodToKnow.map((item) => (
                    <li
                      key={item}
                      className="flex gap-3 text-base leading-relaxed text-muted"
                    >
                      <span
                        className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent"
                        aria-hidden
                      />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-5 text-sm leading-relaxed text-muted">
                  Still defining the project?{" "}
                  <Link
                    href="/project-planner"
                    className="font-semibold text-accent-text hover:underline"
                  >
                    Plan Your Project
                  </Link>
                </p>
                <p className="mt-3 text-sm leading-relaxed text-muted">
                  Need to organize requirements?{" "}
                  <Link
                    href="/templates/website-project-brief-template"
                    className="font-semibold text-accent-text hover:underline"
                  >
                    Use the Project Brief Template
                  </Link>
                </p>
                <p className="mt-3 text-sm leading-relaxed text-muted">
                  Already have a site and want initial feedback?{" "}
                  <Link
                    href="/free-website-review"
                    className="font-semibold text-accent-text hover:underline"
                  >
                    Get a Free Website Review
                  </Link>
                </p>
                <p className="mt-3 text-sm leading-relaxed text-muted">
                  Not sure how projects are scoped?{" "}
                  <Link
                    href="/pricing"
                    className="font-semibold text-accent-text hover:underline"
                  >
                    View Pricing &amp; Project Scope
                  </Link>
                </p>
              </div>
            </div>

            <div className="min-w-0 rounded-xl border border-border bg-surface p-5 shadow-sm sm:p-7 lg:p-8">
              <div className="mb-7 max-w-md">
                <h2 className="font-display text-2xl font-semibold text-foreground sm:text-[1.75rem]">
                  Tell Us About Your Project
                </h2>
                <p className="mt-2 text-base leading-relaxed text-muted">
                  A few details will help us understand what you need.
                </p>
              </div>
              {formEnabled ? (
                <ContactForm
                  responseExpectation={settings.presentation.responseExpectation}
                />
              ) : (
                <div
                  className="rounded-md border border-border bg-surface-muted px-4 py-5"
                  role="status"
                >
                  <p className="text-sm leading-relaxed text-muted">
                    The contact form is temporarily unavailable. Email us at{" "}
                    <TrackedMailto
                      email={settings.email}
                      className="font-medium text-accent-text hover:underline"
                    />
                    {settings.phone ? (
                      <>
                        {" "}
                        or call{" "}
                        <TrackedTel
                          phone={settings.phone}
                          className="font-medium text-accent-text hover:underline"
                        />
                      </>
                    ) : null}
                    .
                  </p>
                </div>
              )}
            </div>
          </div>
        </Container>
      </Section>

      <Section tone="muted" className="!py-10 sm:!py-12">
        <Container>
          <dl className="grid gap-6 sm:grid-cols-3 sm:gap-8">
            <div>
              <dt className="text-[0.8125rem] font-semibold uppercase tracking-[0.12em] text-subtle">
                Experience
              </dt>
              <dd className="mt-2 font-display text-xl font-semibold text-foreground">
                5+ years
              </dd>
            </div>
            <div>
              <dt className="text-[0.8125rem] font-semibold uppercase tracking-[0.12em] text-subtle">
                Published work
              </dt>
              <dd className="mt-2 font-display text-xl font-semibold text-foreground">
                Real website projects
              </dd>
            </div>
            <div>
              <dt className="text-[0.8125rem] font-semibold uppercase tracking-[0.12em] text-subtle">
                Focus
              </dt>
              <dd className="mt-2 font-display text-xl font-semibold text-foreground">
                Website + SEO + Conversion
              </dd>
            </div>
          </dl>
        </Container>
      </Section>

      <Section className="!py-14 sm:!py-16 lg:!py-[4.5rem]">
        <Container>
          <div>
            <p className="eyebrow">Common questions</p>
            <h2 className="mt-3 font-display text-3xl font-semibold sm:text-4xl">
              Before you get in touch
            </h2>
            <p className="mt-4 text-base leading-relaxed text-muted sm:text-lg">
              A few answers that help if you are deciding how to start.
            </p>
            <div className="mt-8">
              <FAQ items={contactFaqs} />
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
