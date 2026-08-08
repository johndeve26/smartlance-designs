/**
 * Optional IndexNow integration for Bing and participating engines.
 *
 * Official docs: https://www.indexnow.org/documentation
 *
 * Configure:
 * - INDEXNOW_KEY — verification key (also served at /{key}.txt)
 * - INDEXNOW_ENABLED=true — opt-in submissions on publish events
 */

import { OUTBOUND_TIMEOUTS, timeoutSignal } from "@/lib/ops/request-timeout";

const INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow";

export function isIndexNowEnabled(): boolean {
  return (
    process.env.INDEXNOW_ENABLED === "true" &&
    Boolean(process.env.INDEXNOW_KEY?.trim())
  );
}

export function getIndexNowKey(): string | null {
  const key = process.env.INDEXNOW_KEY?.trim();
  return key || null;
}

export async function submitIndexNowUrls(
  urls: string[],
  options?: { origin?: string },
): Promise<{ ok: boolean; submitted: number; error?: string }> {
  const key = getIndexNowKey();
  if (!isIndexNowEnabled() || !key) {
    return { ok: false, submitted: 0, error: "IndexNow not enabled" };
  }

  const origin =
    options?.origin?.replace(/\/$/, "") ||
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    "https://smartlancedesigns.com";

  const unique = [...new Set(urls.filter(Boolean))];
  if (!unique.length) return { ok: true, submitted: 0 };

  try {
    const response = await fetch(INDEXNOW_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        host: new URL(origin).host,
        key,
        keyLocation: `${origin}/indexnow-key.txt`,
        urlList: unique,
      }),
      signal: timeoutSignal(OUTBOUND_TIMEOUTS.indexing),
    });

    if (response.ok || response.status === 202) {
      return { ok: true, submitted: unique.length };
    }

    return {
      ok: false,
      submitted: 0,
      error: `IndexNow HTTP ${response.status}`,
    };
  } catch (error) {
    return {
      ok: false,
      submitted: 0,
      error: error instanceof Error ? error.message : "IndexNow request failed",
    };
  }
}

export async function submitIndexNowPath(
  path: string,
  options?: { origin?: string },
): Promise<{ ok: boolean; submitted: number; error?: string }> {
  const origin =
    options?.origin?.replace(/\/$/, "") ||
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    "https://smartlancedesigns.com";
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return submitIndexNowUrls([`${origin}${normalized}`], { origin });
}
