import { getSiteOrigin, siteOriginFromConfig } from "@/lib/seo/canonical";

export function buildConfirmationUrl(token: string, origin?: string) {
  const base = (origin || siteOriginFromConfig()).replace(/\/$/, "");
  return `${base}/subscribe/confirm?token=${encodeURIComponent(token)}`;
}

export function buildUnsubscribeUrl(token: string, origin?: string) {
  const base = (origin || siteOriginFromConfig()).replace(/\/$/, "");
  return `${base}/unsubscribe?token=${encodeURIComponent(token)}`;
}

export async function buildConfirmationUrlAsync(token: string) {
  const origin = await getSiteOrigin();
  return buildConfirmationUrl(token, origin);
}

export async function buildUnsubscribeUrlAsync(token: string) {
  const origin = await getSiteOrigin();
  return buildUnsubscribeUrl(token, origin);
}
