import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

const PUBLIC_ENTRYPOINTS = [
  "app/(site)/page.tsx",
  "app/layout.tsx",
  "app/(site)/layout.tsx",
  "components/layout/header.tsx",
];

const FORBIDDEN_PUBLIC_IMPORTS = [
  "@/lib/db",
  "@/lib/admin/",
  "@prisma/client",
  "nodemailer",
  "@aws-sdk/",
];

describe("public bundle import guards", () => {
  for (const file of PUBLIC_ENTRYPOINTS) {
    it(`${file} avoids admin/server-only imports`, () => {
      const source = readFileSync(path.join(process.cwd(), file), "utf8");
      for (const forbidden of FORBIDDEN_PUBLIC_IMPORTS) {
        expect(source.includes(forbidden)).toBe(false);
      }
    });
  }

  it("homepage remains a server component", () => {
    const source = readFileSync(
      path.join(process.cwd(), "app/(site)/page.tsx"),
      "utf8",
    );
    expect(source.startsWith('"use client"')).toBe(false);
    expect(source).toContain("export default async function");
  });

  it("root layout does not call headers() for chrome detection", () => {
    const source = readFileSync(path.join(process.cwd(), "app/layout.tsx"), "utf8");
    expect(source).not.toContain('from "next/headers"');
    expect(source).not.toContain("headers()");
  });
});
