import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";
import {
  SERVICE_FIELD_ALLOWLIST,
  SERVICE_PROTECTED_FIELDS,
  SOLUTION_FIELD_ALLOWLIST,
  SOLUTION_PROTECTED_FIELDS,
  filterAllowedFields,
} from "@/lib/ai/content-assistants/allowlists";
import { buildFieldChanges } from "@/lib/ai/content-assistants/shared-generate";
import { heuristicServiceProposal } from "@/lib/ai/content-assistants/service/heuristic";
import { heuristicSolutionProposal } from "@/lib/ai/content-assistants/solution/heuristic";
import {
  ServiceFullProposalOutput,
  ServiceSeoOutput,
} from "@/lib/ai/content-assistants/service/schemas";
import {
  SolutionFullProposalOutput,
  assertPageContentCompatible,
} from "@/lib/ai/content-assistants/solution/schemas";
import { containsUnsafeCommercialClaim } from "@/lib/ai/content-assistants/helpers";
import { canUseContentAssistant } from "@/lib/ai/content-assistants/security";
import { getContentAssistant } from "@/lib/ai/content-assistants/registry";
import { AI_FORBIDDEN_CONTEXT_SOURCES } from "@/lib/ai/safety";
import type { Service, Solution } from "@prisma/client";

function baseService(over: Partial<Service> = {}): Service {
  return {
    id: "svc1",
    slug: "website-strategy",
    href: "/services/website-strategy",
    title: "Website Strategy",
    shortTitle: "Strategy",
    category: "Strategy",
    group: "strategy",
    icon: "layers",
    summary: "Existing summary stays.",
    description: "Existing description about strategy workshops and roadmaps.",
    tagline: null,
    narrativeTitle: null,
    narrative: null,
    seoConnection: null,
    audience: null,
    platformsNote: null,
    visualVariant: null,
    featured: true,
    navigationFeatured: true,
    displayOrder: 3,
    capabilities: ["Workshop facilitation", "Roadmap definition"],
    idealFor: null,
    problems: null,
    deliverables: null,
    process: null,
    evaluationItems: null,
    faqs: null,
    relatedProjectSlugs: null,
    relatedServiceSlugs: null,
    relatedSeoSlugs: null,
    relatedPlatformSlugs: null,
    relatedSolutionSlugs: null,
    ctaTitle: null,
    ctaDescription: null,
    primaryCtaLabel: null,
    primaryCtaHref: null,
    secondaryCtaLabel: null,
    secondaryCtaHref: null,
    seoTitle: "Website Strategy | Smartlance",
    seoDescription: "Strategy for clear digital decisions.",
    ogTitle: null,
    ogDescription: null,
    ogImagePath: null,
    noIndex: false,
    canonicalOverride: null,
    status: "PUBLISHED",
    publishedAt: new Date(),
    createdById: null,
    updatedById: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...over,
  } as Service;
}

function baseSolution(over: Partial<Solution> = {}): Solution {
  return {
    id: "sol1",
    slug: "website-not-generating-leads",
    name: "Website not generating leads",
    title: "Website not generating leads",
    shortDescription: "Diagnose why traffic is not converting.",
    category: "conversion",
    icon: "target",
    featured: false,
    displayOrder: 1,
    eyebrow: null,
    heroStatement: null,
    heroSupporting: null,
    problemSymptoms: null,
    possibleCauses: null,
    whatWeReview: null,
    process: null,
    measurementPoints: null,
    relatedServiceHrefs: ["/services/website-strategy"],
    relatedPlatformSlugs: null,
    relatedIndustrySlugs: null,
    relatedProjectSlugs: null,
    relatedArticleSlugs: null,
    relatedServiceReasons: null,
    relatedSolutions: null,
    faqs: null,
    pageKind: "leads",
    pageContent: {
      kind: "leads",
      slug: "website-not-generating-leads",
      causesIntro: "Existing intro",
    },
    ctaTitle: null,
    ctaDescription: null,
    primaryCtaLabel: null,
    primaryCtaHref: null,
    secondaryCtaLabel: null,
    secondaryCtaHref: null,
    seoTitle: null,
    seoDescription: null,
    ogTitle: null,
    ogDescription: null,
    ogImagePath: null,
    noIndex: false,
    canonicalOverride: null,
    status: "PUBLISHED",
    publishedAt: new Date(),
    createdById: null,
    updatedById: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...over,
  } as Solution;
}

describe("AI content allowlists", () => {
  it("never allows protected Service fields through filter", () => {
    const filtered = filterAllowedFields(
      {
        summary: "ok",
        status: "PUBLISHED",
        featured: true,
        displayOrder: 99,
        publishedAt: new Date().toISOString(),
        slug: "hacked",
      },
      SERVICE_FIELD_ALLOWLIST,
      SERVICE_PROTECTED_FIELDS,
    );
    expect(filtered).toEqual({ summary: "ok" });
    expect(filtered).not.toHaveProperty("status");
    expect(filtered).not.toHaveProperty("featured");
  });

  it("never allows protected Solution fields through filter", () => {
    const filtered = filterAllowedFields(
      {
        heroStatement: "ok",
        status: "PUBLISHED",
        featured: true,
        relatedServiceHrefs: [],
        pageKind: "hack",
      },
      SOLUTION_FIELD_ALLOWLIST,
      SOLUTION_PROTECTED_FIELDS,
    );
    expect(filtered).toEqual({ heroStatement: "ok" });
    expect(filtered).not.toHaveProperty("relatedServiceHrefs");
  });
});

describe("Service AI heuristics", () => {
  it("Fill Missing does not overwrite populated fields", () => {
    const payload = heuristicServiceProposal({
      service: baseService(),
      action: "FILL_MISSING",
      lockedFields: [],
    });
    const summary = payload.fields.find((f) => f.field === "summary");
    expect(summary).toBeUndefined();
    const capabilities = payload.fields.find((f) => f.field === "capabilities");
    expect(capabilities).toBeUndefined();
    const tagline = payload.fields.find((f) => f.field === "tagline");
    expect(tagline).toBeDefined();
  });

  it("does not invent capabilities when already present", () => {
    const payload = heuristicServiceProposal({
      service: baseService(),
      action: "FILL_MISSING",
      lockedFields: [],
    });
    expect(payload.fields.some((f) => f.field === "capabilities")).toBe(false);
  });

  it("Improve proposes changes without touching protected fields", () => {
    const payload = heuristicServiceProposal({
      service: baseService(),
      action: "IMPROVE_SERVICE",
      lockedFields: [],
    });
    for (const f of payload.fields) {
      expect(SERVICE_PROTECTED_FIELDS.has(f.field)).toBe(false);
      expect(SERVICE_FIELD_ALLOWLIST.has(f.field)).toBe(true);
    }
  });

  it("respects locked fields", () => {
    const payload = heuristicServiceProposal({
      service: baseService({ tagline: null }),
      action: "FILL_MISSING",
      lockedFields: ["tagline"],
    });
    expect(payload.fields.some((f) => f.field === "tagline")).toBe(false);
  });

  it("SEO output validates against Zod schema", () => {
    const payload = heuristicServiceProposal({
      service: baseService({ seoTitle: "", seoDescription: "" }),
      action: "GENERATE_SEO",
      lockedFields: [],
    });
    const obj: Record<string, unknown> = {};
    for (const f of payload.fields) obj[f.field] = f.proposed;
    expect(() => ServiceSeoOutput.parse(obj)).not.toThrow();
  });

  it("Service copy stays capability-led (not Solution diagnostic)", () => {
    const payload = heuristicServiceProposal({
      service: baseService({ summary: "", description: "" }),
      action: "FILL_MISSING",
      lockedFields: [],
    });
    const desc = String(
      payload.fields.find((f) => f.field === "description")?.proposed || "",
    );
    expect(desc.toLowerCase()).not.toContain("your website is slow, outdated");
    expect(desc.toLowerCase()).toMatch(/capability|smartlance/);
  });
});

describe("Solution AI heuristics", () => {
  it("maintains problem→diagnosis structure language", () => {
    const payload = heuristicSolutionProposal({
      solution: baseSolution(),
      action: "CLARIFY_PROBLEM",
      lockedFields: [],
    });
    const hero = String(
      payload.fields.find((f) => f.field === "heroStatement")?.proposed || "",
    );
    expect(hero.toLowerCase()).toMatch(/problem|recognis|diagnos/);
    expect(hero.toLowerCase()).not.toMatch(/our website development service includes/);
  });

  it("does not fabricate measurement outcomes", () => {
    const payload = heuristicSolutionProposal({
      solution: baseSolution(),
      action: "IMPROVE_APPROACH",
      lockedFields: [],
    });
    const points = payload.fields.find((f) => f.field === "measurementPoints")
      ?.proposed as string[];
    expect(Array.isArray(points)).toBe(true);
    for (const p of points) {
      expect(containsUnsafeCommercialClaim(p)).toBe(false);
      expect(p.toLowerCase()).not.toMatch(/increased (traffic|revenue|conversions)/);
    }
  });

  it("Fill Missing preserves current content", () => {
    const payload = heuristicSolutionProposal({
      solution: baseSolution({
        shortDescription: "Keep me",
        heroStatement: "Keep hero",
      }),
      action: "FILL_MISSING",
      lockedFields: [],
    });
    expect(payload.fields.some((f) => f.field === "shortDescription")).toBe(
      false,
    );
    expect(payload.fields.some((f) => f.field === "heroStatement")).toBe(false);
  });

  it("cannot propose protected fields", () => {
    const payload = heuristicSolutionProposal({
      solution: baseSolution(),
      action: "IMPROVE_SOLUTION",
      lockedFields: [],
    });
    for (const f of payload.fields) {
      expect(SOLUTION_PROTECTED_FIELDS.has(f.field)).toBe(false);
    }
  });

  it("pageContent schema preserves kind/slug", () => {
    const current = {
      kind: "leads",
      slug: "website-not-generating-leads",
      causesIntro: "A",
    };
    const merged = assertPageContentCompatible(current, {
      kind: "leads",
      slug: "website-not-generating-leads",
      causesIntro: "B",
    });
    expect(merged.kind).toBe("leads");
    expect(merged.causesIntro).toBe("B");
    expect(() =>
      assertPageContentCompatible(current, {
        kind: "ranking",
        slug: "website-not-generating-leads",
      }),
    ).toThrow(/kind/);
  });

  it("full proposal schema rejects arbitrary invented keys at parse boundary", () => {
    const parsed = SolutionFullProposalOutput.parse({
      heroStatement: "ok",
      whateverFieldTheModelInvents: "nope",
    });
    expect(parsed).not.toHaveProperty("whateverFieldTheModelInvents");
  });
});

describe("Shared proposal field builder", () => {
  it("supports partial field maps", () => {
    const changes = buildFieldChanges({
      entity: { summary: "a", tagline: "" },
      proposed: { summary: "b", tagline: "t", status: "PUBLISHED" },
      labels: { summary: "Summary", tagline: "Tagline" },
      allowlist: SERVICE_FIELD_ALLOWLIST,
      protectedFields: SERVICE_PROTECTED_FIELDS,
      lockedFields: [],
    });
    expect(changes.map((c) => c.field).sort()).toEqual(["summary", "tagline"]);
  });
});

describe("Registry + RBAC", () => {
  it("wires SERVICE through HOMEPAGE modules", () => {
    expect(getContentAssistant("SERVICE").displayName).toBe("Service");
    expect(getContentAssistant("SOLUTION").displayName).toBe("Solution");
    expect(getContentAssistant("PLATFORM").displayName).toBe("Platform");
    expect(getContentAssistant("INDUSTRY").displayName).toBe("Industry");
    expect(getContentAssistant("HOMEPAGE").displayName).toBe("Homepage");
  });

  it("requires both use_ai_writer and edit_draft", () => {
    expect(canUseContentAssistant("SUPER_ADMIN")).toBe(true);
    expect(canUseContentAssistant("EDITOR")).toBe(true);
    expect(canUseContentAssistant("REVIEWER")).toBe(false);
  });
});

describe("PII + secrets hygiene", () => {
  it("context builders never query Enquiry / EnquiryNote", () => {
    const serviceCtx = readFileSync(
      join(process.cwd(), "lib/ai/content-assistants/service/context.ts"),
      "utf8",
    );
    const solutionCtx = readFileSync(
      join(process.cwd(), "lib/ai/content-assistants/solution/context.ts"),
      "utf8",
    );
    for (const src of [serviceCtx, solutionCtx]) {
      expect(src).not.toMatch(/prisma\.enquiry/i);
      expect(src).not.toMatch(/EnquiryNote/);
      expect(src).not.toMatch(/password/i);
    }
    expect(AI_FORBIDDEN_CONTEXT_SOURCES).toContain("Enquiry");
    expect(AI_FORBIDDEN_CONTEXT_SOURCES).toContain("EnquiryNote");
  });

  it("proposal payloads do not embed api keys in schemas", () => {
    const parsed = ServiceFullProposalOutput.parse({ summary: "safe" });
    expect(JSON.stringify(parsed)).not.toMatch(/sk-|api[_-]?key/i);
  });
});
