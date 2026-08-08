import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { BlogMarkdown } from "@/components/blog/blog-markdown";
import { getLegalPage, getLegalSlugs } from "@/lib/legal";
import { buildManagedPageMetadata } from "@/lib/seo";

const LEGAL_MANAGED_KEYS: Record<string, string> = {
  "terms-and-condition": "legal-terms",
  "privacy-statement": "legal-privacy",
  "accessibility-statement": "legal-accessibility",
};

type PageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return getLegalSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = getLegalPage(slug);
  if (!page) return {};
  const managedKey = LEGAL_MANAGED_KEYS[slug];
  if (managedKey) {
    return buildManagedPageMetadata(managedKey, {
      title: page.title,
      description: `${page.title} for Smartlance Designs.`,
      path: `/legal/${page.slug}`,
    });
  }
  return buildManagedPageMetadata("legal-terms", {
    title: page.title,
    description: `${page.title} for Smartlance Designs.`,
    path: `/legal/${page.slug}`,
  });
}

export default async function LegalPage({ params }: PageProps) {
  const { slug } = await params;
  const page = getLegalPage(slug);
  if (!page) notFound();

  return (
    <Section className="!pt-10">
      <Container narrow>
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: page.title },
          ]}
        />
        <h1 className="mt-4 text-4xl sm:text-5xl">{page.title}</h1>
        <div className="prose-smartlance mt-8">
          <BlogMarkdown content={page.content} />
        </div>
      </Container>
    </Section>
  );
}
