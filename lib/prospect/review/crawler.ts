import { assertPublicHttpUrl, safeFetchText } from "@/lib/ai/ssrf";
import {
  REVIEW_FETCH_TIMEOUT_MS,
  REVIEW_MAX_BYTES,
  REVIEW_MAX_PAGES,
  REVIEW_MAX_REDIRECTS,
} from "@/lib/prospect/constants";
import {
  contentHash,
  extractPageContent,
  selectAdditionalPages,
  type ExtractedPage,
} from "@/lib/prospect/review/extract";

export type CrawledPage = {
  url: string;
  statusCode: number;
  contentHash: string;
  html: string;
  extracted: ExtractedPage;
};

export type CrawlResult = {
  pages: CrawledPage[];
  error?: string;
};

export class ReviewCrawlError extends Error {
  constructor(
    message: string,
    public readonly code:
      | "INVALID_URL"
      | "BLOCKED_URL"
      | "COULD_NOT_CONNECT"
      | "UNSUPPORTED_CONTENT"
      | "TIMEOUT"
      | "TOO_LARGE",
  ) {
    super(message);
    this.name = "ReviewCrawlError";
  }
}

function mapFetchError(err: unknown): ReviewCrawlError {
  const msg = err instanceof Error ? err.message : String(err);
  if (/Unsafe or invalid URL/i.test(msg)) {
    return new ReviewCrawlError("This website can't be reviewed.", "BLOCKED_URL");
  }
  if (/size limit/i.test(msg)) {
    return new ReviewCrawlError("The website response was too large.", "TOO_LARGE");
  }
  if (/Unsupported content type/i.test(msg)) {
    return new ReviewCrawlError("This website couldn't be parsed.", "UNSUPPORTED_CONTENT");
  }
  if (/abort|timeout/i.test(msg)) {
    return new ReviewCrawlError("The website took too long to respond.", "TIMEOUT");
  }
  if (/HTTP 4|HTTP 5|SOURCE_FETCH_FAILED/i.test(msg)) {
    return new ReviewCrawlError("That website couldn't be reached.", "COULD_NOT_CONNECT");
  }
  return new ReviewCrawlError("We couldn't review this website right now.", "COULD_NOT_CONNECT");
}

async function fetchPage(url: string): Promise<{ html: string; finalUrl: string }> {
  try {
    const result = await safeFetchText(url, {
      maxBytes: REVIEW_MAX_BYTES,
      timeoutMs: REVIEW_FETCH_TIMEOUT_MS,
      maxRedirects: REVIEW_MAX_REDIRECTS,
    });
    return { html: result.text, finalUrl: result.url };
  } catch (err) {
    throw mapFetchError(err);
  }
}

export async function crawlWebsite(startUrl: string): Promise<CrawlResult> {
  let origin: URL;
  try {
    origin = assertPublicHttpUrl(startUrl);
  } catch {
    throw new ReviewCrawlError("Please enter a valid website URL.", "INVALID_URL");
  }

  const pages: CrawledPage[] = [];

  const homeResult = await fetchPage(origin.toString());
  const homeExtracted = extractPageContent(homeResult.html, homeResult.finalUrl);
  pages.push({
    url: homeResult.finalUrl,
    statusCode: 200,
    contentHash: contentHash(homeResult.html),
    html: homeResult.html,
    extracted: homeExtracted,
  });

  const additionalUrls = selectAdditionalPages(
    homeExtracted,
    new URL(homeResult.finalUrl),
    REVIEW_MAX_PAGES - 1,
  );

  for (const pageUrl of additionalUrls) {
    if (pages.length >= REVIEW_MAX_PAGES) break;
    try {
      assertPublicHttpUrl(pageUrl);
      const result = await fetchPage(pageUrl);
      pages.push({
        url: result.finalUrl,
        statusCode: 200,
        contentHash: contentHash(result.html),
        html: result.html,
        extracted: extractPageContent(result.html, result.finalUrl),
      });
    } catch {
      /* skip individual page failures */
    }
  }

  return { pages };
}
