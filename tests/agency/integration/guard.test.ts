import { describe, expect, it } from "vitest";

const hasTestDb = Boolean(process.env.TEST_DATABASE_URL?.trim());

describe.skipIf(!hasTestDb)("agency operations integration", () => {
  it("placeholder for postgres integration tests", () => {
    expect(hasTestDb).toBe(true);
  });
});

describe("agency integration guard", () => {
  it("skips DB tests without TEST_DATABASE_URL", () => {
    if (!hasTestDb) {
      expect(process.env.TEST_DATABASE_URL).toBeUndefined();
    }
  });
});
