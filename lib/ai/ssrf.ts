/**
 * SSRF-safe URL checks for research/manual source fetching.
 * Blocks localhost, private ranges, link-local, metadata endpoints, and non-http(s).
 */

const PRIVATE_HOSTS = new Set([
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "::1",
  "metadata.google.internal",
  "metadata",
]);

function isPrivateIPv4(a: number, b: number): boolean {
  if (a === 10) return true;
  if (a === 127) return true;
  if (a === 0) return true;
  if (a === 169 && b === 254) return true; // link-local / AWS + GCP metadata
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
  return false;
}

/**
 * IPv4-mapped/compatible IPv6 embeds an IPv4 address that must be checked
 * against the IPv4 rules. The URL parser compresses `::ffff:169.254.169.254`
 * to `::ffff:a9fe:a9fe`, so both the dotted and hextet forms are handled.
 */
function mappedIPv4(host: string): [number, number] | null {
  const dotted = host.match(/^::(?:ffff:)?(\d+)\.(\d+)\.\d+\.\d+$/);
  if (dotted) return [Number(dotted[1]), Number(dotted[2])];

  const hex = host.match(/^::(?:ffff:)?([0-9a-f]{1,4}):([0-9a-f]{1,4})$/);
  if (hex) {
    const high = Number.parseInt(hex[1], 16);
    return [(high >> 8) & 0xff, high & 0xff];
  }
  return null;
}

export function isPrivateOrReservedHostname(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (PRIVATE_HOSTS.has(host)) return true;
  if (host.endsWith(".localhost") || host.endsWith(".local") || host.endsWith(".internal")) {
    return true;
  }

  const m = host.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
  if (m && isPrivateIPv4(Number(m[1]), Number(m[2]))) return true;

  if (host.includes(":")) {
    // Unspecified address (::) routes to loopback on most stacks.
    if (host === "::" || host === "::0") return true;
    const mapped = mappedIPv4(host);
    if (mapped && isPrivateIPv4(mapped[0], mapped[1])) return true;
    // Link-local, unique-local, and site-local IPv6.
    if (/^f[cde]/.test(host)) return true;
  }

  return false;
}

export function assertPublicHttpUrl(value: string): URL {
  const trimmed = value.trim();
  let u: URL;
  try {
    u = new URL(trimmed);
  } catch {
    throw new Error("Unsafe or invalid URL rejected.");
  }
  if (u.protocol !== "http:" && u.protocol !== "https:") {
    throw new Error("Unsafe or invalid URL rejected.");
  }
  if (!u.hostname || isPrivateOrReservedHostname(u.hostname)) {
    throw new Error("Unsafe or invalid URL rejected.");
  }
  // userinfo in URL can be used for smuggling
  if (u.username || u.password) {
    throw new Error("Unsafe or invalid URL rejected.");
  }
  return u;
}

export function isSafePublicHttpUrl(value: string): boolean {
  try {
    assertPublicHttpUrl(value);
    return true;
  } catch {
    return false;
  }
}

export type SafeFetchOptions = {
  maxBytes?: number;
  timeoutMs?: number;
  maxRedirects?: number;
  signal?: AbortSignal;
};

/**
 * Fetch text content with SSRF checks on initial URL and each redirect target.
 * Does not execute content. Caps size and timeout.
 */
export async function safeFetchText(
  url: string,
  options: SafeFetchOptions = {},
): Promise<{ url: string; text: string; contentType: string | null }> {
  const maxBytes = options.maxBytes ?? 512_000;
  const timeoutMs = options.timeoutMs ?? 12_000;
  const maxRedirects = options.maxRedirects ?? 3;

  let current = assertPublicHttpUrl(url).toString();
  for (let hop = 0; hop <= maxRedirects; hop++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const onAbort = () => controller.abort();
    options.signal?.addEventListener("abort", onAbort);
    try {
      const res = await fetch(current, {
        method: "GET",
        redirect: "manual",
        signal: controller.signal,
        headers: { Accept: "text/html,text/plain,application/xhtml+xml" },
      });
      if (res.status >= 300 && res.status < 400) {
        const loc = res.headers.get("location");
        if (!loc) throw new Error("Redirect without location");
        const next = new URL(loc, current);
        assertPublicHttpUrl(next.toString());
        current = next.toString();
        continue;
      }
      if (!res.ok) {
        throw new Error(`SOURCE_FETCH_FAILED HTTP ${res.status}`);
      }
      const contentType = res.headers.get("content-type");
      if (
        contentType &&
        !/text\/|application\/(json|xml|xhtml|javascript|ld\+json)/i.test(contentType) &&
        !/html/i.test(contentType)
      ) {
        throw new Error("Unsupported content type for research fetch");
      }
      const buf = new Uint8Array(await res.arrayBuffer());
      if (buf.byteLength > maxBytes) {
        throw new Error("SOURCE_FETCH_FAILED size limit exceeded");
      }
      const text = new TextDecoder("utf-8", { fatal: false }).decode(buf);
      return { url: current, text: sanitizeFetchedText(text), contentType };
    } finally {
      clearTimeout(timer);
      options.signal?.removeEventListener("abort", onAbort);
    }
  }
  throw new Error("Too many redirects");
}

/** Strip scripts/styles noise while keeping readable text. */
export function sanitizeFetchedText(htmlOrText: string): string {
  return htmlOrText
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 20_000);
}
