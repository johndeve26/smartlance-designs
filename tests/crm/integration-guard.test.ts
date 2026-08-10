import { describe, expect, it, vi } from "vitest";
import {
  assertSafeIntegrationDatabase,
  parseDatabaseName,
  TestDatabaseGuardError,
} from "@/tests/crm/integration/guard";

describe("CRM integration DB guard", () => {
  it("refuses when TEST_DATABASE_URL is missing", () => {
    const prevUrl = process.env.TEST_DATABASE_URL;
    vi.stubEnv("NODE_ENV", "test");
    delete process.env.TEST_DATABASE_URL;
    expect(() => assertSafeIntegrationDatabase()).toThrow(TestDatabaseGuardError);
    process.env.TEST_DATABASE_URL = prevUrl;
    vi.unstubAllEnvs();
  });

  it("parses database name from URL", () => {
    expect(parseDatabaseName("postgresql://u:p@localhost:5432/smartlance_crm_test")).toBe(
      "smartlance_crm_test",
    );
  });
});
