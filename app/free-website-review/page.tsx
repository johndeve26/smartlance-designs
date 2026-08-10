import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { WebsiteReviewForm } from "@/components/forms/website-review-form";
import { InteractiveWebsiteReviewForm } from "@/components/prospect/InteractiveWebsiteReviewForm";
import { StructuredData } from "@/components/ui/structured-data";
import { SecondaryHelpers } from "@/components/connections/connection-links";
import { freeReviewNextSteps } from "@/data/site-relationships";
import { reviewChecklist } from "@/data/home";
import { buildManagedPageMetadata } from "@/lib/seo";
import { breadcrumbJsonLd } from "@/lib/structured-data";
import { getPublicSettings } from "@/lib/repositories/siteSettingsRepository";
import { TrackedMailto } from "@/components/forms/tracked-links";

export async function generateMetadata(): Promise<Metadata> {
  return buildManagedPageMetadata("free-website-review", {
    title: "Free Website Review",
    description:
      "Request a free website review covering search visibility, technical SEO, speed, mobile usability, page structure and conversion friction.",
    path: "/free-website-review",
  });
}

export default async function FreeWebsiteReviewPage() {
  const settings = await getPublicSettings();
  const formEnabled = settings.freeReviewFormEnabled;
  return (
    <>
      <StructuredData
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Free Website Review", path: "/free-website-review" },
        ])}
      />
      <Section className="!pt-10 !pb-12">
        <Container>
          <Breadcrumbs
            items={[
              { label: "Home", href: "/" },
              { label: "Free Website Review" },
            ]}
          />
          <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
            <div className="lg:order-2">
              <div className="rounded-lg border border-border bg-surface p-5 sm:p-7">
                <h2 className="text-section-heading">Review your website</h2>
                <p className="mt-2 text-body-sm">
                  Enter your URL and goals. Smartlance reviews key public pages and turns
                  findings into practical recommendations.
                </p>
                <div className="mt-6">
                  <InteractiveWebsiteReviewForm />
                </div>
              </div>
              <div id="human-review" className="mt-8 rounded-lg border border-border bg-surface p-5 sm:p-7">
                <h3 className="text-card-title">Prefer a human review from Smartlance?</h3>
                <p className="mt-1 text-body-sm">
                  Request a manual review and we will follow up by email.
                </p>
                <div className="mt-4">
                  {formEnabled ? (
                    <WebsiteReviewForm
                      responseExpectation={settings.presentation.responseExpectation}
                    />
                  ) : (
                    <div
                      className="rounded-md border border-border bg-surface-muted px-4 py-5"
                      role="status"
                    >
                      <p className="text-sm leading-relaxed text-muted">
                        The review request form is temporarily unavailable. Email
                        us at{" "}
                        <TrackedMailto
                          email={settings.email}
                          className="font-medium text-accent-text hover:underline"
                        />
                        .
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="lg:order-1">
              <p className="eyebrow">Existing websites</p>
              <h1 className="mt-3 text-4xl sm:text-5xl">Free Website Review</h1>
              <p className="mt-5 text-lg leading-relaxed text-muted">
                See what could be improved — and what to prioritize first.
              </p>
              <p className="mt-4 text-body-sm">
                Smartlance reviews key public pages, checks website foundations, and uses
                evidence-grounded AI to turn the findings into practical recommendations.
              </p>
              <div className="mt-6 border border-border bg-surface p-5">
                <p className="text-sm font-semibold text-foreground">
                  What the review typically covers
                </p>
                <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                  {reviewChecklist.map((item) => (
                    <li key={item.label}>
                      <p className="text-sm font-medium text-foreground">
                        {item.label}
                      </p>
                      <p className="text-xs text-muted">{item.detail}</p>
                    </li>
                  ))}
                </ul>
              </div>
              <p className="mt-5 text-sm leading-relaxed text-muted">
                This is a focused review to highlight priorities — not a full
                audit package. For a deeper diagnosis, ask about a{" "}
                <Link
                  href="/services/website-audit"
                  className="font-medium text-accent-text hover:underline"
                >
                  Website Audit
                </Link>
                .
              </p>
              <SecondaryHelpers
                heading="After you request a review"
                items={freeReviewNextSteps.filter(
                  (item) => item.href !== "/services/website-audit",
                )}
              />
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
