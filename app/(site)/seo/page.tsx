import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { SectionHeader } from "@/components/ui/section-header";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { FAQ } from "@/components/ui/faq";
import { CTASection } from "@/components/ui/cta-section";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { StructuredData } from "@/components/ui/structured-data";
import { seoServices, seoHubFaqs } from "@/data/seo";
import { buildMetadata } from "@/lib/seo";
import { breadcrumbJsonLd, faqJsonLd } from "@/lib/structured-data";

export const metadata: Metadata = buildMetadata({
  title: "SEO Services",
  description:
    "SEO that works with your website — technical foundations, content structure, local visibility, on-page optimization and measurement.",
  path: "/seo",
});

const integrationPoints = [
  {
    title: "Website architecture",
    text: "Page hierarchy and internal links that support how people search and decide.",
  },
  {
    title: "Technical SEO",
    text: "Crawlability, indexability, redirects, schema and Core Web Vitals.",
  },
  {
    title: "Content & on-page",
    text: "Titles, headings and copy that match intent without stuffing keywords.",
  },
  {
    title: "Local visibility",
    text: "Google Business Profile, local pages and location signals when relevant.",
  },
  {
    title: "Performance",
    text: "Speed and mobile usability as part of both SEO and user experience.",
  },
  {
    title: "Measurement",
    text: "Search Console and analytics so priorities stay grounded in evidence.",
  },
];

export default function SeoHubPage() {
  return (
    <>
      <StructuredData
        data={[
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "SEO", path: "/seo" },
          ]),
          faqJsonLd(seoHubFaqs),
        ]}
      />

      <Section className="!pt-10 !pb-10">
        <Container>
          <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "SEO" }]} />
          <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
            <div>
              <h1 className="max-w-3xl text-4xl sm:text-5xl">
                SEO Built Into the Website — Not Bolted On Later
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted">
                Organic search is an ongoing growth channel. It works best when
                your site structure, technical health, content and conversion
                paths are planned together.
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg">
                  <Link href="/seo/seo-audit">Start with an SEO Audit</Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href="/free-website-review">
                    Get a Free Website Review
                  </Link>
                </Button>
              </div>
            </div>
            <p className="border border-border bg-surface p-5 text-sm leading-relaxed text-muted">
              We do not promise #1 rankings. We improve the factors you can
              control — and measure progress honestly.
            </p>
          </div>
        </Container>
      </Section>

      <Section tone="muted">
        <Container>
          <SectionHeader
            title="Why SEO belongs in website projects"
            description="A strong offer on a weak technical foundation underperforms. So does a technically perfect site with unclear pages."
          />
          <div className="mt-8 grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
            {integrationPoints.map((item, index) => (
              <div key={item.title} className="border-t border-border pt-4">
                <p className="text-xs font-semibold text-accent-text">
                  {String(index + 1).padStart(2, "0")}
                </p>
                <h2 className="mt-2 font-display text-lg font-semibold">
                  {item.title}
                </h2>
                <p className="mt-2 text-sm text-muted">{item.text}</p>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      <Section>
        <Container>
          <SectionHeader title="SEO services" />
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {seoServices.map((service) => (
              <Link
                key={service.slug}
                href={service.href}
                className="group flex gap-4 border-b border-border py-5 hover:border-accent"
              >
                <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-accent-soft text-accent-text">
                  <Icon name={service.icon} />
                </div>
                <div>
                  <h2 className="font-display text-xl font-semibold group-hover:text-accent-text">
                    {service.title}
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-muted">
                    {service.summary}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </Container>
      </Section>

      <Section>
        <Container size="reading">
          <SectionHeader
            title="Platform SEO considerations"
            description="SEO requirements vary by platform — WordPress, Shopify and BigCommerce each need structure, performance and metadata handled differently."
          />
          <p className="mt-4 text-base leading-relaxed text-muted">
            Many Smartlance clients run on{" "}
            <Link href="/platforms/wordpress" className="font-semibold text-accent-text hover:underline">
              WordPress
            </Link>
            ,{" "}
            <Link href="/platforms/shopify" className="font-semibold text-accent-text hover:underline">
              Shopify
            </Link>
            {" "}or{" "}
            <Link href="/platforms/bigcommerce" className="font-semibold text-accent-text hover:underline">
              BigCommerce
            </Link>
            . Platform choice does not replace good SEO — it changes which technical and content issues matter most.
          </p>
          <div className="mt-6">
            <Button asChild variant="outline">
              <Link href="/platforms">View platform SEO support</Link>
            </Button>
          </div>
        </Container>
      </Section>

      <Section tone="muted">
        <Container size="reading">
          <SectionHeader title="Common questions" />
          <div className="mt-8">
            <FAQ items={seoHubFaqs} />
          </div>
        </Container>
      </Section>

      <CTASection
        title="Want clearer SEO priorities?"
        description="Start with an audit or a free website review. We will tell you what matters first."
        primaryLabel="Get a Free Website Review"
        primaryHref="/free-website-review"
        secondaryLabel="Contact Us"
        secondaryHref="/contact"
      />
    </>
  );
}
