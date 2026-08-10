import { createHash } from "node:crypto";

export type ExtractedPage = {
  url: string;
  title: string | null;
  metaDescription: string | null;
  canonical: string | null;
  viewport: boolean;
  robots: string | null;
  h1s: string[];
  h2s: string[];
  navLabels: string[];
  ctaLabels: string[];
  internalLinks: string[];
  externalLinks: string[];
  telLinks: string[];
  mailtoLinks: string[];
  formCount: number;
  imageCount: number;
  imagesWithAlt: number;
  hasJsonLd: boolean;
  ogTitle: string | null;
  ogDescription: string | null;
  bodyText: string;
  headingsText: string;
};

function stripTags(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function matchMeta(html: string, name: string): string | null {
  const re = new RegExp(
    `<meta[^>]+(?:name|property)=["']${name}["'][^>]+content=["']([^"']*)["']`,
    "i",
  );
  const m = html.match(re);
  if (m?.[1]) return decodeEntities(m[1].trim());
  const re2 = new RegExp(
    `<meta[^>]+content=["']([^"']*)["'][^>]+(?:name|property)=["']${name}["']`,
    "i",
  );
  const m2 = html.match(re2);
  return m2?.[1] ? decodeEntities(m2[1].trim()) : null;
}

function matchTagContent(html: string, tag: string): string | null {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i");
  const m = html.match(re);
  return m?.[1] ? stripTags(m[1]).slice(0, 500) : null;
}

function matchAll(html: string, tag: string): string[] {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "gi");
  const results: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const text = stripTags(m[1] ?? "").slice(0, 200);
    if (text) results.push(text);
  }
  return results;
}

function matchLinks(html: string): Array<{ href: string; text: string }> {
  const re = /<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  const results: Array<{ href: string; text: string }> = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    results.push({
      href: m[1] ?? "",
      text: stripTags(m[2] ?? "").slice(0, 120),
    });
  }
  return results;
}

function decodeEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function isSameOrigin(href: string, origin: URL): boolean {
  try {
    const u = new URL(href, origin);
    return u.hostname.replace(/^www\./, "") === origin.hostname.replace(/^www\./, "");
  } catch {
    return false;
  }
}

const CTA_PATTERNS =
  /contact|get started|book|quote|enquir|inquir|call|schedule|buy|shop|sign up|subscribe|learn more|request|free/i;

export function extractPageContent(html: string, pageUrl: string): ExtractedPage {
  const origin = new URL(pageUrl);
  const title = matchTagContent(html, "title");
  const metaDescription =
    matchMeta(html, "description") ?? matchMeta(html, "og:description");
  const canonicalMatch = html.match(
    /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i,
  );
  const canonical = canonicalMatch?.[1] ?? null;
  const viewport = /<meta[^>]+name=["']viewport["']/i.test(html);
  const robots = matchMeta(html, "robots");
  const h1s = matchAll(html, "h1");
  const h2s = matchAll(html, "h2").slice(0, 10);
  const hasJsonLd = /<script[^>]+type=["']application\/ld\+json["']/i.test(html);
  const ogTitle = matchMeta(html, "og:title");
  const ogDescription = matchMeta(html, "og:description");

  const navMatch = html.match(/<nav[\s\S]*?<\/nav>/gi) ?? [];
  const navLabels = navMatch
    .flatMap((block) => matchLinks(block).map((l) => l.text))
    .filter(Boolean)
    .slice(0, 20);

  const links = matchLinks(html);
  const internalLinks: string[] = [];
  const externalLinks: string[] = [];
  const ctaLabels: string[] = [];

  for (const link of links) {
    if (!link.href || link.href.startsWith("#") || link.href.startsWith("javascript:")) {
      continue;
    }
    if (link.href.startsWith("tel:")) continue;
    if (link.href.startsWith("mailto:")) continue;
    if (isSameOrigin(link.href, origin)) {
      try {
        internalLinks.push(new URL(link.href, origin).pathname);
      } catch {
        /* skip */
      }
    } else if (/^https?:\/\//i.test(link.href)) {
      externalLinks.push(link.href);
    }
    if (link.text && CTA_PATTERNS.test(link.text)) {
      ctaLabels.push(link.text);
    }
  }

  const telLinks = [...html.matchAll(/href=["']tel:([^"']+)["']/gi)].map(
    (m) => m[1] ?? "",
  );
  const mailtoLinks = [...html.matchAll(/href=["']mailto:([^"']+)["']/gi)].map(
    (m) => m[1] ?? "",
  );
  const formCount = (html.match(/<form[\s>]/gi) ?? []).length;
  const imgTags = html.match(/<img[\s\S]*?>/gi) ?? [];
  const imageCount = imgTags.length;
  const imagesWithAlt = imgTags.filter((tag) =>
    /alt=["'][^"']+["']/i.test(tag),
  ).length;

  const bodyText = stripTags(html).slice(0, 8000);
  const headingsText = [...h1s, ...h2s].join(" | ").slice(0, 1000);

  return {
    url: pageUrl,
    title,
    metaDescription,
    canonical,
    viewport,
    robots,
    h1s,
    h2s,
    navLabels,
    ctaLabels: [...new Set(ctaLabels)].slice(0, 15),
    internalLinks: [...new Set(internalLinks)].slice(0, 50),
    externalLinks: [...new Set(externalLinks)].slice(0, 20),
    telLinks: [...new Set(telLinks)],
    mailtoLinks: [...new Set(mailtoLinks)],
    formCount,
    imageCount,
    imagesWithAlt,
    hasJsonLd,
    ogTitle,
    ogDescription,
    bodyText,
    headingsText,
  };
}

export function contentHash(text: string): string {
  return createHash("sha256").update(text).digest("hex").slice(0, 16);
}

export function selectAdditionalPages(
  homepage: ExtractedPage,
  origin: URL,
  maxPages: number,
): string[] {
  const priorityPatterns = [
    /^\/about/i,
    /^\/services/i,
    /^\/contact/i,
    /^\/products/i,
    /^\/work/i,
    /^\/portfolio/i,
  ];

  const candidates = homepage.internalLinks
    .filter((path) => path !== "/" && path.length > 1)
    .map((path) => {
      let score = 0;
      for (let i = 0; i < priorityPatterns.length; i++) {
        if (priorityPatterns[i].test(path)) score += 10 - i;
      }
      if (homepage.navLabels.some((label) => path.toLowerCase().includes(label.toLowerCase().slice(0, 8)))) {
        score += 2;
      }
      return { path, score };
    })
    .sort((a, b) => b.score - a.score);

  const selected: string[] = [];
  for (const { path } of candidates) {
    if (selected.length >= maxPages) break;
    try {
      const url = new URL(path, origin).toString();
      if (!selected.includes(url)) selected.push(url);
    } catch {
      /* skip */
    }
  }
  return selected;
}

export function detectAnalyticsTags(html: string): string[] {
  const detected: string[] = [];
  if (/googletagmanager\.com|gtag\(|GoogleAnalyticsObject|G-[A-Z0-9]+/i.test(html)) {
    detected.push("Google Analytics / GTM");
  }
  if (/connect\.facebook\.net\/en_US\/fbevents\.js|fbq\(/i.test(html)) {
    detected.push("Meta Pixel");
  }
  if (/static\.hotjar\.com|hj\(/i.test(html)) {
    detected.push("Hotjar");
  }
  if (/plausible\.io/i.test(html)) {
    detected.push("Plausible");
  }
  return detected;
}
