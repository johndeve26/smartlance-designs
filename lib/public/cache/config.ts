/** Fallback TTL when tag invalidation is unavailable; tags remain authoritative. */
export const PUBLIC_CACHE_REVALIDATE_SECONDS = 3600;

export function shouldBypassPublicCache(): boolean {
  return process.env.NODE_ENV === "test";
}
