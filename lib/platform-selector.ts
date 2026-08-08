/**
 * Deterministic Website Platform Selector evaluation engine.
 * Same answers always produce the same result. No randomness, no percentages.
 */

import {
  getPlatformSelectorCandidate,
  PLATFORM_SELECTOR_SLUGS,
  PURE_COMMERCE_SLUGS,
  type PlatformSelectorSlug,
} from "@/data/tools/platform-selector-candidates";
import {
  getVisiblePlatformSelectorQuestions,
  platformSelectorQuestions,
  type PlatformSelectorOption,
  type PlatformSelectorQuestion,
} from "@/data/tools/website-platform-selector";

export type PlatformRecommendation = {
  slug: PlatformSelectorSlug;
  name: string;
  route: string;
  tier: "primary" | "also" | "special";
  why: string[];
  watchFor: string[];
};

export type PlatformSelectorResult = {
  recommendations: PlatformRecommendation[];
  tiedPrimary: boolean;
  lowConfidence: boolean;
  needsCustomArchitecture: boolean;
  conflictingRequirements: boolean;
  conflictSummary?: string;
  whatSeparatesThem?: string[];
  answerSummary: { label: string; value: string }[];
  related: {
    showWordpressVsWebflow: boolean;
    showProjectBrief: boolean;
    showRedesignGuide: boolean;
    showRedesignChecklist: boolean;
    solutionSlugs: string[];
    serviceHrefs: string[];
  };
  disclaimer: string;
};

type ScoreState = {
  scores: Record<PlatformSelectorSlug, number>;
  reasons: Record<PlatformSelectorSlug, string[]>;
};

const DISCLAIMER =
  "This is a planning aid, not a guarantee that a platform will fit every technical or operational requirement.";

const REASON_COPY: Record<string, string> = {
  "service-content-fit": "service and content-led websites fit this platform well",
  "service-marketing-fit": "marketing-led service sites align with its strengths",
  "managed-service-site": "managed editing suits many service businesses",
  "straightforward-service-site": "straightforward service sites are a common fit",
  "not-store-led": "this project is not primarily store-led",
  "marketing-site-strength": "marketing and company sites are a strong use case",
  "marketing-visual-strength": "visual marketing presentation is a strength",
  "marketing-managed-fit": "managed marketing sites fit the workflow",
  "flexible-marketing-cms": "flexible CMS support for marketing pages",
  "marketing-crm-alignment": "marketing and CRM alignment can help",
  "clean-company-site": "clean company sites fit well",
  "content-library-strength": "you expect a content-heavy publishing model",
  "structured-cms-collections": "structured CMS collections support your content needs",
  "content-marketing-cms": "content marketing workflows align",
  "large-content-caution": "large content libraries need careful evaluation",
  "commerce-first-fit": "commerce is central to the project",
  "wordpress-commerce-fit": "commerce with WordPress content flexibility fits",
  "dedicated-commerce-fit": "a dedicated commerce platform deserves consideration",
  "content-plus-commerce-path": "content and commerce can share one ecosystem",
  "not-commerce-primary": "commerce is not this platform's primary strength",
  "limited-commerce-depth": "deeper commerce requirements may outgrow lighter options",
  "visual-portfolio-strength": "visual portfolio presentation is a strong fit",
  "design-led-portfolio": "design-led portfolio sites align well",
  "creative-portfolio-fit": "creative portfolio sites are a common fit",
  "visual-creative-site": "visual creative sites work well here",
  "custom-portfolio-flexibility": "custom portfolio builds remain flexible",
  "local-managed-fit": "local business sites often suit a managed setup",
  "local-business-editing": "local teams can manage updates practically",
  "local-flexible-cms": "local content and service pages stay flexible",
  "local-marketing-site": "local marketing pages fit this model",
  "landing-page-strength": "landing-page-led marketing is a strong fit",
  "campaign-page-visuals": "campaign and visual landing pages align well",
  "campaign-crm-alignment": "campaign work can stay closer to CRM workflows",
  "managed-landing-pages": "managed landing pages reduce overhead",
  "flexible-landing-pages": "flexible landing page builds remain available",
  "no-commerce-needed": "e-commerce is not required for this project",
  "simple-store-fit": "a simple store is a common fit",
  "small-store-wordpress": "a small store can sit on WordPress commerce",
  "light-commerce-option": "light commerce can work for simpler catalogues",
  "major-commerce-strength": "commerce is a major part of the business",
  "major-commerce-wordpress": "major commerce with content flexibility fits WooCommerce",
  "major-commerce-dedicated": "dedicated commerce platforms deserve a closer look",
  "commerce-not-primary-strength": "commerce depth is not this platform's primary strength",
  "complex-catalogue-fit": "large or complex catalogues are a key signal",
  "catalogue-commerce-strength": "catalogue-led commerce is well supported",
  "flexible-catalogue-commerce": "flexible catalogue commerce remains available",
  "content-plus-catalogue": "content and catalogue can share one stack",
  "not-catalogue-platform": "complex catalogues are not a natural fit",
  "catalogue-depth-caution": "catalogue depth may exceed lighter commerce tools",
  "simple-content-fit": "a small static page set fits well",
  "simple-marketing-content": "simple marketing content is a good match",
  "simple-managed-content": "managed content for a small site is practical",
  "focused-page-set": "a focused page set works well",
  "pages-and-publishing": "pages plus publishing content suit WordPress well",
  "cms-publishing": "CMS publishing supports pages and resources",
  "marketing-content-publishing": "marketing content publishing aligns",
  "pages-and-blog": "pages and a blog are a practical fit",
  "structured-content-strength": "you expect structured content types",
  "cms-collections-strength": "CMS collections support structured content",
  "structured-marketing-content": "structured marketing content is supported",
  "structured-content-caution": "several structured types need careful review",
  "large-content-library": "you expect a large or complex content library",
  "growing-cms-needs": "growing CMS needs should be validated",
  "content-scale-marketing": "content scale within a marketing CMS can help",
  "content-scale-caution": "content scale needs careful evaluation",
  "basic-design-enough": "basic design flexibility is enough",
  "practical-visual-editing": "practical visual editing covers the need",
  "template-plus-custom": "templates plus custom design remain available",
  "theme-based-storefront": "theme-based storefronts can be enough",
  "custom-visual-control": "direct visual design control matters",
  "design-led-build": "a design-led build matches your answers",
  "visual-studio-control": "visual studio-style control aligns",
  "custom-design-supported": "custom design is well supported",
  "frequent-layout-changes": "marketing teams will adjust layouts frequently",
  "designer-led-updates": "designer-led layout updates fit well",
  "team-visual-editing": "team visual editing is a strength",
  "marketing-layout-workflow": "marketing layout workflows align",
  "editor-flexibility": "editor flexibility remains useful",
  "developer-led-builds": "developers will handle most layout changes",
  "dev-capable-visual-platform": "developer-capable visual platforms still fit",
  "theme-dev-workflow": "theme development workflows are available",
  "developer-storefront": "developer-led storefront work fits",
  "standard-features-fit": "standard website features are enough",
  "standard-business-features": "standard business features fit well",
  "standard-marketing-features": "standard marketing features are enough",
  "standard-marketing-build": "a standard marketing build fits",
  "standard-store-features": "standard store features are enough",
  "integration-friendly": "a few integrations are easy to support",
  "common-integrations": "common integrations are available",
  "app-ecosystem": "an app ecosystem covers many needs",
  "marketing-integrations": "marketing integrations align",
  "business-integrations": "business integrations are practical",
  "custom-functionality-strength": "significant custom functionality matters",
  "custom-commerce-extensibility": "custom commerce extensibility helps",
  "custom-with-external-systems": "custom needs may combine platform + external systems",
  "custom-depth-caution": "deep custom functionality may be constrained",
  "extensible-but-evaluate-scope": "extensibility helps, but scope may exceed a standard CMS",
  "commerce-plus-custom-workflows": "commerce plus custom workflows need careful architecture",
  "not-for-complex-backends": "complex backends are not a natural primary fit",
  "complex-backend-caution": "complex backends need careful evaluation",
  "low-integration-fit": "low system dependency suits a simpler stack",
  "low-integration-marketing": "low integration marketing sites fit well",
  "self-contained-site": "a more self-contained site is enough",
  "focused-site-integrations": "focused site integrations are enough",
  "standard-integration-ecosystem": "standard integrations are well supported",
  "standard-marketing-integrations": "standard marketing integrations fit",
  "standard-commerce-apps": "standard commerce apps cover many needs",
  "standard-business-integrations": "standard business integrations fit",
  "marketing-stack-integrations": "marketing stack integrations align",
  "multi-system-integrations": "several important systems need flexible integration",
  "crm-marketing-stack": "CRM and marketing stack alignment can help",
  "commerce-system-connections": "commerce system connections matter",
  "flexible-system-connections": "flexible system connections help",
  "commerce-integration-depth": "commerce integration depth may matter",
  "integration-depth-caution": "integration depth needs careful review",
  "deep-integration-flexibility": "deep or specialized integrations need flexibility",
  "specialized-commerce-integrations": "specialized commerce integrations deserve attention",
  "hub-centered-integrations": "hub-centered integrations may matter",
  "not-for-deep-integrations": "deep specialized integrations are a weak fit",
  "existing-hubspot-stack": "your business already relies heavily on HubSpot",
  "hubspot-native-preference": "a HubSpot-native CMS may reduce glue work",
  "hubspot-not-central": "HubSpot is not central to the business stack",
  "owner-friendly-editing": "business owners can update the site practically",
  "owner-store-management": "owners can manage store operations",
  "owner-content-updates": "owners can handle day-to-day content updates",
  "marketing-team-editing": "marketing teams can manage ongoing updates",
  "content-team-publishing": "content teams can publish regularly",
  "marketing-team-hub": "marketing teams stay closer to CRM workflows",
  "designer-led-workflow": "designers will lead ongoing updates",
  "designer-visual-editing": "designer visual editing fits well",
  "developer-owned-stack": "developers will own the stack after launch",
  "developer-owned-commerce": "developers can own commerce implementation",
  "technical-webflow-builds": "technical teams can still work in Webflow",
  "theme-and-app-development": "theme and app development remains available",
  "multi-role-publishing": "multiple teams need flexible publishing roles",
  "shared-marketing-cms": "shared marketing CMS workflows help",
  "multi-team-marketing-ops": "multi-team marketing operations align",
  "shared-editing-roles": "shared editing roles are practical",
  "agency-visual-delivery": "agency visual delivery fits well",
  "agency-custom-delivery": "agency custom delivery remains flexible",
  "agency-design-delivery": "agency design delivery aligns",
  "agency-store-builds": "agency store builds are common",
  "hosted-low-maintenance": "you prefer the platform to handle infrastructure",
  "hosted-commerce-maintenance": "managed commerce infrastructure reduces overhead",
  "hosted-marketing-cms": "hosted marketing CMS reduces infrastructure work",
  "maintenance-tradeoff": "self-managed stacks need clearer maintenance planning",
  "managed-wordpress-path": "managed WordPress can balance control and support",
  "managed-with-flexibility": "managed setups with some flexibility fit",
  "managed-commerce-flexibility": "managed commerce with flexibility fits",
  "managed-marketing-cms": "managed marketing CMS remains practical",
  "supported-self-managed": "you are comfortable managing with support",
  "supported-self-managed-commerce": "supported self-managed commerce is viable",
  "maximum-infrastructure-control": "maximum technical control matters",
  "control-plus-commerce": "control plus commerce points to WordPress ecosystems",
  "hosted-platform-limits": "hosted platforms limit infrastructure control",
  "hosted-is-fine": "hosted infrastructure is acceptable",
  "hosting-flexibility": "some hosting flexibility is useful",
  "managed-with-options": "managed platforms with options still fit",
  "hosting-control-matters": "control over hosting and infrastructure matters",
  "hosting-control-commerce": "hosting control with commerce remains available",
  "limited-hosting-control": "hosted platforms offer less infrastructure control",
  "commerce-boost": "commerce requirements raise dedicated commerce platforms",
  "complex-backend-primary-caution":
    "complex backends reduce confidence in lighter visual platforms as a primary fit",
};

function emptyScores(): ScoreState {
  const scores = {} as Record<PlatformSelectorSlug, number>;
  const reasons = {} as Record<PlatformSelectorSlug, string[]>;
  for (const slug of PLATFORM_SELECTOR_SLUGS) {
    scores[slug] = 0;
    reasons[slug] = [];
  }
  return { scores, reasons };
}

function pushReason(
  reasons: Record<PlatformSelectorSlug, string[]>,
  platform: PlatformSelectorSlug,
  reason?: string,
) {
  if (!reason) return;
  if (!reasons[platform].includes(reason)) {
    reasons[platform].push(reason);
  }
}

function findOption(
  question: PlatformSelectorQuestion,
  optionId: string,
): PlatformSelectorOption | undefined {
  return question.options.find((option) => option.id === optionId);
}

function reasonToCopy(reason: string): string {
  return REASON_COPY[reason] ?? reason.replace(/-/g, " ");
}

function buildWhy(
  slug: PlatformSelectorSlug,
  reasons: string[],
  limit = 4,
): string[] {
  const bullets = reasons
    .map(reasonToCopy)
    .filter((text, index, list) => list.indexOf(text) === index)
    .slice(0, limit);

  if (bullets.length >= 2) return bullets;

  const candidate = getPlatformSelectorCandidate(slug);
  for (const strength of candidate.strengths) {
    if (bullets.length >= 2) break;
    if (!bullets.includes(strength)) bullets.push(strength);
  }
  return bullets.slice(0, Math.max(2, Math.min(limit, bullets.length || 2)));
}

function buildWatchFor(
  slug: PlatformSelectorSlug,
  answers: Record<string, string>,
): string[] {
  const candidate = getPlatformSelectorCandidate(slug);
  const watch = [...candidate.considerations];

  if (answers["custom-functionality"] === "complex-backend") {
    watch.unshift(
      "Confirm whether requirements need custom or hybrid architecture beyond a standard website platform",
    );
  }
  if (
    answers.commerce === "none" &&
    (slug === "shopify" || slug === "woocommerce" || slug === "bigcommerce")
  ) {
    watch.unshift("E-commerce is not part of the stated requirements");
  }

  return watch.slice(0, 4);
}

function detectConflict(answers: Record<string, string>): {
  conflictingRequirements: boolean;
  conflictSummary?: string;
} {
  const heavyCustom =
    answers["custom-functionality"] === "significant-custom" ||
    answers["custom-functionality"] === "complex-backend";
  const frequentLayouts = answers["design-workflow"] === "marketing-frequent-layouts";
  const platformHandles = answers.maintenance === "platform-handles";
  const hostingControl = answers["hosting-control"] === "very-important";

  if (heavyCustom && frequentLayouts && platformHandles) {
    return {
      conflictingRequirements: true,
      conflictSummary:
        "Your requirements create a trade-off: significant custom functionality, frequent visual layout changes, and a preference for the platform to handle infrastructure pull in different directions. One platform may fit the workflow better; another may fit extensibility better.",
    };
  }

  if (
    answers["custom-functionality"] === "complex-backend" &&
    answers["hosting-control"] === "not-important" &&
    platformHandles
  ) {
    return {
      conflictingRequirements: true,
      conflictSummary:
        "Your requirements create a trade-off: complex backend workflows usually need more architectural control, while your maintenance answers prefer a hosted, low-overhead platform.",
    };
  }

  if (heavyCustom && hostingControl && frequentLayouts) {
    return {
      conflictingRequirements: true,
      conflictSummary:
        "Your requirements create a trade-off between deep custom functionality, hosting control and frequent visual layout changes. Expect to weigh extensibility against design workflow carefully.",
    };
  }

  return { conflictingRequirements: false };
}

function buildAnswerSummary(
  answers: Record<string, string>,
): { label: string; value: string }[] {
  const summary: { label: string; value: string }[] = [];
  const visible = getVisiblePlatformSelectorQuestions(answers);

  for (const question of visible) {
    const answerId = answers[question.id];
    if (!answerId) continue;
    const option = findOption(question, answerId);
    if (!option) continue;
    summary.push({
      label: question.title.replace(/\?$/, ""),
      value: option.label,
    });
  }

  return summary;
}

function buildRelated(
  answers: Record<string, string>,
  recommendationSlugs: PlatformSelectorSlug[],
  lowConfidence: boolean,
  conflictingRequirements: boolean,
  needsCustomArchitecture: boolean,
): PlatformSelectorResult["related"] {
  const showWordpressVsWebflow =
    recommendationSlugs.includes("wordpress") &&
    recommendationSlugs.includes("webflow");

  const redesigning = answers["project-context"] === "redesigning-existing";
  const changingPlatform = answers["project-context"] === "changing-platform";
  const isNew = answers["project-context"] === "no";
  const commerceHeavy =
    answers.commerce === "major-commerce" ||
    answers.commerce === "complex-catalogue" ||
    answers["website-type"] === "online-store";

  const solutionSlugs: string[] = [];
  if (changingPlatform) solutionSlugs.push("website-migration");
  if (redesigning) solutionSlugs.push("outdated-website");
  if (isNew && solutionSlugs.length < 2) solutionSlugs.push("new-business-website");
  if (commerceHeavy && solutionSlugs.length < 2) {
    solutionSlugs.push("ecommerce-growth");
  }

  const serviceHrefs = [
    "/services/website-strategy",
    "/services/website-design",
    "/services/website-development",
  ];
  if (changingPlatform || redesigning) {
    serviceHrefs.push("/services/website-migration");
  } else if (needsCustomArchitecture) {
    serviceHrefs.push("/services/website-strategy");
  } else {
    serviceHrefs.push("/services/website-migration");
  }

  return {
    showWordpressVsWebflow,
    showProjectBrief:
      lowConfidence ||
      conflictingRequirements ||
      answers["website-type"] === "not-sure" ||
      Object.values(answers).filter((value) => value === "not-sure").length >= 3,
    showRedesignGuide: redesigning || changingPlatform,
    showRedesignChecklist: redesigning,
    solutionSlugs: solutionSlugs.slice(0, 2),
    serviceHrefs: [...new Set(serviceHrefs)].slice(0, 4),
  };
}

function whatSeparates(
  a: PlatformSelectorSlug,
  b: PlatformSelectorSlug,
  answers: Record<string, string>,
): string[] {
  const points: string[] = [];

  if (a === "wordpress" || b === "wordpress") {
    points.push(
      "WordPress usually wins when extensibility, hosting control or complex content models matter most",
    );
  }
  if (a === "webflow" || b === "webflow") {
    points.push(
      "Webflow usually wins when marketing teams need direct visual control with structured CMS collections",
    );
  }
  if (a === "shopify" || b === "shopify") {
    points.push(
      "Shopify usually wins when commerce operations and managed store infrastructure are central",
    );
  }
  if (a === "woocommerce" || b === "woocommerce") {
    points.push(
      "WooCommerce usually wins when commerce needs to stay close to a flexible WordPress content site",
    );
  }
  if (a === "framer" || b === "framer") {
    points.push(
      "Framer usually wins when polished visual marketing matters more than deep backend complexity",
    );
  }
  if (a === "hubspot-cms" || b === "hubspot-cms") {
    points.push(
      "HubSpot CMS usually wins when the business already runs marketing and CRM through HubSpot",
    );
  }
  if (a === "wix-studio" || b === "wix-studio" || a === "squarespace" || b === "squarespace") {
    points.push(
      "Managed visual platforms usually win when lower infrastructure overhead and practical editing matter most",
    );
  }

  if (answers.commerce === "major-commerce" || answers.commerce === "complex-catalogue") {
    points.push("Commerce depth and catalogue complexity remain decisive");
  }
  if (answers["hosting-control"] === "very-important") {
    points.push("Hosting and infrastructure control remains a deciding factor");
  }
  if (answers["design-workflow"] === "marketing-frequent-layouts") {
    points.push("Who owns layout changes after launch remains a deciding factor");
  }

  return points.slice(0, 4);
}

export function evaluatePlatformSelector(
  answers: Record<string, string>,
): PlatformSelectorResult {
  const { scores, reasons } = emptyScores();
  const visibleQuestions = getVisiblePlatformSelectorQuestions(answers);

  for (const question of visibleQuestions) {
    const answerId = answers[question.id];
    if (!answerId) continue;
    const option = findOption(question, answerId);
    if (!option) continue;

    for (const signal of option.signals) {
      scores[signal.platform] += signal.weight;
      if (signal.weight > 0 || signal.reason) {
        pushReason(reasons, signal.platform, signal.reason);
      }
    }
  }

  const commerce = answers.commerce;
  if (commerce === "none") {
    for (const slug of PURE_COMMERCE_SLUGS) {
      scores[slug] -= 3;
      pushReason(reasons, slug, "no-commerce-needed");
    }
  } else if (commerce === "major-commerce" || commerce === "complex-catalogue") {
    for (const slug of PURE_COMMERCE_SLUGS) {
      scores[slug] += 1;
      pushReason(reasons, slug, "commerce-boost");
    }
  }

  const needsCustomArchitecture =
    answers["custom-functionality"] === "complex-backend";

  if (needsCustomArchitecture) {
    for (const slug of ["framer", "squarespace", "wix-studio"] as PlatformSelectorSlug[]) {
      scores[slug] -= 2;
      pushReason(reasons, slug, "complex-backend-primary-caution");
    }
  }

  const answeredEntries = Object.entries(answers).filter(([, value]) => Boolean(value));
  const notSureCount = answeredEntries.filter(([, value]) => value === "not-sure").length;
  const lowConfidence =
    notSureCount >= 5 ||
    (answeredEntries.length > 0 && notSureCount / answeredEntries.length >= 0.5);

  const { conflictingRequirements, conflictSummary } = detectConflict(answers);

  const ranked = [...PLATFORM_SELECTOR_SLUGS]
    .map((slug) => ({ slug, score: scores[slug] }))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.slug.localeCompare(b.slug);
    });

  const excludePureCommerce = commerce === "none";
  const eligible = ranked.filter((item) => {
    if (excludePureCommerce && PURE_COMMERCE_SLUGS.includes(item.slug)) {
      return false;
    }
    return true;
  });

  const top = eligible[0];
  const second = eligible[1];
  const tiedPrimary = Boolean(
    top && second && Math.abs(top.score - second.score) <= 2,
  );

  const recommendations: PlatformRecommendation[] = [];

  if (top) {
    recommendations.push({
      slug: top.slug,
      name: getPlatformSelectorCandidate(top.slug).name,
      route: getPlatformSelectorCandidate(top.slug).route,
      tier: "primary",
      why: buildWhy(top.slug, reasons[top.slug]),
      watchFor: buildWatchFor(top.slug, answers),
    });
  }

  if (tiedPrimary && second) {
    recommendations.push({
      slug: second.slug,
      name: getPlatformSelectorCandidate(second.slug).name,
      route: getPlatformSelectorCandidate(second.slug).route,
      tier: "primary",
      why: buildWhy(second.slug, reasons[second.slug]),
      watchFor: buildWatchFor(second.slug, answers),
    });
  }

  const alsoStartIndex = tiedPrimary ? 2 : 1;
  const alsoCount = tiedPrimary ? 1 : 2;
  for (let i = alsoStartIndex; i < alsoStartIndex + alsoCount; i += 1) {
    const item = eligible[i];
    if (!item) break;
    // Skip very weak also-rans relative to top
    if (top && item.score < top.score - 8) break;
    recommendations.push({
      slug: item.slug,
      name: getPlatformSelectorCandidate(item.slug).name,
      route: getPlatformSelectorCandidate(item.slug).route,
      tier: "also",
      why: buildWhy(item.slug, reasons[item.slug], 3),
      watchFor: buildWatchFor(item.slug, answers),
    });
  }

  // Special: HubSpot strongly signaled but not already in shortlist
  const hubspotAnswer = answers["hubspot-usage"];
  if (
    hubspotAnswer === "yes" &&
    !recommendations.some((item) => item.slug === "hubspot-cms")
  ) {
    const hubspotScore = scores["hubspot-cms"];
    if (top && hubspotScore >= top.score - 4) {
      recommendations.push({
        slug: "hubspot-cms",
        name: getPlatformSelectorCandidate("hubspot-cms").name,
        route: getPlatformSelectorCandidate("hubspot-cms").route,
        tier: "special",
        why: buildWhy("hubspot-cms", reasons["hubspot-cms"], 3),
        watchFor: buildWatchFor("hubspot-cms", answers),
      });
    }
  }

  const recommendationSlugs = recommendations.map((item) => item.slug);
  const related = buildRelated(
    answers,
    recommendationSlugs,
    lowConfidence,
    conflictingRequirements,
    needsCustomArchitecture,
  );

  return {
    recommendations,
    tiedPrimary,
    lowConfidence,
    needsCustomArchitecture,
    conflictingRequirements,
    conflictSummary,
    whatSeparatesThem:
      tiedPrimary && top && second
        ? whatSeparates(top.slug, second.slug, answers)
        : undefined,
    answerSummary: buildAnswerSummary(answers),
    related,
    disclaimer: DISCLAIMER,
  };
}

export function buildPlatformSelectorPlainText(
  result: PlatformSelectorResult,
): string {
  const lines: string[] = [];
  lines.push("Website Platform Selector Results");
  lines.push("Smartlance Designs");
  lines.push("");
  lines.push("Project requirements");
  for (const item of result.answerSummary) {
    lines.push(`- ${item.label}: ${item.value}`);
  }
  lines.push("");

  if (result.lowConfidence) {
    lines.push("Your requirements are still broad.");
    lines.push("");
  }
  if (result.needsCustomArchitecture) {
    lines.push(
      "Standard website platforms may not cover the full requirement. Custom or hybrid architecture may need evaluation.",
    );
    lines.push("");
  }
  if (result.conflictingRequirements && result.conflictSummary) {
    lines.push(result.conflictSummary);
    lines.push("");
  }
  if (result.tiedPrimary) {
    lines.push("Two platforms deserve a closer look.");
    if (result.whatSeparatesThem?.length) {
      lines.push("What separates them?");
      for (const point of result.whatSeparatesThem) {
        lines.push(`- ${point}`);
      }
    }
    lines.push("");
  }

  for (const recommendation of result.recommendations) {
    const tierLabel =
      recommendation.tier === "primary"
        ? "Strong fit to consider"
        : recommendation.tier === "also"
          ? "Also worth considering"
          : "Special consideration";
    lines.push(`${tierLabel}: ${recommendation.name}`);
    lines.push(`Explore: ${recommendation.route}`);
    lines.push("Why it appears here:");
    for (const why of recommendation.why) {
      lines.push(`- ${why}`);
    }
    lines.push("Watch for:");
    for (const watch of recommendation.watchFor) {
      lines.push(`- ${watch}`);
    }
    lines.push("");
  }

  lines.push(result.disclaimer);
  return lines.join("\n");
}

/** Lookup helpers used by UI and tests */
export function getPlatformSelectorQuestionById(
  id: string,
): PlatformSelectorQuestion | undefined {
  return platformSelectorQuestions.find((question) => question.id === id);
}
