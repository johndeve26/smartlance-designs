import { describe, it, expect } from "vitest";
import {
  computeContractContentHash,
  normalizeContractContent,
} from "@/lib/contracts/content-hash";

describe("contract content hash", () => {
  it("is deterministic for identical inputs", () => {
    const input = {
      contractId: "c1",
      versionNumber: 1,
      content: "Hello\r\nWorld",
      proposalAcceptanceId: "acc1",
      proposalScopeHash: "abc123",
      resolvedVariables: { client_company_name: "Acme" },
    };
    const a = computeContractContentHash(input);
    const b = computeContractContentHash(input);
    expect(a).toBe(b);
  });

  it("changes when content changes", () => {
    const base = {
      contractId: "c1",
      versionNumber: 1,
      content: "Terms v1",
    };
    const a = computeContractContentHash(base);
    const b = computeContractContentHash({ ...base, content: "Terms v2" });
    expect(a).not.toBe(b);
  });

  it("normalizes line endings", () => {
    expect(normalizeContractContent("a\r\nb")).toBe(normalizeContractContent("a\nb"));
  });
});
