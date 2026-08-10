const TRACKABLE_SCHEME = /^https?:\/\//i;
const EXCLUDED_PATHS = ["/outreach/unsubscribe", "/unsubscribe", "/subscribe/confirm"];

export function isTrackableHttpUrl(href: string): boolean {
  const trimmed = href.trim();
  if (!TRACKABLE_SCHEME.test(trimmed)) return false;
  if (/^javascript:/i.test(trimmed) || /^mailto:/i.test(trimmed) || /^tel:/i.test(trimmed)) {
    return false;
  }
  try {
    const url = new URL(trimmed);
    for (const path of EXCLUDED_PATHS) {
      if (url.pathname === path || url.pathname.startsWith(`${path}/`)) {
        return false;
      }
    }
    return true;
  } catch {
    return false;
  }
}

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Convert plain-text CRM body to minimal HTML with autolinked http(s) URLs. */
export function plainTextToHtml(text: string): string {
  const paragraphs = text.split(/\n\n+/);
  return paragraphs
    .map((para) => {
      const lines = para.split("\n");
      const htmlLines = lines.map((line) => autolinkLine(escapeHtml(line)));
      return `<p>${htmlLines.join("<br>")}</p>`;
    })
    .join("\n");
}

function autolinkLine(line: string): string {
  return line.replace(
    /(https?:\/\/[^\s<]+)/gi,
    (url) => `<a href="${url}">${url}</a>`,
  );
}

type AnchorMatch = { full: string; href: string; inner: string; index: number };

export function extractAnchors(html: string): AnchorMatch[] {
  const results: AnchorMatch[] = [];
  const re = /<a\s+[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(html)) !== null) {
    results.push({
      full: match[0],
      href: match[1]!,
      inner: match[2] ?? "",
      index: match.index,
    });
  }
  return results;
}

export function replaceAnchorHref(
  html: string,
  originalHref: string,
  newHref: string,
): string {
  const escaped = originalHref.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(
    `(<a\\s+[^>]*href=["'])${escaped}(["'][^>]*>)`,
    "i",
  );
  return html.replace(re, `$1${newHref}$2`);
}

export function stripHtmlTags(html: string): string {
  return html.replace(/<[^>]+>/g, "").trim();
}

export function appendOpenPixel(html: string, pixelUrl: string): string {
  const pixel = `<img src="${pixelUrl}" width="1" height="1" alt="" style="display:none;border:0;outline:none;" />`;
  return `${html}\n${pixel}`;
}
