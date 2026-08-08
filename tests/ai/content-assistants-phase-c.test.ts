import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";
import type { Testimonial, WorkProject } from "@prisma/client";
import {
  WORK_FIELD_ALLOWLIST,
  WORK_PROTECTED_FIELDS,
  TESTIMONIAL_FIELD_ALLOWLIST,
  TESTIMONIAL_PROTECTED_FIELDS,
  filterAllowedFields,
} from "@/lib/ai/content-assistants/allowlists";
import {
  containsUnsupportedPerformanceClaim,
  deterministicFormatQuote,
  isSafeQuoteFormat,
  isValidExcerptFromOriginal,
} from "@/lib/ai/content-assistants/proof";
import { heuristicWorkProposal } from "@/lib/ai/content-assistants/work/heuristic";
import {
  createDeterministicExcerpt,
  heuristicTestimonialProposal,
} from "@/lib/ai/content-assistants/testimonial/heuristic";
import { getContentAssistant } from "@/lib/ai/content-assistants/registry";
import { canUseContentAssistant } from "@/lib/ai/content-assistants/security";
import { isCommercialPageRecommendation } from "@/lib/ai/topic-intelligence/content-assistant-handoff";

function baseWork(over: Partial<WorkProject> = {}): WorkProject {
  return {
    id: "work1",
    slug: "acme-redesign",
    name: "Acme Redesign",
    title: "Acme Redesign",
    clientName: "Acme",
    industryLabel: "Professional services",
    projectType: null,
    shortDescription: "",
    overview: null,
    challenge:
      "The client needed a clearer website structure for booking enquiries.",
    solution:
      "Smartlance redesigned the website information architecture and booking flow.",
    approach: null,
    designNotes: "PRIVATE — never send",
    developmentNotes: null,
    seoNotes: null,
    resultSummary: null,
    results: null,
    measurableResults: null,
    goals: null,
    servicesLabels: ["Website redesign"],
    technologies: null,
    platformId: null,
    platformLabel: null,
    platformsLabels: null,
    websiteUrl: null,
    oldUrl: null,
    year: 2024,
    coverImagePath: null,
    coverImageAlt: null,
    heroImagePath: null,
    heroImageAlt: null,
    gallery: null,
    relatedServiceHrefs: [],
    relatedWorkSlugs: null,
    featuredHomepage: false,
    featuredWorkArchive: false,
    featured: false,
    displayOrder: 0,
    heroStatement: null,
    challenges: null,
    approachSteps: null,
    solutionPoints: null,
    highlights: null,
    platformContext: null,
    outcomeHeading: null,
    seoTitle: "Acme Redesign | Smartlance",
    seoDescription: "Case study",
    ogTitle: null,
    ogDescription: null,
    ogImagePath: null,
    noIndex: false,
    canonicalOverride: null,
    approvedForAI: true,
    approvedProjectFacts: {
      problem: "Unclear booking flow on the existing site.",
      workCompleted: "Website redesign and booking flow simplification.",
      verifiedMetrics: [],
    },
    status: "DRAFT",
    publishedAt: null,
    createdById: null,
    updatedById: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...over,
  } as WorkProject;
}

function baseTestimonial(over: Partial<Testimonial> = {}): Testimonial {
  return {
    id: "t1",
    legacyId: "legacy-t1",
    quote: "They communicated clearly and delivered the website on time.",
    originalQuote:
      "They communicated clearly and delivered the website on time.",
    displayExcerpt: null,
    name: "Jane Doe",
    role: "Director",
    company: "Acme",
    serviceLabel: null,
    avatarPath: null,
    workProjectId: null,
    verified: true,
    featured: false,
    displayOrder: 0,
    themesJson: null,
    internalSource: "email",
    internalSourceUrl: null,
    internalVerificationNote: "SECRET note — never send to AI",
    status: "DRAFT",
    publishedAt: null,
    createdById: null,
    updatedById: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...over,
  } as Testimonial;
}

describe("Phase C registry", () => {
  it("registers WORK and TESTIMONIAL assistants", () => {
    expect(getContentAssistant("WORK").displayName).toBe("Case Study");
    expect(getContentAssistant("TESTIMONIAL").displayName).toBe("Testimonial");
    expect(getContentAssistant("WORK").actions.some((a) => a.id === "BUILD_FROM_PROJECT_FACTS")).toBe(
      true,
    );
    expect(
      getContentAssistant("TESTIMONIAL").actions.some((a) => a.id === "CREATE_EXCERPT"),
    ).toBe(true);
    expect(
      getContentAssistant("TESTIMONIAL").actions.some((a) =>
        a.id.includes("GENERATE"),
      ),
    ).toBe(false);
  });
});

describe("Work allowlists + protection", () => {
  it("rejects protected Work fields", () => {
    const filtered = filterAllowedFields(
      {
        challenge: "ok",
        status: "PUBLISHED",
        featuredHomepage: true,
        clientName: "Invented",
        approvedForAI: true,
        platformId: "hack",
      },
      WORK_FIELD_ALLOWLIST,
      WORK_PROTECTED_FIELDS,
    );
    expect(filtered).toEqual({ challenge: "ok" });
  });
});

describe("Case Study proof integrity", () => {
  it("does not invent results when source has none", () => {
    const payload = heuristicWorkProposal({
      work: baseWork({ resultSummary: null, measurableResults: null }),
      action: "BUILD_FROM_PROJECT_FACTS",
      lockedFields: [],
      facts: {
        problem: "Unclear booking flow on the existing site.",
        workCompleted: "Website redesign and booking flow simplification.",
      },
      enoughFacts: true,
      approvedForAI: true,
    });
    const fields = payload.fields.map((f) => f.field);
    expect(fields).not.toContain("resultSummary");
    expect(fields).not.toContain("measurableResults");
    expect(JSON.stringify(payload.fields)).not.toMatch(/\d+\s*%/);
  });

  it("formats verified metrics faithfully without embellishment", () => {
    const metric =
      "Client confirmed enquiries increased from 20 to 30 per month after launch.";
    const payload = heuristicWorkProposal({
      work: baseWork({ resultSummary: null }),
      action: "FORMAT_RESULTS",
      lockedFields: [],
      facts: { verifiedMetrics: [metric] },
      enoughFacts: true,
      approvedForAI: true,
    });
    const result = payload.fields.find((f) => f.field === "resultSummary");
    expect(result?.proposed).toContain("20");
    expect(result?.proposed).toContain("30");
    expect(String(result?.proposed)).not.toMatch(/explosive/i);
    expect(payload.claims?.some((c) => c.kind === "PROJECT_METRIC")).toBe(true);
  });

  it("does not infer platform without facts", () => {
    const payload = heuristicWorkProposal({
      work: baseWork({ platformId: null, platformLabel: null }),
      action: "SUGGEST_PLATFORM",
      lockedFields: [],
      facts: {},
      enoughFacts: true,
      approvedForAI: true,
      relationPool: {
        services: [],
        platforms: [{ id: "p1", slug: "wordpress", name: "WordPress" }],
      },
    });
    expect(payload.reviewFindings?.some((f) => f.severity === "BLOCKER")).toBe(
      true,
    );
    expect(payload.suggestedRelations || []).toHaveLength(0);
  });

  it("does not claim SEO/CRO services from redesign-only labels", () => {
    const payload = heuristicWorkProposal({
      work: baseWork({ servicesLabels: ["Website redesign"] }),
      action: "SUGGEST_SERVICES",
      lockedFields: [],
      facts: { workCompleted: "Website redesign." },
      enoughFacts: true,
      approvedForAI: true,
      relationPool: {
        services: [
          { href: "/services/seo", title: "SEO" },
          { href: "/services/cro", title: "CRO" },
          { href: "/services/analytics", title: "Analytics" },
          { href: "/services/website-development", title: "Website Development" },
        ],
        platforms: [],
      },
    });
    const titles = (payload.suggestedRelations || []).map((s) => s.title);
    expect(titles).not.toContain("SEO");
    expect(titles).not.toContain("CRO");
    expect(titles).not.toContain("Analytics");
  });

  it("blocks unsupported performance claims in scrub helper", () => {
    expect(
      containsUnsupportedPerformanceClaim("Organic traffic increased by 50%"),
    ).toBe(true);
    expect(
      containsUnsupportedPerformanceClaim("A clearer booking flow was delivered."),
    ).toBe(false);
  });

  it("blocks BUILD when facts are insufficient", () => {
    const payload = heuristicWorkProposal({
      work: baseWork({ challenge: "", solution: "" }),
      action: "BUILD_FROM_PROJECT_FACTS",
      lockedFields: [],
      facts: {},
      enoughFacts: false,
      approvedForAI: false,
    });
    expect(payload.fields).toHaveLength(0);
    expect(payload.reviewFindings?.[0]?.severity).toBe("BLOCKER");
  });
});

describe("Testimonial quote integrity", () => {
  it("blocks empty-quote generation", () => {
    const payload = heuristicTestimonialProposal({
      testimonial: baseTestimonial({ quote: "", originalQuote: "" }),
      action: "CREATE_EXCERPT",
      lockedFields: [],
      sourceQuote: "",
    });
    expect(payload.fields).toHaveLength(0);
    expect(payload.reviewFindings?.[0]?.message).toMatch(/Add the client's verified feedback/);
  });

  it("allows safe format, rejects creative rewrite", () => {
    const original =
      "They communicated clearly and delivered the website on time.";
    const messy =
      "they communicated clearly  and delivered the website on time.";
    expect(isSafeQuoteFormat(original, original)).toBe(true);
    expect(
      isSafeQuoteFormat(
        original,
        "Smartlance's exceptional communication and flawless execution exceeded all our expectations.",
      ),
    ).toBe(false);

    const ok = heuristicTestimonialProposal({
      testimonial: baseTestimonial({ quote: messy, originalQuote: messy }),
      action: "FORMAT_QUOTE",
      lockedFields: [],
      sourceQuote: messy,
    });
    expect(ok.fields[0]?.proposed).toBe(deterministicFormatQuote(messy));
    expect(String(ok.fields[0]?.proposed)).toMatch(/^They communicated/);
  });

  it("excerpt derives from original words", () => {
    const original =
      "The communication was excellent, the process was clear, and the finished website was easy for our team to manage.";
    const excerpt =
      "The communication was excellent, and the finished website was easy for our team to manage.";
    expect(isValidExcerptFromOriginal(original, excerpt)).toBe(true);
    expect(
      isValidExcerptFromOriginal(
        original,
        "Communication was outstanding and the site management was seamless.",
      ),
    ).toBe(false);

    const created = createDeterministicExcerpt(original, 12);
    expect(created).toBeTruthy();
    expect(
      isValidExcerptFromOriginal(original, String(created).replace(/…/g, " ")),
    ).toBe(true);
  });

  it("protects verified/status/identity fields", () => {
    const filtered = filterAllowedFields(
      {
        displayExcerpt: "ok",
        verified: true,
        status: "PUBLISHED",
        name: "CEO of Fortune 500",
        company: "Bigger Co",
        internalVerificationNote: "leak",
      },
      TESTIMONIAL_FIELD_ALLOWLIST,
      TESTIMONIAL_PROTECTED_FIELDS,
    );
    expect(filtered).toEqual({ displayExcerpt: "ok" });
  });

  it("does not suggest related work without clientName match", () => {
    const payload = heuristicTestimonialProposal({
      testimonial: baseTestimonial({ company: "Zen Stays" }),
      action: "SUGGEST_RELATED_WORK",
      lockedFields: [],
      sourceQuote: baseTestimonial().quote,
      relationPool: {
        work: [
          {
            id: "w1",
            slug: "other",
            name: "Other Project",
            clientName: "Acme",
          },
        ],
      },
    });
    expect(payload.suggestedRelations || []).toHaveLength(0);
  });
});

describe("Phase C privacy + secrets source scans", () => {
  it("Work/Testimonial context builders never query Enquiry", () => {
    const workCtx = readFileSync(
      join(process.cwd(), "lib/ai/content-assistants/work/context.ts"),
      "utf8",
    );
    const tCtx = readFileSync(
      join(process.cwd(), "lib/ai/content-assistants/testimonial/context.ts"),
      "utf8",
    );
    expect(workCtx).not.toMatch(/prisma\.enquiry/i);
    expect(tCtx).not.toMatch(/prisma\.enquiry/i);
    expect(tCtx).toMatch(/never include internalVerificationNote/);
    expect(workCtx).toMatch(/NEVER sent unless approvedForAI/);
  });

  it("XSS quote text stays plain text in display helper path", () => {
    const evil = '<script>alert(1)</script> They were great.';
    expect(deterministicFormatQuote(evil)).toContain("<script>");
    // Formatting does not strip tags into executable HTML — Admin renders as text in textarea
    expect(isSafeQuoteFormat(evil, deterministicFormatQuote(evil))).toBe(true);
  });

  it("no GENERATE testimonial action and TI has no generate-testimonial path", () => {
    const actions = getContentAssistant("TESTIMONIAL").actions.map((a) => a.id);
    expect(actions).not.toContain("GENERATE_TESTIMONIAL");
    expect(isCommercialPageRecommendation("UPDATE_SERVICE_PAGE")).toBe(true);
  });

  it("RBAC gate still requires AI + draft edit", () => {
    expect(canUseContentAssistant("EDITOR")).toBe(true);
    expect(canUseContentAssistant("REVIEWER")).toBe(false);
  });
});

describe("Quote attack / meaning tests", () => {
  it("rejects meaning-changing praise rewrite", () => {
    const original =
      "They communicated clearly and delivered the website on time.";
    const bad =
      "Smartlance's exceptional communication and flawless execution exceeded all our expectations.";
    const payload = heuristicTestimonialProposal({
      testimonial: baseTestimonial({ quote: original, originalQuote: original }),
      action: "FORMAT_QUOTE",
      lockedFields: [],
      sourceQuote: original,
    });
    // Heuristic only proposes deterministic format — never the bad rewrite
    expect(String(payload.fields[0]?.proposed || "")).not.toContain("exceptional");
    expect(isSafeQuoteFormat(original, bad)).toBe(false);
  });
});
