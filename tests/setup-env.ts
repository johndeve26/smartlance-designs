/**
 * Pins environment-derived values that assertions depend on.
 *
 * Vite loads `.env.local` before tests run, so a developer's local origin
 * (e.g. http://localhost:3000) would otherwise leak into canonical URL,
 * sitemap and metadata expectations.
 */
process.env.NEXT_PUBLIC_SITE_URL = "https://smartlancedesigns.com";

/**
 * Live DB integration tests use TEST_DATABASE_URL via getIntegrationPrisma(),
 * while domain services read DATABASE_URL from lib/db. Route both to the same
 * dedicated test database without weakening the guard's prod/dev separation.
 */
const integrationTestUrl = process.env.TEST_DATABASE_URL?.trim();
if (integrationTestUrl && process.env.NODE_ENV === "test") {
  if (!process.env.INTEGRATION_RUNTIME_DATABASE_URL?.trim()) {
    process.env.INTEGRATION_RUNTIME_DATABASE_URL = process.env.DATABASE_URL?.trim() ?? "";
  }
  process.env.DATABASE_URL = integrationTestUrl;
  process.env.DIRECT_URL = integrationTestUrl;
}
