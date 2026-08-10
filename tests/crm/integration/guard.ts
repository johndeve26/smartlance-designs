/**
 * Safety guard for CRM live-DB integration tests.
 * NEVER runs against production DATABASE_URL without explicit test DB.
 */

const PRODUCTION_HOST_PATTERNS = [
  /\.neon\.tech/i,
  /\.amazonaws\.com/i,
  /\.supabase\.co/i,
  /\.render\.com/i,
];

const SAFE_DB_NAME_PATTERNS = /test|vitest|integration|local|dev/i;

export class TestDatabaseGuardError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TestDatabaseGuardError";
  }
}

export function parseDatabaseName(url: string): string {
  try {
    const parsed = new URL(url);
    return decodeURIComponent(parsed.pathname.replace(/^\//, "") || "");
  } catch {
    return "";
  }
}

export function parseDatabaseHost(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return "";
  }
}

export function assertSafeIntegrationDatabase(): string {
  if (process.env.NODE_ENV !== "test") {
    throw new TestDatabaseGuardError(
      "CRM integration tests require NODE_ENV=test.",
    );
  }

  const testUrl = process.env.TEST_DATABASE_URL?.trim();
  if (!testUrl) {
    throw new TestDatabaseGuardError(
      "TEST_DATABASE_URL is required. Example:\n" +
        "  TEST_DATABASE_URL=postgresql://user:pass@localhost:5432/smartlance_crm_test npm run test:crm:integration",
    );
  }

  const runtimeUrl =
    process.env.INTEGRATION_RUNTIME_DATABASE_URL?.trim() ||
    process.env.DATABASE_URL?.trim();
  if (runtimeUrl && runtimeUrl === testUrl) {
    throw new TestDatabaseGuardError(
      "TEST_DATABASE_URL must not equal the runtime DATABASE_URL (production/dev URL).",
    );
  }

  const dbName = parseDatabaseName(testUrl);
  const host = parseDatabaseHost(testUrl);

  const looksProduction =
    PRODUCTION_HOST_PATTERNS.some((p) => p.test(host)) &&
    !SAFE_DB_NAME_PATTERNS.test(dbName);

  if (looksProduction && process.env.CRM_INTEGRATION_TEST_ALLOW !== "1") {
    throw new TestDatabaseGuardError(
      `Refusing CRM integration tests against production-like database "${dbName}" on ${host}. ` +
        "Use a dedicated test database (name should contain test/integration) or set CRM_INTEGRATION_TEST_ALLOW=1 explicitly.",
    );
  }

  if (!SAFE_DB_NAME_PATTERNS.test(dbName) && process.env.CRM_INTEGRATION_TEST_ALLOW !== "1") {
    throw new TestDatabaseGuardError(
      `Database name "${dbName}" does not look like a test database. ` +
        "Use a name containing test/integration/local/dev or set CRM_INTEGRATION_TEST_ALLOW=1.",
    );
  }

  return testUrl;
}

export function hasIntegrationDatabase(): boolean {
  try {
    assertSafeIntegrationDatabase();
    return true;
  } catch {
    return false;
  }
}
