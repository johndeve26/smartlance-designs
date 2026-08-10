import { getSiteOrigin } from "@/lib/seo/canonical";

export async function buildOpenPixelUrl(token: string): Promise<string> {
  const origin = await getSiteOrigin();
  return `${origin}/t/o/${encodeURIComponent(token)}`;
}

export async function buildClickTrackingUrl(token: string): Promise<string> {
  const origin = await getSiteOrigin();
  return `${origin}/t/c/${encodeURIComponent(token)}`;
}

export function buildOutreachUnsubscribeUrl(origin: string, token: string): string {
  return `${origin.replace(/\/$/, "")}/outreach/unsubscribe?token=${encodeURIComponent(token)}`;
}
