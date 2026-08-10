import { assertPublicHttpUrl, safeFetchText } from "@/lib/ai/ssrf";
import type { ExtractedPage } from "@/lib/prospect/review/extract";
import { detectAnalyticsTags } from "@/lib/prospect/review/extract";

export type EvidenceInput = {
  category: string;
  type: string;
  label: string;
  valueText?: string | null;
  valueNumber?: number | null;
  booleanValue?: boolean | null;
  sourceUrl?: string | null;
  sourceSelector?: string | null;
  excerpt?: string | null;
};

export function runDeterministicChecks(
  pages: Array<{ url: string; extracted: ExtractedPage; html?: string }>,
): EvidenceInput[] {
  const evidence: EvidenceInput[] = [];
  const home = pages[0];
  if (!home) return evidence;

  const { extracted: page, url } = home;
  const html = home.html ?? "";

  evidence.push({
    category: "SEO Foundations",
    type: "page_title",
    label: "Page title",
    valueText: page.title,
    booleanValue: Boolean(page.title?.trim()),
    sourceUrl: url,
    sourceSelector: "title",
    excerpt: page.title?.slice(0, 120) ?? null,
  });

  evidence.push({
    category: "SEO Foundations",
    type: "meta_description",
    label: "Meta description",
    valueText: page.metaDescription,
    booleanValue: Boolean(page.metaDescription?.trim()),
    sourceUrl: url,
    excerpt: page.metaDescription?.slice(0, 160) ?? null,
  });

  evidence.push({
    category: "SEO Foundations",
    type: "canonical",
    label: "Canonical URL",
    valueText: page.canonical,
    booleanValue: Boolean(page.canonical),
    sourceUrl: url,
  });

  evidence.push({
    category: "Mobile Foundations",
    type: "viewport_meta",
    label: "Viewport meta tag",
    booleanValue: page.viewport,
    sourceUrl: url,
  });

  evidence.push({
    category: "Content Structure",
    type: "h1_count",
    label: "H1 headings on homepage",
    valueNumber: page.h1s.length,
    valueText: page.h1s.join(" | ") || null,
    sourceUrl: url,
    excerpt: page.h1s[0]?.slice(0, 120) ?? null,
  });

  evidence.push({
    category: "Content Structure",
    type: "navigation",
    label: "Navigation labels detected",
    valueText: page.navLabels.join(", ") || null,
    booleanValue: page.navLabels.length > 0,
    sourceUrl: url,
  });

  evidence.push({
    category: "Conversion",
    type: "cta_labels",
    label: "Call-to-action labels",
    valueText: page.ctaLabels.join(", ") || null,
    booleanValue: page.ctaLabels.length > 0,
    sourceUrl: url,
  });

  evidence.push({
    category: "Conversion",
    type: "forms",
    label: "Forms on homepage",
    valueNumber: page.formCount,
    booleanValue: page.formCount > 0,
    sourceUrl: url,
  });

  evidence.push({
    category: "Conversion",
    type: "contact_links",
    label: "Telephone or email links",
    valueText: [...page.telLinks, ...page.mailtoLinks].join(", ") || null,
    booleanValue: page.telLinks.length > 0 || page.mailtoLinks.length > 0,
    sourceUrl: url,
  });

  if (page.imageCount > 0) {
    const altCoverage = Math.round((page.imagesWithAlt / page.imageCount) * 100);
    evidence.push({
      category: "Accessibility Foundations",
      type: "image_alt_coverage",
      label: "Homepage images with alt text",
      valueNumber: altCoverage,
      valueText: `${page.imagesWithAlt} of ${page.imageCount} images`,
      sourceUrl: url,
    });
  }

  evidence.push({
    category: "SEO Foundations",
    type: "structured_data",
    label: "Structured data (JSON-LD)",
    booleanValue: page.hasJsonLd,
    sourceUrl: url,
  });

  evidence.push({
    category: "SEO Foundations",
    type: "robots_meta",
    label: "Robots meta directive",
    valueText: page.robots,
    sourceUrl: url,
  });

  evidence.push({
    category: "Trust & Credibility",
    type: "og_tags",
    label: "Open Graph metadata",
    booleanValue: Boolean(page.ogTitle || page.ogDescription),
    valueText: [page.ogTitle, page.ogDescription].filter(Boolean).join(" — ") || null,
    sourceUrl: url,
  });

  evidence.push({
    category: "Technical Foundations",
    type: "pages_reviewed",
    label: "Pages reviewed",
    valueNumber: pages.length,
    valueText: pages.map((p) => p.url).join(", "),
  });

  evidence.push({
    category: "Performance",
    type: "performance_measured",
    label: "Performance measurement",
    valueText: "Not measured",
    booleanValue: false,
  });

  if (html) {
    const analytics = detectAnalyticsTags(html);
    evidence.push({
      category: "Technical Foundations",
      type: "analytics_tag",
      label: analytics.length > 0 ? "Analytics tag detected" : "No supported analytics tag detected",
      valueText: analytics.join(", ") || "None detected",
      booleanValue: analytics.length > 0,
      sourceUrl: url,
    });
  }

  return evidence;
}

export async function checkSitemap(originUrl: string): Promise<EvidenceInput | null> {
  try {
    const origin = assertPublicHttpUrl(originUrl);
    const sitemapUrl = new URL("/sitemap.xml", origin).toString();
    await safeFetchText(sitemapUrl, {
      maxBytes: 50_000,
      timeoutMs: 8_000,
      maxRedirects: 2,
    });
    return {
      category: "SEO Foundations",
      type: "sitemap",
      label: "Sitemap available",
      booleanValue: true,
      sourceUrl: sitemapUrl,
    };
  } catch {
    return {
      category: "SEO Foundations",
      type: "sitemap",
      label: "Sitemap not detected",
      booleanValue: false,
      sourceUrl: originUrl,
    };
  }
}
