/**
 * Topic Intelligence editorial calibration fixtures.
 * Gold labels for evaluation — not permanent algorithm priority.
 * ~40 seeds; ~25% holdout.
 */

import type { TopicContentFormat, TopicRecommendation } from "@prisma/client";
import type {
  ContentIndexRecord,
  CoverageRow,
  NormalizedTopicSignal,
} from "@/lib/ai/topic-intelligence/types";

export const TOPIC_INTELLIGENCE_PROMPT_VERSIONS = {
  discovery: "topic-discovery:v1",
  opportunityAnalysis: "opportunity-analysis:v1",
  signalClustering: "signal-clustering:v1",
} as const;

export type TopicExpectedDecision =
  | TopicRecommendation
  | "MULTIPLE_ACCEPTABLE";

export type TopicCalibrationCategory =
  | "website-design"
  | "website-development"
  | "seo"
  | "conversion"
  | "website-performance"
  | "ecommerce"
  | "platforms"
  | "digital-marketing"
  | "local-visibility"
  | "hospitality"
  | "real-estate"
  | "professional-services"
  | "industry-news"
  | "format-boundary"
  | "bad-idea"
  | "duplicate";

export type TopicCalibrationFixture = {
  id: string;
  seed: string;
  category: TopicCalibrationCategory;
  /** Held out of prompt-tuning loops; run after changes */
  holdout?: boolean;
  /** Acceptable engine recommendations (MULTIPLE_ACCEPTABLE = any of expectedDecisions) */
  expectedDecisions: TopicRecommendation[];
  expectedFormat?: TopicContentFormat;
  /** Content family note for humans */
  contentFamily?: string;
  businessRelationship?: string;
  reason: string;
  /** Mock external/internal signals for offline evaluation */
  mockSignals: Array<Partial<NormalizedTopicSignal> & { title: string }>;
  /** Reasoning should mention at least one of these substrings (case-insensitive) when PASS */
  reasoningHints?: string[];
};

/** Shared metadata index approximating Smartlance coverage for calibration (no Enquiry data). */
export const CALIBRATION_CONTENT_INDEX: ContentIndexRecord[] = [
  {
    id: "svc-redesign",
    title: "Website Redesign",
    slug: "/services/website-redesign",
    path: "/services/website-redesign",
    type: "Service",
    topics: ["redesign", "website"],
    summary: "Redesign websites around clarity, conversion and SEO foundations.",
  },
  {
    id: "svc-migration",
    title: "Website Migration",
    slug: "/services/website-migration",
    path: "/services/website-migration",
    type: "Service",
    topics: ["migration", "website"],
    summary: "Plan migrations that protect visibility and conversions.",
  },
  {
    id: "svc-audit",
    title: "Website Audit",
    slug: "/services/website-audit",
    path: "/services/website-audit",
    type: "Service",
    topics: ["audit", "website"],
    summary: "Structured website audits for technical and conversion issues.",
  },
  {
    id: "sol-outdated",
    title: "Outdated Website",
    slug: "outdated-website",
    path: "/solutions/outdated-website",
    type: "Solution",
    topics: ["outdated", "redesign"],
    summary: "When the site no longer reflects the business.",
  },
  {
    id: "sol-leads",
    title: "Website Not Generating Leads",
    slug: "website-not-generating-leads",
    path: "/solutions/website-not-generating-leads",
    type: "Solution",
    topics: ["leads", "enquiries", "traffic"],
    summary: "Traffic without enough enquiries.",
  },
  {
    id: "sol-slow",
    title: "Slow Website",
    slug: "slow-website",
    path: "/solutions/slow-website",
    type: "Solution",
    topics: ["performance", "slow"],
    summary: "When speed hurts experience and conversions.",
  },
  {
    id: "guide-redesign",
    title: "The Complete Website Redesign Guide",
    slug: "website-redesign-guide",
    path: "/guides/website-redesign-guide",
    type: "Guide",
    topics: ["redesign"],
    summary: "Long-form redesign planning guide.",
  },
  {
    id: "check-redesign",
    title: "Website Redesign Checklist",
    slug: "website-redesign-checklist",
    path: "/checklists/website-redesign-checklist",
    type: "Checklist",
    topics: ["redesign", "checklist"],
    summary: "Checklist for redesign projects.",
    publishedAt: "2026-01-01",
  },
  {
    id: "cmp-wp-webflow",
    title: "WordPress vs Webflow",
    slug: "wordpress-vs-webflow",
    path: "/compare/wordpress-vs-webflow",
    type: "Comparison",
    topics: ["wordpress", "webflow"],
    summary: "Trade-offs between WordPress and Webflow.",
  },
  {
    id: "gloss-canonical",
    title: "Canonical URL",
    slug: "canonical-url",
    path: "/glossary/canonical-url",
    type: "Glossary",
    topics: ["canonical"],
    summary: "The preferred URL for a page when duplicates exist.",
  },
  {
    id: "ins-tech-seo",
    title: "Technical SEO foundations",
    slug: "technical-seo-foundations",
    path: "/insights/technical-seo-foundations",
    type: "Insight",
    topics: ["SEO", "technical"],
    summary: "Foundations of technical SEO for business sites.",
    publishedAt: "2025-06-01",
  },
  {
    id: "ins-convert",
    title: "What makes a website convert",
    slug: "what-makes-a-website-convert",
    path: "/insights/what-makes-a-website-convert",
    type: "Insight",
    topics: ["conversion"],
    summary: "Conversion fundamentals for business websites.",
  },
  // Heavy STR coverage (duplicate pressure)
  {
    id: "ins-airbnb-1",
    title: "Why vacation rental owners should not rely only on Airbnb",
    slug: "why-vacation-rental-owners-should-not-rely-only-on-airbnb",
    path: "/insights/why-vacation-rental-owners-should-not-rely-only-on-airbnb",
    type: "Insight",
    topics: ["hospitality", "airbnb", "direct booking"],
    summary: "Airbnb dependence vs direct booking independence.",
  },
  {
    id: "ins-airbnb-2",
    title: "Airbnb dependence vs independence why your website matters",
    slug: "airbnb-dependence-vs-independence-why-your-website-matters-for-vacation-rental-success",
    path: "/insights/airbnb-dependence-vs-independence",
    type: "Insight",
    topics: ["airbnb", "direct booking"],
    summary: "Website matters for vacation rental independence.",
  },
  {
    id: "ins-pricelabs-1",
    title: "Harness the power of PriceLabs for dynamic Airbnb pricing",
    slug: "harness-the-power-of-pricelabs",
    path: "/insights/harness-the-power-of-pricelabs",
    type: "Insight",
    topics: ["pricelabs", "pricing"],
    summary: "PriceLabs dynamic pricing for rentals.",
  },
  {
    id: "ins-pricelabs-2",
    title: "PriceLabs vs manual pricing why automation wins",
    slug: "pricelabs-vs-manual-pricing",
    path: "/insights/pricelabs-vs-manual-pricing",
    type: "Insight",
    topics: ["pricelabs"],
    summary: "Automation vs manual vacation rental pricing.",
  },
  {
    id: "ins-calendar-1",
    title: "Avoid double bookings with centralized calendar management",
    slug: "avoid-double-bookings",
    path: "/insights/avoid-double-bookings",
    type: "Insight",
    topics: ["calendar", "double booking"],
    summary: "Centralized calendars prevent double bookings.",
  },
  {
    id: "ins-calendar-2",
    title: "Why calendar sync is essential for multi-platform listings",
    slug: "why-calendar-sync-is-essential",
    path: "/insights/why-calendar-sync-is-essential",
    type: "Insight",
    topics: ["calendar sync"],
    summary: "Calendar sync across Airbnb, VRBO and direct site.",
  },
  {
    id: "plat-wp",
    title: "WordPress Website Design & Development",
    slug: "wordpress",
    path: "/platforms/wordpress",
    type: "Platform",
    topics: ["wordpress"],
    summary: "WordPress platform page.",
  },
  {
    id: "plat-shopify",
    title: "Shopify Website Design & Development",
    slug: "shopify",
    path: "/platforms/shopify",
    type: "Platform",
    topics: ["shopify"],
    summary: "Shopify platform page.",
  },
  {
    id: "plat-bc",
    title: "BigCommerce Website Design & Development",
    slug: "bigcommerce",
    path: "/platforms/bigcommerce",
    type: "Platform",
    topics: ["bigcommerce"],
    summary: "BigCommerce platform page.",
  },
];

export const CALIBRATION_COVERAGE: CoverageRow[] = [
  {
    entityType: "Service",
    id: "svc-redesign",
    title: "Website Redesign",
    path: "/services/website-redesign",
    slugOrHref: "/services/website-redesign",
    insightCount: 1,
    resourceCount: 2,
    workCount: 1,
    recentInsightCount: 0,
    gapLevel: "moderate",
    relatedTopics: ["redesign"],
  },
  {
    entityType: "Solution",
    id: "sol-slow",
    title: "Slow Website",
    path: "/solutions/slow-website",
    slugOrHref: "slow-website",
    insightCount: 0,
    resourceCount: 0,
    workCount: 0,
    recentInsightCount: 0,
    gapLevel: "none",
    relatedTopics: ["performance", "slow"],
  },
  {
    entityType: "Service",
    id: "svc-migration",
    title: "Website Migration",
    path: "/services/website-migration",
    slugOrHref: "/services/website-migration",
    insightCount: 0,
    resourceCount: 1,
    workCount: 0,
    recentInsightCount: 0,
    gapLevel: "weak",
    relatedTopics: ["migration"],
  },
];

function news(title: string, opts?: Partial<NormalizedTopicSignal>) {
  return {
    title,
    type: "NEWS" as const,
    provider: "mock-news",
    sourceAuthorityType: "NEWS" as const,
    freshness: "TIMELY" as const,
    ...opts,
  };
}

function research(title: string, opts?: Partial<NormalizedTopicSignal>) {
  return {
    title,
    type: "RESEARCH" as const,
    provider: "mock-web",
    sourceAuthorityType: "INDUSTRY" as const,
    freshness: "HYBRID" as const,
    ...opts,
  };
}

function official(title: string, opts?: Partial<NormalizedTopicSignal>) {
  return {
    title,
    type: "OFFICIAL_GUIDANCE" as const,
    provider: "mock-official",
    sourceAuthorityType: "OFFICIAL" as const,
    freshness: "TIMELY" as const,
    ...opts,
  };
}

/** Training/calibration fixtures (used for tuning + regression). */
export const TOPIC_CALIBRATION_FIXTURES: TopicCalibrationFixture[] = [
  // —— Strong opportunities ——
  {
    id: "redesign-vs-rebuild",
    seed: "Redesign vs rebuild",
    category: "website-design",
    expectedDecisions: ["WRITE_NEW", "SUPPORT_COMMERCIAL_PAGE"],
    expectedFormat: "INSIGHT",
    contentFamily: "decision",
    businessRelationship: "/services/website-redesign",
    reason: "Decision intent; Service + Solution exist; limited Insight owning refresh-vs-rebuild.",
    mockSignals: [
      research("Website redesign vs rebuild decision criteria for businesses"),
      research("When to rebuild a website instead of redesigning"),
    ],
    reasoningHints: ["redesign", "rebuild", "decision"],
  },
  {
    id: "traffic-no-enquiries",
    seed: "Traffic but no enquiries",
    category: "conversion",
    expectedDecisions: ["WRITE_NEW", "SUPPORT_COMMERCIAL_PAGE", "UPDATE_EXISTING"],
    expectedFormat: "INSIGHT",
    businessRelationship: "/solutions/website-not-generating-leads",
    reason: "Diagnostic conversion problem; Solution page exists.",
    mockSignals: [
      research("Why website traffic does not generate enquiries"),
      research("Website visitors but no contact form submissions"),
    ],
    reasoningHints: ["enquir", "traffic", "lead"],
  },
  {
    id: "migration-ranking",
    seed: "Website migration without ranking loss",
    category: "seo",
    expectedDecisions: ["WRITE_NEW", "SUPPORT_COMMERCIAL_PAGE"],
    expectedFormat: "INSIGHT",
    businessRelationship: "/services/website-migration",
    reason: "Process/diagnostic migration SEO; commercial page strong, Insight depth weak.",
    mockSignals: [
      research("Website migration SEO redirects and ranking risk"),
      official("Search documentation on site moves and redirects"),
    ],
    reasoningHints: ["migration"],
  },
  {
    id: "cwv-business",
    seed: "Core Web Vitals for business owners",
    category: "website-performance",
    expectedDecisions: ["WRITE_NEW", "SUPPORT_COMMERCIAL_PAGE"],
    expectedFormat: "INSIGHT",
    businessRelationship: "/solutions/slow-website",
    reason: "Hybrid evergreen + current metrics; Solution coverage weak editorially.",
    mockSignals: [
      official("Core Web Vitals guidance for page experience"),
      research("What LCP means for business websites"),
    ],
    reasoningHints: ["vital", "performance", "slow"],
  },
  {
    id: "brief-agency",
    seed: "How to brief a web design agency",
    category: "website-design",
    expectedDecisions: ["WRITE_NEW", "SUPPORT_COMMERCIAL_PAGE"],
    expectedFormat: "INSIGHT",
    reason: "Evergreen process content with clear reader need.",
    mockSignals: [research("How to write a website project brief for an agency")],
    reasoningHints: ["brief"],
  },
  {
    id: "wp-vs-webflow-custom",
    seed: "WordPress vs Webflow vs custom",
    category: "platforms",
    expectedDecisions: ["EXPAND_EXISTING_RESOURCE", "UPDATE_EXISTING", "WRITE_NEW"],
    expectedFormat: "COMPARISON",
    reason: "Comparison intent; may expand existing WordPress vs Webflow comparison.",
    mockSignals: [research("WordPress vs Webflow vs custom website trade-offs")],
    reasoningHints: ["wordpress", "webflow", "compar"],
  },
  {
    id: "local-seo-service",
    seed: "Local SEO for service businesses",
    category: "local-visibility",
    expectedDecisions: ["WRITE_NEW", "SUPPORT_COMMERCIAL_PAGE"],
    expectedFormat: "INSIGHT",
    reason: "Audience-specific local visibility depth.",
    mockSignals: [
      research("Local SEO for service businesses Google Business Profile"),
      official("Local search documentation for business profiles"),
    ],
    reasoningHints: ["local"],
  },
  {
    id: "website-audit-scope",
    seed: "What belongs in a website audit",
    category: "seo",
    expectedDecisions: ["WRITE_NEW", "SUPPORT_COMMERCIAL_PAGE"],
    expectedFormat: "INSIGHT",
    businessRelationship: "/services/website-audit",
    reason: "Process clarity supporting Audit service.",
    mockSignals: [research("What a website audit should include technical SEO conversion")],
    reasoningHints: ["audit"],
  },
  {
    id: "shopify-vs-bigcommerce",
    seed: "Shopify vs BigCommerce",
    category: "ecommerce",
    expectedDecisions: ["WRITE_NEW", "EXPAND_EXISTING_RESOURCE", "SUPPORT_COMMERCIAL_PAGE"],
    expectedFormat: "COMPARISON",
    reason: "Platform decision content.",
    mockSignals: [research("Shopify vs BigCommerce for growing catalogues")],
    reasoningHints: ["shopify", "bigcommerce"],
  },
  {
    id: "traffic-kpi",
    seed: "Why more traffic is not always the right first KPI",
    category: "conversion",
    expectedDecisions: ["WRITE_NEW", "SUPPORT_COMMERCIAL_PAGE"],
    expectedFormat: "INSIGHT",
    reason: "Measurement/strategy angle distinct from traffic-no-leads diagnosis.",
    mockSignals: [research("Website KPI traffic vs enquiries for service businesses")],
    reasoningHints: ["traffic", "kpi", "enquir"],
  },
  {
    id: "trust-signals",
    seed: "Trust signals on service-business websites",
    category: "conversion",
    expectedDecisions: ["WRITE_NEW", "SUPPORT_COMMERCIAL_PAGE"],
    expectedFormat: "INSIGHT",
    reason: "Conversion/trust depth for service sites.",
    mockSignals: [research("Trust signals that improve enquiries on service websites")],
    reasoningHints: ["trust"],
  },
  {
    id: "tracking-enquiries",
    seed: "How to track website enquiries accurately",
    category: "conversion",
    expectedDecisions: ["WRITE_NEW", "SUPPORT_COMMERCIAL_PAGE"],
    expectedFormat: "INSIGHT",
    reason: "Distinct from traffic-not-converting; measurement intent.",
    mockSignals: [research("Tracking website form enquiries and calls accurately")],
    reasoningHints: ["track", "enquir"],
  },

  // —— Duplicates / STR ——
  {
    id: "dup-tech-seo",
    seed: "Technical SEO foundations",
    category: "duplicate",
    expectedDecisions: ["UPDATE_EXISTING", "IGNORE"],
    expectedFormat: "INSIGHT",
    reason: "Existing Insight owns substantially the same intent.",
    mockSignals: [research("Technical SEO foundations for business websites")],
    reasoningHints: ["existing", "overlap", "update", "duplicate", "intent"],
  },
  {
    id: "dup-airbnb-depend",
    seed: "Why vacation rental owners should not rely only on Airbnb",
    category: "hospitality",
    expectedDecisions: ["UPDATE_EXISTING", "IGNORE"],
    reason: "Near-identical STR angle already heavily covered.",
    mockSignals: [research("Why vacation rental owners should not rely only on Airbnb")],
    reasoningHints: ["existing", "airbnb", "overlap", "duplicate", "intent"],
  },
  {
    id: "dup-pricelabs",
    seed: "PriceLabs dynamic pricing for Airbnb",
    category: "hospitality",
    expectedDecisions: ["UPDATE_EXISTING", "IGNORE"],
    reason: "Multiple PriceLabs Insights already exist.",
    mockSignals: [research("PriceLabs dynamic pricing for Airbnb direct bookings")],
    reasoningHints: ["pricelabs", "existing", "overlap", "duplicate"],
  },
  {
    id: "dup-calendar-sync",
    seed: "Calendar sync to avoid double bookings",
    category: "hospitality",
    expectedDecisions: ["UPDATE_EXISTING", "IGNORE"],
    reason: "Calendar sync / double booking already covered repeatedly.",
    mockSignals: [research("Avoid double bookings with calendar sync Airbnb VRBO")],
    reasoningHints: ["calendar", "existing", "overlap", "double"],
  },
  {
    id: "str-distinct-ok",
    seed: "Direct booking website requirements checklist for multi-property hosts",
    category: "hospitality",
    expectedDecisions: ["WRITE_NEW", "EXPAND_EXISTING_RESOURCE", "SUPPORT_COMMERCIAL_PAGE", "MONITOR"],
    reason: "Distinct checklist/requirements angle — industry OK if not a near-duplicate.",
    mockSignals: [
      research("Requirements checklist for vacation rental direct booking websites"),
    ],
    reasoningHints: ["booking", "checklist", "rental", "requirement"],
  },

  // —— Bad ideas ——
  {
    id: "bad-10-reasons",
    seed: "10 Reasons Every Business Needs a Website",
    category: "bad-idea",
    expectedDecisions: ["IGNORE"],
    reason: "Commodity listicle with no distinctive Smartlance value.",
    mockSignals: [research("10 Reasons Every Business Needs a Website in 2026")],
    reasoningHints: ["ignore", "commodity", "generic", "listicle", "hype", "no clear"],
  },
  {
    id: "bad-websites-important",
    seed: "Why Websites Are Important in 2026",
    category: "bad-idea",
    expectedDecisions: ["IGNORE"],
    reason: "Generic year-stamped overview.",
    mockSignals: [research("Why Websites Are Important in 2026")],
    reasoningHints: ["ignore", "generic", "commodity"],
  },
  {
    id: "bad-trends-50",
    seed: "Top 50 Web Design Trends You Cannot Ignore",
    category: "bad-idea",
    expectedDecisions: ["IGNORE"],
    reason: "Trend-bait listicle.",
    mockSignals: [news("Top 50 Web Design Trends You Cannot Ignore")],
    reasoningHints: ["ignore", "trend", "listicle", "generic"],
  },
  {
    id: "bad-ai-everything",
    seed: "How AI Will Change Everything",
    category: "bad-idea",
    expectedDecisions: ["IGNORE", "MONITOR"],
    reason: "Vague hype without audience-specific need.",
    mockSignals: [news("How AI Will Change Everything in business")],
    reasoningHints: ["ignore", "hype", "vague", "monitor"],
  },
  {
    id: "bad-best-website",
    seed: "Best Website Ever: The Ultimate Guide",
    category: "bad-idea",
    expectedDecisions: ["IGNORE"],
    reason: "Superative ultimate-guide spam.",
    mockSignals: [research("Best Website Ever The Ultimate Guide")],
    reasoningHints: ["ignore", "ultimate", "generic"],
  },
  {
    id: "bad-celebrity",
    seed: "Celebrity box office gossip tonight",
    category: "bad-idea",
    expectedDecisions: ["IGNORE"],
    reason: "Unrelated viral noise.",
    mockSignals: [news("Celebrity box office gossip tonight", { summary: "reality tv" })],
    reasoningHints: ["ignore", "noise", "irrelevant"],
  },

  // —— Format boundaries ——
  {
    id: "fmt-canonical",
    seed: "What is a canonical URL?",
    category: "format-boundary",
    expectedDecisions: ["EXPAND_EXISTING_RESOURCE"],
    expectedFormat: "GLOSSARY",
    reason: "Definitional → Glossary.",
    mockSignals: [research("What is a canonical URL definition")],
    reasoningHints: ["glossary", "definition"],
  },
  {
    id: "fmt-redesign-checklist",
    seed: "Website redesign checklist",
    category: "format-boundary",
    expectedDecisions: ["EXPAND_EXISTING_RESOURCE", "UPDATE_EXISTING"],
    expectedFormat: "CHECKLIST",
    reason: "Checklist already exists.",
    mockSignals: [research("Website redesign checklist for businesses")],
    reasoningHints: ["checklist"],
  },
  {
    id: "fmt-wp-webflow",
    seed: "WordPress vs Webflow",
    category: "format-boundary",
    expectedDecisions: ["EXPAND_EXISTING_RESOURCE", "UPDATE_EXISTING"],
    expectedFormat: "COMPARISON",
    reason: "Existing comparison owns intent.",
    mockSignals: [research("WordPress vs Webflow comparison")],
    reasoningHints: ["compar", "wordpress", "webflow", "existing"],
  },
  {
    id: "fmt-services",
    seed: "What services does Smartlance offer?",
    category: "format-boundary",
    expectedDecisions: ["UPDATE_SERVICE_PAGE", "IGNORE", "SUPPORT_COMMERCIAL_PAGE"],
    expectedFormat: "SERVICE_UPDATE",
    reason: "Service catalogue — not Insight.",
    mockSignals: [research("What services does Smartlance offer website design SEO")],
    reasoningHints: ["service"],
  },

  // —— News / platform ——
  {
    id: "news-wp-release",
    seed: "WordPress major release performance features",
    category: "industry-news",
    expectedDecisions: ["UPDATE_PLATFORM_PAGE", "SUPPORT_COMMERCIAL_PAGE", "MONITOR", "WRITE_NEW"],
    reason: "Platform change — assess Platform update vs Insight.",
    mockSignals: [
      official("WordPress 6.x release notes performance improvements", {
        sourceUrl: "https://wordpress.org/news/release",
      }),
      news("Industry coverage of WordPress release"),
    ],
    reasoningHints: ["wordpress", "platform", "update", "release"],
  },
  {
    id: "news-cwv-metric",
    seed: "Core Web Vitals metric guidance change",
    category: "website-performance",
    expectedDecisions: ["UPDATE_EXISTING", "WRITE_NEW", "MONITOR"],
    reason: "Official guidance change may refresh performance content.",
    mockSignals: [
      official("Updated Core Web Vitals documentation", {
        sourceUrl: "https://web.dev/articles/vitals",
      }),
      news("What the Core Web Vitals change means for publishers"),
    ],
    reasoningHints: ["vital", "official", "update", "refresh", "guidance"],
  },
  {
    id: "news-early-rumor",
    seed: "Unconfirmed CMS feature rumor from single blog",
    category: "industry-news",
    expectedDecisions: ["MONITOR", "IGNORE"],
    reason: "Single weak source — too early.",
    mockSignals: [
      news("Rumor: major CMS will reinvent websites next month", {
        sourceAuthorityType: "COMMUNITY",
      }),
    ],
    reasoningHints: ["monitor", "early", "single", "weak", "insufficient"],
  },
  {
    id: "news-shopify-checkout",
    seed: "Shopify checkout platform update for merchants",
    category: "ecommerce",
    expectedDecisions: ["UPDATE_PLATFORM_PAGE", "SUPPORT_COMMERCIAL_PAGE", "WRITE_NEW", "MONITOR"],
    reason: "Commerce platform change with possible Platform page refresh.",
    mockSignals: [
      official("Shopify checkout update for merchants", {
        sourceUrl: "https://shopify.dev/changelog",
      }),
      news("What Shopify checkout changes mean for stores"),
    ],
    reasoningHints: ["shopify", "platform", "checkout"],
  },

  // —— Industries ——
  {
    id: "re-property-sites",
    seed: "What property buyers look for on real estate websites",
    category: "real-estate",
    expectedDecisions: ["WRITE_NEW", "SUPPORT_COMMERCIAL_PAGE", "MONITOR"],
    reason: "Industry-specific decision need if distinct.",
    mockSignals: [research("Property website trust signals for buyers and agents")],
    reasoningHints: ["property", "real estate", "buyer"],
  },
  {
    id: "pro-services-expertise",
    seed: "Professional services websites that demonstrate expertise without sounding generic",
    category: "professional-services",
    expectedDecisions: ["WRITE_NEW", "SUPPORT_COMMERCIAL_PAGE"],
    reason: "Industry-specific content quality need.",
    mockSignals: [
      research("Professional services website content that demonstrates expertise"),
    ],
    reasoningHints: ["professional", "expertise"],
  },
  {
    id: "fake-industry-append",
    seed: "Website redesign for real estate companies",
    category: "real-estate",
    expectedDecisions: ["WRITE_NEW", "SUPPORT_COMMERCIAL_PAGE", "IGNORE", "MONITOR"],
    reason: "May be valid if distinct; reject if only generic redesign + industry label.",
    mockSignals: [research("Website redesign tips for real estate companies")],
    reasoningHints: ["redesign", "real estate", "propert"],
  },
  {
    id: "ecommerce-catalogue",
    seed: "Catalogue structure mistakes that hurt Shopify SEO",
    category: "ecommerce",
    expectedDecisions: ["WRITE_NEW", "SUPPORT_COMMERCIAL_PAGE"],
    reason: "Specific ecommerce SEO diagnostic.",
    mockSignals: [research("Shopify catalogue structure SEO mistakes for growing stores")],
    reasoningHints: ["shopify", "catalogue", "seo"],
  },
  {
    id: "dev-accessibility-gap",
    seed: "Website accessibility for business decision-makers",
    category: "website-development",
    expectedDecisions: ["WRITE_NEW", "SUPPORT_COMMERCIAL_PAGE", "MONITOR"],
    expectedFormat: "INSIGHT",
    reason: "Potential coverage gap; legal themes need higher factual review.",
    mockSignals: [
      research("Website accessibility WCAG for business owners"),
      official("Web accessibility standards overview"),
    ],
    reasoningHints: ["accessib"],
  },
];

/** Holdout fixtures (~25%) — evaluate after tuning, not used as prompt examples. */
export const TOPIC_CALIBRATION_HOLDOUT: TopicCalibrationFixture[] = [
  {
    id: "hold-migration-checklist",
    seed: "Website migration checklist for SEO redirects",
    category: "seo",
    holdout: true,
    expectedDecisions: ["EXPAND_EXISTING_RESOURCE", "WRITE_NEW", "SUPPORT_COMMERCIAL_PAGE"],
    reason: "May be Checklist or Insight depending on existing resources.",
    mockSignals: [research("Website migration checklist SEO redirects sitemap")],
  },
  {
    id: "hold-inp",
    seed: "INP explained for non-developers",
    category: "website-performance",
    holdout: true,
    expectedDecisions: ["WRITE_NEW", "SUPPORT_COMMERCIAL_PAGE", "EXPAND_EXISTING_RESOURCE"],
    reason: "Performance metric education.",
    mockSignals: [official("Interaction to Next Paint INP documentation")],
  },
  {
    id: "hold-airbnb-fees",
    seed: "Avoid marketplace fees with direct bookings",
    category: "hospitality",
    holdout: true,
    expectedDecisions: ["UPDATE_EXISTING", "IGNORE"],
    reason: "Near-duplicate of existing direct-booking fee content.",
    mockSignals: [research("Avoid marketplace fees the financial advantage of direct bookings")],
  },
  {
    id: "hold-ultimate-seo",
    seed: "The Ultimate SEO Guide for Any Business 2026",
    category: "bad-idea",
    holdout: true,
    expectedDecisions: ["IGNORE"],
    reason: "Ultimate-guide commodity.",
    mockSignals: [research("The Ultimate SEO Guide for Any Business 2026")],
  },
  {
    id: "hold-gbp",
    seed: "Google Business Profile basics for local service firms",
    category: "local-visibility",
    holdout: true,
    expectedDecisions: ["WRITE_NEW", "SUPPORT_COMMERCIAL_PAGE", "EXPAND_EXISTING_RESOURCE"],
    reason: "Local visibility depth.",
    mockSignals: [research("Google Business Profile optimization for local service businesses")],
  },
  {
    id: "hold-competitor-copy",
    seed: "Competitor published generic web design tips article",
    category: "bad-idea",
    holdout: true,
    expectedDecisions: ["MONITOR", "IGNORE"],
    reason: "Competitor coverage alone is insufficient.",
    mockSignals: [
      {
        title: "Competitor: 15 web design tips for small business",
        type: "COMPETITOR_COVERAGE",
        provider: "mock",
        sourceAuthorityType: "COMPETITOR",
        freshness: "TIMELY",
      },
    ],
  },
  {
    id: "hold-what-is-lcp",
    seed: "What is Largest Contentful Paint?",
    category: "format-boundary",
    holdout: true,
    expectedDecisions: ["EXPAND_EXISTING_RESOURCE", "WRITE_NEW"],
    expectedFormat: "GLOSSARY",
    reason: "Definitional; Glossary preferred unless deeper business article.",
    mockSignals: [research("What is Largest Contentful Paint LCP definition")],
  },
  {
    id: "hold-analytics-cro",
    seed: "Analytics and conversion tracking for service websites",
    category: "conversion",
    holdout: true,
    expectedDecisions: ["WRITE_NEW", "SUPPORT_COMMERCIAL_PAGE"],
    reason: "Likely weak CRO editorial coverage historically.",
    mockSignals: [research("Conversion tracking setup for service business websites")],
  },
  {
    id: "hold-stock-chatter",
    seed: "Tech stocks surge after earnings",
    category: "bad-idea",
    holdout: true,
    expectedDecisions: ["IGNORE"],
    reason: "Stock chatter noise.",
    mockSignals: [news("Tech stocks surge after earnings shares soar", { summary: "stock price" })],
  },
  {
    id: "hold-hospitality-trust",
    seed: "Hospitality website trust: photos policies availability next steps",
    category: "hospitality",
    holdout: true,
    expectedDecisions: ["WRITE_NEW", "SUPPORT_COMMERCIAL_PAGE", "MONITOR"],
    reason: "Distinct hospitality UX angle vs Airbnb/PriceLabs duplicates.",
    mockSignals: [
      research("Hospitality website trust signals photos policies booking availability"),
    ],
  },
];

export function listTopicCalibrationFixtures(opts?: { includeHoldout?: boolean }) {
  if (opts?.includeHoldout) {
    return [...TOPIC_CALIBRATION_FIXTURES, ...TOPIC_CALIBRATION_HOLDOUT];
  }
  return TOPIC_CALIBRATION_FIXTURES;
}

export function listTopicCalibrationHoldout() {
  return TOPIC_CALIBRATION_HOLDOUT;
}
