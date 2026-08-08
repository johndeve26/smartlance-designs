/**
 * Content Improvement Pilot — generate proposals ONLY (no apply / no publish).
 *
 * 8 targets · existing assistants · official research overrides when Tavily unavailable.
 *
 * Usage: npx tsx scripts/run-content-improvement-pilot.ts
 */

import { writeFileSync, mkdirSync } from "fs";
import { createContentProposal } from "@/lib/ai/content-assistants/proposals";
import type { ProposalResearchSource } from "@/lib/ai/content-assistants/types";
import { prisma } from "@/lib/db";
import { getAIProviderStatus } from "@/lib/ai/providers";
import { createResearchProvider } from "@/lib/ai/research";

const ACTOR_EMAIL = "admin@smartlancedesigns.com";

function official(
  url: string,
  title: string,
  snippet: string,
): ProposalResearchSource {
  let domain = "";
  try {
    domain = new URL(url).hostname.replace(/^www\./, "");
  } catch {
    domain = "";
  }
  return {
    url,
    title,
    domain,
    sourceType: "OFFICIAL",
    checkedAt: new Date().toISOString(),
    whyUsed: snippet.slice(0, 1200),
  };
}

const WP_SOURCES: ProposalResearchSource[] = [
  official(
    "https://wordpress.org/",
    "WordPress.org — Meet WordPress",
    "Open source publishing platform. Block editor, themes, plugins. WordPress 7.0 emphasizes preferred AI providers, patterns, navigation overlays, visual revision history. Community and documentation via learn.wordpress.org / developer.wordpress.org.",
  ),
  official(
    "https://wordpress.org/news/2026/08/wordpress-7-0-3-release/",
    "WordPress 7.0.3 release",
    "Maintenance release in the 7.0 line (August 2026).",
  ),
  official(
    "https://developer.wordpress.org/",
    "WordPress Developer Resources",
    "Official developer documentation for themes, plugins, REST API, and block editor.",
  ),
];

const SHOPIFY_SOURCES: ProposalResearchSource[] = [
  official(
    "https://www.shopify.com/plus",
    "Shopify Plus",
    "Commerce platform positioned for DTC, retail, B2B, omnichannel, and extensibility via APIs/apps. Shop Pay and checkout performance emphasized. Headless options available. Marketing claims (conversion %, CAC) should not be copied as Smartlance proof.",
  ),
  official(
    "https://shopify.dev/",
    "Shopify.dev",
    "Official Shopify developer documentation for Admin API, Storefront API, Hydrogen, and app development.",
  ),
];

const WEBFLOW_SOURCES: ProposalResearchSource[] = [
  official(
    "https://webflow.com/",
    "Webflow",
    "Visual development platform for designing, building, and launching production websites. CMS, hosting, interactions, and collaboration features are part of the product surface. Evaluate fit for design-led marketing sites vs complex app-like requirements.",
  ),
  official(
    "https://university.webflow.com/",
    "Webflow University",
    "Official learning and product education resources for Webflow.",
  ),
];

const WOO_SOURCES: ProposalResearchSource[] = [
  official(
    "https://woocommerce.com/",
    "WooCommerce",
    "Open-source ecommerce for WordPress. Full control of checkout, data, hosting, payments, and extensions. Sell online/offline; customize to fit. Extensions and themes ecosystem. Enterprise options available.",
  ),
  official(
    "https://developer.woocommerce.com/",
    "WooCommerce Developer Docs",
    "Official developer documentation for extending WooCommerce.",
  ),
];

async function runOne(input: {
  label: string;
  entityType:
    | "HOMEPAGE"
    | "PLATFORM"
    | "INDUSTRY"
    | "SERVICE"
    | "COMPARISON";
  entityId: string;
  action: string;
  actorId: string;
  customInstructions?: string;
  lockedFields?: string[];
  researchOverride?: ProposalResearchSource[];
  forceHeuristic?: boolean;
}) {
  const started = Date.now();
  try {
    const proposal = await createContentProposal({
      entityType: input.entityType,
      entityId: input.entityId,
      action: input.action,
      actorId: input.actorId,
      customInstructions: input.customInstructions,
      lockedFields: input.lockedFields,
      researchOverride: input.researchOverride,
      // Prefer live provider when configured; force heuristic only if explicitly set
      forceHeuristic: input.forceHeuristic,
    });
    const payload = proposal.payloadJson as Record<string, unknown>;
    const run = proposal.runId
      ? await prisma.aIContentRun.findUnique({ where: { id: proposal.runId } })
      : null;
    return {
      ok: true as const,
      label: input.label,
      entityType: input.entityType,
      entityId: input.entityId,
      action: input.action,
      proposalId: proposal.id,
      runId: proposal.runId,
      status: proposal.status,
      provider: run?.provider ?? null,
      model: run?.model ?? null,
      promptVersion: proposal.promptVersion,
      durationMs: Date.now() - started,
      tokenUsageInput: run?.tokenUsageInput ?? null,
      tokenUsageOutput: run?.tokenUsageOutput ?? null,
      fieldCount: Array.isArray(payload.fields) ? payload.fields.length : 0,
      fields: payload.fields || [],
      reviewFindings: payload.reviewFindings || null,
      suggestedRelations: payload.suggestedRelations || null,
      research: payload.research || null,
      claims: payload.claims || null,
      error: null,
    };
  } catch (err) {
    return {
      ok: false as const,
      label: input.label,
      entityType: input.entityType,
      entityId: input.entityId,
      action: input.action,
      proposalId: null,
      runId: null,
      status: null,
      provider: null,
      model: null,
      promptVersion: null,
      durationMs: Date.now() - started,
      tokenUsageInput: null,
      tokenUsageOutput: null,
      fieldCount: 0,
      fields: [],
      reviewFindings: null,
      suggestedRelations: null,
      research: null,
      claims: null,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

async function main() {
  const actor = await prisma.adminUser.findFirst({
    where: { email: ACTOR_EMAIL },
    select: { id: true, email: true, role: true },
  });
  if (!actor) throw new Error(`Actor not found: ${ACTOR_EMAIL}`);

  const [providerStatus, researchProvider] = await Promise.all([
    getAIProviderStatus(),
    Promise.resolve(createResearchProvider()),
  ]);

  const writingConfigured = providerStatus.configured;
  const researchConfigured =
    researchProvider.id !== "manual" && researchProvider.isConfigured();

  // Without writing provider, assistants fall back to heuristics automatically.
  // Without Tavily, required research actions need official researchOverride.
  const forceHeuristic = !writingConfigured;

  const targets = {
    homepage: "home",
    wordpress: "cmsjixqn2000qakxpm2j53qbz", // will re-resolve by slug
    shopify: "",
    webflow: "",
    woocommerce: "",
    industryStr: "cmsjiz4nm000x5sxp3c9x8rzl",
    serviceRedesign: "cmsjixlb90002akxp3wy7660j",
    comparison: "cmsjj28p4006c5sxpy16dsali",
  };

  const platforms = await prisma.platform.findMany({
    where: {
      slug: { in: ["wordpress", "shopify", "webflow", "woocommerce"] },
    },
    select: { id: true, slug: true, name: true },
  });
  const bySlug = Object.fromEntries(platforms.map((p) => [p.slug, p]));

  const results = [];

  // 1. Homepage SEO only
  results.push(
    await runOne({
      label: "1 Homepage SEO",
      entityType: "HOMEPAGE",
      entityId: "home",
      action: "GENERATE_SEO",
      actorId: actor.id,
      forceHeuristic,
      lockedFields: [
        "heroEyebrow",
        "heroHeadline",
        "heroHeadlineAccent",
        "heroSupporting",
        "primaryCtaLabel",
        "primaryCtaHref",
        "secondaryCtaLabel",
        "secondaryCtaHref",
        "sections",
        "curatedServiceItems",
        "curatedTestimonialIds",
      ],
      customInstructions:
        "Generate Homepage SEO title, description, and OG text only for an international English-speaking business audience (US/UK/Europe/Canada/Australia). Reflect website design, development, redesign, SEO, and conversion without stuffing every Service into the title. No Nigeria/Ibadan/NGN. No award-winning, leading agency, or client-count claims.",
    }),
  );

  // 2–5 Platforms
  for (const [slug, sources] of [
    ["wordpress", WP_SOURCES],
    ["shopify", SHOPIFY_SOURCES],
    ["webflow", WEBFLOW_SOURCES],
    ["woocommerce", WOO_SOURCES],
  ] as const) {
    const p = bySlug[slug];
    if (!p) throw new Error(`Platform missing: ${slug}`);
    results.push(
      await runOne({
        label: `Platform ${p.name}`,
        entityType: "PLATFORM",
        entityId: p.id,
        action: "RESEARCH_AND_IMPROVE",
        actorId: actor.id,
        forceHeuristic,
        researchOverride: [...sources],
        customInstructions:
          "Prefer official sources. Preserve strong existing trade-offs and limitations. Do not invent partner/certification claims. Do not claim Smartlance verified experience unless the CMS flag already says so. Do not set lastReviewedAt. Avoid best-platform language.",
      }),
    );
  }

  // 6 Industry — Short-Term Rentals (proven, 3 Work)
  results.push(
    await runOne({
      label: "6 Industry Short-Term Rentals IMPROVE",
      entityType: "INDUSTRY",
      entityId: targets.industryStr,
      action: "IMPROVE_INDUSTRY",
      actorId: actor.id,
      forceHeuristic,
      customInstructions:
        "Transform the thin blurb into sector-specific Short-Term Rental / vacation rental website guidance (direct booking, guest trust, listing clarity). Use only verified related Work facts. Do not invent metrics or project counts. Keep commercially focused — not a giant SEO essay.",
    }),
  );
  results.push(
    await runOne({
      label: "6b Industry Short-Term Rentals SEO",
      entityType: "INDUSTRY",
      entityId: targets.industryStr,
      action: "GENERATE_SEO",
      actorId: actor.id,
      forceHeuristic,
      customInstructions:
        "SEO for Short-Term Rentals industry page. International English. No fake claims.",
    }),
  );

  // 7 Service Website Redesign
  results.push(
    await runOne({
      label: "7 Service Website Redesign REVIEW",
      entityType: "SERVICE",
      entityId: targets.serviceRedesign,
      action: "REVIEW_SERVICE",
      actorId: actor.id,
      forceHeuristic,
    }),
  );
  results.push(
    await runOne({
      label: "7b Service Website Redesign IMPROVE",
      entityType: "SERVICE",
      entityId: targets.serviceRedesign,
      action: "IMPROVE_SERVICE",
      actorId: actor.id,
      forceHeuristic,
      customInstructions:
        "Differentiate Website Redesign from Website Design, Development, Strategy, UI/UX, and Migration. Preserve strong existing narrative where better. Prefer Tell Us About Your Project or Get a Free Website Review for CTA as appropriate for existing-site problems.",
    }),
  );
  results.push(
    await runOne({
      label: "7c Service Website Redesign RELATIONS",
      entityType: "SERVICE",
      entityId: targets.serviceRedesign,
      action: "SUGGEST_RELATIONSHIPS",
      actorId: actor.id,
      forceHeuristic,
      customInstructions:
        "Suggest only relevant published Solutions (e.g. outdated website, slow website, low conversions, not ranking) with clear editorial reasons. No link spam.",
    }),
  );

  // 8 Comparison
  results.push(
    await runOne({
      label: "8 Comparison REVIEW",
      entityType: "COMPARISON",
      entityId: targets.comparison,
      action: "REVIEW_COMPARISON",
      actorId: actor.id,
      forceHeuristic,
    }),
  );
  results.push(
    await runOne({
      label: "8b Comparison RESEARCH_OPTIONS",
      entityType: "COMPARISON",
      entityId: targets.comparison,
      action: "RESEARCH_OPTIONS",
      actorId: actor.id,
      forceHeuristic,
      researchOverride: [...WP_SOURCES, ...WEBFLOW_SOURCES],
      customInstructions:
        "Research both WordPress and Webflow from official sources. Preserve strong matrix/sections. Stay neutral — no universal winner or fake ratings.",
    }),
  );
  results.push(
    await runOne({
      label: "8c Comparison CHECK_FRESHNESS",
      entityType: "COMPARISON",
      entityId: targets.comparison,
      action: "CHECK_FRESHNESS",
      actorId: actor.id,
      forceHeuristic,
      researchOverride: [...WP_SOURCES, ...WEBFLOW_SOURCES],
    }),
  );

  // Verify CMS entities unchanged (spot-check Homepage SEO still null)
  const homeAfter = await prisma.homepageContent.findUnique({
    where: { id: "home" },
    select: { seoTitle: true, metaTitle: true, draftJson: true },
  });
  const wpAfter = await prisma.platform.findUnique({
    where: { id: bySlug.wordpress.id },
    select: { lastReviewedAt: true, summary: true },
  });

  const report = {
    pilotedAt: new Date().toISOString(),
    actor: { id: actor.id, email: actor.email, role: actor.role },
    environment: {
      writingProviderConfigured: writingConfigured,
      writingProviderId: providerStatus.providerId,
      researchProviderId: researchProvider.id,
      researchConfigured,
      forceHeuristic,
      note: writingConfigured
        ? "Live writing provider used when available"
        : "Writing provider not configured — assistants used heuristic path. Official researchOverride supplied for Platform/Comparison research actions.",
    },
    targets: {
      homepage: "home",
      platforms: platforms.map((p) => ({ id: p.id, slug: p.slug, name: p.name })),
      industry: {
        id: targets.industryStr,
        slug: "short-term-rentals",
        name: "Short-Term Rentals",
      },
      service: {
        id: targets.serviceRedesign,
        slug: "website-redesign",
        title: "Website Redesign",
      },
      comparison: {
        id: targets.comparison,
        slug: "wordpress-vs-webflow",
      },
    },
    cmsUnchangedCheck: {
      homepageSeoStillEmpty: !homeAfter?.seoTitle && !homeAfter?.metaTitle,
      homepageDraftUntouched: !homeAfter?.draftJson,
      wordpressLastReviewedStillNull: wpAfter?.lastReviewedAt === null,
    },
    results,
  };

  mkdirSync("docs/audit-artifacts", { recursive: true });
  writeFileSync(
    "docs/audit-artifacts/content-improvement-pilot-raw.json",
    JSON.stringify(report, null, 2),
  );
  console.log(
    JSON.stringify(
      {
        results: results.map((r) => ({
          label: r.label,
          ok: r.ok,
          proposalId: r.proposalId,
          provider: r.provider,
          fields: r.fieldCount,
          error: r.error,
          durationMs: r.durationMs,
        })),
        cmsUnchangedCheck: report.cmsUnchangedCheck,
        environment: report.environment,
      },
      null,
      2,
    ),
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
