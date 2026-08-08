/**
 * Pins environment-derived values that assertions depend on.
 *
 * Vite loads `.env.local` before tests run, so a developer's local origin
 * (e.g. http://localhost:3000) would otherwise leak into canonical URL,
 * sitemap and metadata expectations.
 */
process.env.NEXT_PUBLIC_SITE_URL = "https://smartlancedesigns.com";
