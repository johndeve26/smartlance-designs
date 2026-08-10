import type { Metadata } from "next";
import { CTASection } from "@/components/ui/cta-section";
import { StructuredData } from "@/components/ui/structured-data";
import {
  PricingBriefAndReview,
  PricingEngagementPaths,
  PricingEntryPoints,
  PricingFaqSection,
  PricingHero,
  PricingIncluded,
  PricingPracticalNotes,
  PricingPrinciple,
  PricingProcess,
  PricingRelated,
  PricingScopeExamples,
  PricingScopeFactors,
  PricingScopeLevers,
  PricingScopeMatrix,
} from "@/components/pricing/pricing-sections";
import { faqs as pricingFaqs } from "@/data/pricing";
import type { ManagedPageHeroCopy } from "@/lib/managed-pages/hero";
import { buildManagedPageMetadata } from "@/lib/seo";
import {
  breadcrumbJsonLd,
  faqJsonLd,
  webPageJsonLd,
} from "@/lib/structured-data";
import { getPublicSettings } from "@/lib/repositories/siteSettingsRepository";
import { getPublishedManagedPageByKey } from "@/lib/public/cache";
import {
  MANAGED_PAGE_HERO_DEFAULTS,
  resolveManagedPageHero,
} from "@/lib/managed-pages/hero";

export async function generateMetadata(): Promise<Metadata> {
  return buildManagedPageMetadata("pricing", {
    title: "Website Pricing & Project Scope",
    description:
      "Understand what affects website design, development, redesign and SEO project costs, how Smartlance scopes work, and what happens before you receive a proposal.",
    path: "/pricing",
  });
}

export default async function PricingPage() {
  const settings = await getPublicSettings();
  const managedPage = await getPublishedManagedPageByKey("pricing");
  const hero = resolveManagedPageHero(
    MANAGED_PAGE_HERO_DEFAULTS.pricing,
    managedPage,
  );
  return (
    <>
      <StructuredData
        data={[
          webPageJsonLd({
            name: "Website Pricing & Project Scope",
            description:
              "Understand what affects website design, development, redesign and SEO project costs, how Smartlance scopes work, and what happens before you receive a proposal.",
            path: "/pricing",
          }),
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Pricing", path: "/pricing" },
          ]),
          faqJsonLd(pricingFaqs),
        ]}
      />

      <PricingHero hero={hero} />
      <PricingPrinciple showPublicPricing={settings.showPublicPricing} />
      <PricingScopeFactors />
      <PricingEngagementPaths />
      <PricingScopeExamples />
      <PricingIncluded />
      <PricingScopeMatrix />
      <PricingScopeLevers />
      <PricingProcess />
      <PricingBriefAndReview />
      <PricingPracticalNotes />
      <PricingEntryPoints />
      <PricingRelated />
      <PricingFaqSection />

      <CTASection
        title="Ready to Define the Right Scope?"
        description="Tell us what you're trying to build or improve. We'll look at the requirements before recommending the level of work."
        primaryLabel="Tell Us About Your Project"
        primaryHref="/contact"
        secondaryLabel="Use the Project Brief Template"
        secondaryHref="/templates/website-project-brief-template"
      />
    </>
  );
}
