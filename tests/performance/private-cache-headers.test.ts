import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import nextConfig from "@/next.config";

type HeaderRule = {
  source: string;
  headers: Array<{ key: string; value: string }>;
};

function headerRules(): HeaderRule[] {
  const headersFn = nextConfig.headers;
  if (!headersFn) return [];
  return headersFn() as unknown as HeaderRule[];
}

describe("private cache response headers", () => {
  it("sets no-store for admin, portal, and workspace trees", async () => {
    const rules = await Promise.resolve(headerRules());
    const admin = rules.find((rule) => rule.source === "/admin/:path*");
    const portal = rules.find((rule) => rule.source === "/portal/:path*");
    const workspace = rules.find((rule) => rule.source === "/workspace/:path*");

    expect(admin?.headers.find((h) => h.key === "Cache-Control")?.value).toContain(
      "no-store",
    );
    expect(portal?.headers.find((h) => h.key === "Cache-Control")?.value).toContain(
      "no-store",
    );
    expect(workspace?.headers.find((h) => h.key === "Cache-Control")?.value).toContain(
      "no-store",
    );
  });

  it("sets no-store for sensitive API prefixes", async () => {
    const rules = await Promise.resolve(headerRules());
    const prefixes = [
      "/api/auth/:path*",
      "/api/agency/:path*",
      "/api/prospect/:path*",
      "/api/webhooks/:path*",
    ];

    for (const source of prefixes) {
      const rule = rules.find((entry) => entry.source === source);
      expect(rule?.headers.find((h) => h.key === "Cache-Control")?.value).toContain(
        "no-store",
      );
    }
  });
});

describe("proxy private route headers", () => {
  it("documents no-store headers for authenticated route prefixes", () => {
    const source = readFileSync(path.join(process.cwd(), "proxy.ts"), "utf8");

    expect(source).toContain('pathname.startsWith("/admin")');
    expect(source).toContain('pathname.startsWith("/portal")');
    expect(source).toContain('pathname.startsWith("/workspace")');
    expect(source).toContain('"Cache-Control", "no-store"');
  });
});
