const DOMAIN_PATTERN = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)*$/i;

export function normalizeDomain(input: string): string {
  let value = input.trim().toLowerCase();
  value = value.replace(/^https?:\/\//, "");
  value = value.replace(/^www\./, "");
  value = value.split("/")[0] ?? value;
  value = value.split("?")[0] ?? value;
  value = value.replace(/:\d+$/, "");
  return value;
}

export function assertValidDomain(domain: string) {
  const normalized = normalizeDomain(domain);
  if (!normalized || !DOMAIN_PATTERN.test(normalized)) {
    throw new Error("Enter a valid domain (e.g. example.com).");
  }
  return normalized;
}

export function assertValidProductionUrl(url: string | null | undefined): string | null {
  if (!url?.trim()) return null;
  const trimmed = url.trim();
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    throw new Error("Production URL must be a valid HTTP or HTTPS address.");
  }
  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error("Production URL must use HTTP or HTTPS.");
  }
  return parsed.toString();
}

export function safeExternalHref(url: string | null | undefined): string | null {
  if (!url?.trim()) return null;
  try {
    const parsed = new URL(url.trim());
    if (!["http:", "https:"].includes(parsed.protocol)) return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

export function visitWebsiteHref(website: {
  productionUrl: string | null;
  domain: string;
}): string {
  return safeExternalHref(website.productionUrl) ?? `https://${website.domain}`;
}
